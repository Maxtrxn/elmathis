import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
import express from 'express';
import cors from 'cors';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import fs from 'fs';

// --- CHARGEMENT DU FICHIER JSON ---
const creds = JSON.parse(fs.readFileSync('./service-account.json', 'utf-8'));

const app = express();
const PORT = 3001;

// --- CONFIGURATION ---
const SPREADSHEET_ID = '1ixpXyauEd1y11whPBxCXsNVolC1DC81k2xJv9Tuw-iI'; 

app.use(cors());
app.use(express.json());

// --- FONCTIONS GOOGLE SHEET ---

// Auth
const serviceAccountAuth = new JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function getDoc() {
  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  return doc;
}

// --- ROUTES ---

// 1. Route de test simple (pour vérifier que le serveur vit)
app.get('/', (req, res) => {
    res.send("Le serveur marche ! Tentez /api/students");
});

// 2. La liste des étudiants
app.get('/api/students', async (req, res) => {
    console.log("-> Reçu : Demande de la liste des étudiants");
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByIndex[0]; // Feuille 1
        const rows = await sheet.getRows();

        // On log pour voir ce qu'on trouve
        console.log(`-> J'ai trouvé ${rows.length} lignes dans le Sheet.`);

        const students = rows.map(row => ({
            name: row.get('Nom'), // suppose que tu as bien mis 'Nom' en A1
            id: row.get('ID')     // suppose que tu as bien mis 'ID' en B1
        }));

        res.json(students);
    } catch (error) {
        console.error("!!! ERREUR LISTE :", error);
        res.status(500).json({ error: error.message });
    }
});

// 3. Le détail (Emploi du temps)
app.get('/api/schedule/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`-> Reçu : Demande EDT pour ID ${id}`);
    
    try {
        const doc = await getDoc();
        // Recherche de l'onglet qui contient l'ID dans son titre
        const sheet = doc.sheetsByIndex.find(s => s.title.includes(id));

        if (!sheet) {
            console.log(`-> Pas de feuille trouvée pour l'ID ${id}`);
            return res.status(404).json({ error: "Feuille introuvable pour cet ID" });
        }

        await sheet.loadCells('A1:F15');
        
        // Sécurité : si la case date est vide, on met un texte par défaut
        let lastUpdate = "Inconnue";
        try { lastUpdate = sheet.getCell(13, 1).value || "Non daté"; } catch(e) {}

        const schedule = { Lundi: [], Mardi: [], Mercredi: [], Jeudi: [], Vendredi: [] };
        const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

        for (let row = 1; row <= 10; row++) {
            const hour = sheet.getCell(row, 0).value;
            if(!hour) continue; // Si pas d'heure, on passe

            days.forEach((day, index) => {
                const course = sheet.getCell(row, index + 1).value;
                if (course) schedule[day].push(`${hour}h: ${course}`);
            });
        }

        res.json({ id, name: sheet.title, lastUpdate, schedule });

    } catch (error) {
        console.error("!!! ERREUR EDT :", error);
        res.status(500).json({ error: error.message });
    }
});

// --- LANCEMENT ---
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 SERVEUR TOUT-EN-UN PRÊT SUR LE PORT ${PORT}`);
    console.log(`Testez ce lien : http://localhost:${PORT}/api/students`);
    console.log(`=========================================`);
});

app.post('/api/schedule/:id', async (req, res) => {
    const { id } = req.params;
    const { day, hour, course } = req.body; // ex: { day: "Mardi", hour: 10, course: "React" }
    
    console.log(`-> Modification demandée : ${day} ${hour}h = ${course}`);

    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByIndex.find(s => s.title.includes(id));

        if (!sheet) return res.status(404).json({ error: "Feuille introuvable" });

        // On charge les cellules (Plage A1:F15 pour être large)
        await sheet.loadCells('A1:F15');

        // 1. Trouver la colonne du jour (Lundi=1, Mardi=2...)
        const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
        const colIndex = days.indexOf(day) + 1; // +1 car col A est l'heure

        // 2. Trouver la ligne de l'heure
        const rowIndex = (parseInt(hour) - 8) + 1;

        if (colIndex < 1 || rowIndex < 0) {
            return res.status(400).json({ error: "Jour ou heure invalide" });
        }

        // 3. Modifier la cellule du cours
        const cell = sheet.getCell(rowIndex, colIndex);
        cell.value = course; // Si vide, ça efface le cours

        // 4. Mettre à jour la date de modif (Case B14 -> index 13, 1)
        const dateCell = sheet.getCell(13, 1);
        dateCell.value = new Date().toLocaleDateString('fr-FR');

        // 5. Sauvegarder sur Google
        await sheet.saveUpdatedCells();

        res.json({ success: true });

    } catch (error) {
        console.error("!!! ERREUR MODIF :", error);
        res.status(500).json({ error: error.message });
    }
});