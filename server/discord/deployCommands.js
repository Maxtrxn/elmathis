import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// --- 1. CONFIGURATION DES CHEMINS ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// On pointe vers le fichier .env qui est (probablement) 2 dossiers plus haut
// Ajuste le '../..' si ton .env est ailleurs
dotenv.config({ path: path.join(__dirname, '../../.env') });

// --- 2. VERIFICATION DES VARIABLES (DEBUG) ---
// On essaie les deux noms courants pour éviter les erreurs
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID || process.env.GUILD_ID;
const TOKEN = process.env.TOKEN_DISCORD || process.env.DISCORD_TOKEN;

console.log("--- DEBUG ENV ---");
console.log(`Client ID : ${CLIENT_ID ? "✅ Trouvé" : "❌ MANQUANT (Vérifie .env)"}`);
console.log(`Guild ID  : ${GUILD_ID ? "✅ Trouvé" : "❌ MANQUANT (Vérifie .env)"}`);
console.log(`Token     : ${TOKEN ? "✅ Trouvé" : "❌ MANQUANT (Vérifie .env)"}`);
console.log("-----------------");

if (!CLIENT_ID || !GUILD_ID || !TOKEN) {
  console.error("⛔ ERREUR : Une variable d'environnement manque. Arrêt.");
  process.exit(1);
}

// --- 3. CHARGEMENT DES COMMANDES ---
const commandsPath = path.join(__dirname, 'commands');

if (!fs.existsSync(commandsPath)) {
  console.error(`❌ ERREUR : Dossier commands introuvable ici : ${commandsPath}`);
  process.exit(1);
}

const commands = [];
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(`file://${filePath}`);

  if ('data' in command.default && 'execute' in command.default) {
    commands.push(command.default.data.toJSON());
  } else {
    console.log(`[PASSÉ] ${file} n'est pas valide.`);
  }
}

// --- 4. ENVOI A DISCORD ---
const rest = new REST({ version: '10' }).setToken(TOKEN);

try {
  console.log(`⏳ Envoi de ${commands.length} commandes...`);

  await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
  );

  console.log("✅ Succès ! Tes commandes sont prêtes.");
} catch (error) {
  console.error("❌ Erreur API Discord :", error);
}