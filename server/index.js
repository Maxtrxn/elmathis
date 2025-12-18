import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
import express from 'express';
import cors from 'cors';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import fs from 'fs';
// --- CHARGEMENT DU FICHIER JSON ---
const creds = JSON.parse(fs.readFileSync('./service-account.json', 'utf-8'));

// NOUVEAU : Imports pour Discord
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
if (!process.env.TOKEN_DISCORD) {
    dotenv.config({ path: '../.env' });
}
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { loadHandlers } from './discord/handlers/mainHandlers.js';

const app = express();
const PORT = 3001;

// --- CONFIGURATION ---
const SPREADSHEET_ID = '1ixpXyauEd1y11whPBxCXsNVolC1DC81k2xJv9Tuw-iI'; 

app.use(cors());
app.use(express.json());

// --- CONFIGURATION DISCORD ---
// Remplace ces valeurs par celles de ton portail développeur !
const TOKEN_DISCORD = process.env.TOKEN_DISCORD;
const {
    DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET,
    DISCORD_REDIRECT_URI,
    FRONTEND_URL,
} = process.env;

// --- 🤖 INITIALISATION DU BOT DISCORD ---
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// On lance le chargement des commandes et la connexion du bot
(async () => {
    try {
        await loadHandlers(client);
        await client.login(TOKEN_DISCORD);
        console.log("🤖 Bot Discord connecté avec succès !");
    } catch (error) {
        console.error("❌ Erreur au démarrage du bot :", error);
    }
})();

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

// --- NOUVEAU : ROUTES OAUTH DISCORD ---

// 1. Route qui redirige l'utilisateur vers Discord
app.get('/auth/login', (req, res) => {
    const scope = 'identify'; // On demande juste l'identité (pseudo/avatar)
    const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=${scope}`;
    console.log("------------------------------------------------");
    console.log("👉 URL générée :", url);
    console.log("👉 Redirect URI attendue :", DISCORD_REDIRECT_URI);
    console.log("------------------------------------------------");

    res.redirect(url);
});

// 2. Route de retour (Callback)
app.get('/auth/discord/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send("Pas de code fourni par Discord.");
    }

    try {
        // A. Échanger le code contre un token d'accès
        const tokenResponse = await axios.post(
            'https://discord.com/api/oauth2/token',
            new URLSearchParams({
                client_id: DISCORD_CLIENT_ID,
                client_secret: DISCORD_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: DISCORD_REDIRECT_URI,
                scope: 'identify',
            }).toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const accessToken = tokenResponse.data.access_token;

        // B. Utiliser le token pour récupérer les infos de l'utilisateur
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const user = userResponse.data; // { id, username, avatar, discriminator, ... }

        // C. Rediriger vers le Frontend avec les infos en paramètre d'URL
        // (Méthode simple pour éviter une base de données pour l'instant)
        const redirectUrl = `${FRONTEND_URL}/?username=${encodeURIComponent(user.username)}&id=${user.id}&avatar=${user.avatar}`;
        res.redirect(redirectUrl);

    } catch (error) {
        console.error("Erreur OAuth Discord:", error);
        res.status(500).send("Erreur lors de la connexion Discord.");
    }
});

// --- LANCEMENT ---
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 SERVEUR TOUT-EN-UN PRÊT SUR LE PORT ${PORT}`);
    console.log(`Testez ce lien : http://localhost:${PORT}/api/students`);
    console.log(`=========================================`);
});