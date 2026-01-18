// --- IMPORTS ---
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
import express from 'express';
import cors from 'cors';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3'; // <--- BDD
import { v4 as uuidv4 } from 'uuid'; // <--- Générateur de Token

// Gestion des chemins .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
if (!process.env.TOKEN_DISCORD) dotenv.config({ path: path.join(__dirname, '.env') });

const {
    TOKEN_DISCORD, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET,
    DISCORD_REDIRECT_URI, FRONTEND_URL
} = process.env;

const app = express();
const PORT = process.env.PORT;
const SPREADSHEET_ID = '1D6Y-DXBZ1_uCkmbLrgiFUSIkHSbbCIrJYMeE4z6s1lw';

// --- 💾 BASE DE DONNÉES (SQLite) ---
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) console.error("Erreur BDD:", err.message);
    else console.log("💾 Connecté à la base de données SQLite.");
});

// Création de la table session si elle n'existe pas
db.run(`CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    discord_id TEXT,
    username TEXT,
    avatar TEXT,
    created_at INTEGER,
    expires_at INTEGER
)`);

app.use(cors());
app.use(express.json());

// --- GOOGLE SHEET SETUP ---
const creds = JSON.parse(fs.readFileSync('./service-account.json', 'utf-8'));
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

// 1. Authentification Discord (Modifiée pour BDD)
app.get('/auth/login', (req, res) => {
    const scope = 'identify';
    const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=${scope}`;
    res.redirect(url);
});

app.get('/auth/discord/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("Pas de code.");

    try {
        // Echange Code -> Access Token
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

        // Récupération User Info
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
        });

        const user = userResponse.data;

        // --- CRÉATION DU TOKEN EN BDD ---
        const token = uuidv4(); // Génère un token unique (ex: "550e8400-e29b...")
        const now = Date.now();
        const expiresAt = now + (10 * 60 * 1000); // Expire dans 10 minutes

        // On insère dans la BDD
        db.run(`INSERT INTO sessions (token, discord_id, username, avatar, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)`,
            [token, user.id, user.username, user.avatar, now, expiresAt],
            (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Erreur BDD");
                }
                // On redirige vers le front AVEC LE TOKEN SEULEMENT (plus sécurisé)
                res.redirect(`${FRONTEND_URL}/?token=${token}`);
            }
        );

    } catch (error) {
        console.error("Erreur Auth:", error);
        res.status(500).send("Erreur Auth.");
    }
});

// 2. Route pour que le front récupère l'user via le token
app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

    if (!token) return res.status(401).json({ error: "Token manquant" });

    // On cherche le token dans la BDD
    db.get("SELECT * FROM sessions WHERE token = ?", [token], (err, row) => {
        if (err) return res.status(500).json({ error: "Erreur BDD" });

        if (!row) return res.status(401).json({ error: "Token invalide" });

        // Vérification expiration
        if (Date.now() > row.expires_at) {
            // Optionnel : on pourrait supprimer le token expiré ici
            return res.status(401).json({ error: "Session expirée" });
        }

        // Tout est bon, on renvoie l'user
        res.json({
            id: row.discord_id,
            username: row.username,
            avatar: row.avatar,
            token: row.token // On renvoie le token pour confirmation
        });
    });
});

// 3. ADMIN : Liste des utilisateurs connectés
app.get('/api/admin/users', (req, res) => {
    // Dans la vraie vie, il faudrait vérifier ici que le demandeur EST admin
    // Pour l'exercice, on laisse ouvert ou on check le header token comme dans /me
    db.all("SELECT * FROM sessions", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // On filtre ceux qui ne sont pas expirés pour l'affichage
        const activeSessions = rows.filter(r => r.expires_at > Date.now());
        res.json(activeSessions);
    });
});

// 4. ADMIN : Déconnecter (KICK) un utilisateur
app.delete('/api/admin/users/:token', (req, res) => {
    const { token } = req.params;
    db.run("DELETE FROM sessions WHERE token = ?", [token], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Utilisateur déconnecté", changes: this.changes });
    });
});

// --- ROUTES SHEET EXISTANTES (ETUDIANTS, BATCH UPDATE...) ---
// (Garde tes routes existantes /api/students, /api/schedule/:id, /api/schedule/batch/:id ici)
// ...
app.get('/api/students', async (req, res) => {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();
        const students = rows.map(row => ({ name: row.get('Nom'), id: row.get('ID') }));
        res.json(students);
    } catch (e) { res.status(500).json({error:e.message}); }
});

app.get('/api/schedule/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await getDoc();
        const sheet = doc.sheetsByIndex.find(s => s.title.includes(id));
        if (!sheet) return res.status(404).json({ error: "Introuvable" });
        await sheet.loadCells('A1:F15');
        let lastUpdate = "Inconnue";
        try { lastUpdate = sheet.getCell(13, 1).value || "Non daté"; } catch(e) {}
        const schedule = { Lundi: [], Mardi: [], Mercredi: [], Jeudi: [], Vendredi: [] };
        const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
        for (let row = 1; row <= 10; row++) {
            const hour = sheet.getCell(row, 0).value;
            if(!hour) continue;
            days.forEach((day, index) => {
                const course = sheet.getCell(row, index + 1).value;
                if (course) schedule[day].push(`${hour}h: ${course}`);
            });
        }
        res.json({ id, name: sheet.title, lastUpdate, schedule });
    } catch (e) { res.status(500).json({error:e.message}); }
});

app.post('/api/schedule/batch/:id', async (req, res) => {
    // ... Copie ta route batch existante ici ...
    const { id } = req.params;
    const { updates } = req.body;
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByIndex.find(s => s.title.includes(id));
        if (!sheet) return res.status(404).json({ error: "Feuille introuvable" });
        await sheet.loadCells('A1:F15');
        const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
        updates.forEach(update => {
            const colIndex = days.indexOf(update.day) + 1;
            const rowIndex = (parseInt(update.hour) - 8) + 1;
            if (colIndex >= 1 && rowIndex >= 0 && rowIndex <= 15) {
                const cell = sheet.getCell(rowIndex, colIndex);
                cell.value = update.course;
            }
        });
        const dateCell = sheet.getCell(13, 1);
        dateCell.value = new Date().toLocaleDateString('fr-FR');
        await sheet.saveUpdatedCells();
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.listen(PORT, () => console.log(`🚀 Serveur BDD prêt sur ${PORT}`));