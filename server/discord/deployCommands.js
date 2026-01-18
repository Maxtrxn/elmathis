import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const TOKEN = process.env.TOKEN_DISCORD;

const commandsDir = path.join(__dirname, "commands");
if (!fs.existsSync(commandsDir)) {
  console.error("commandsDir introuvable: ${commandsDir}");
  process.exit(1);
}
const files = fs.readdirSync(commandsDir).filter(f => f.endsWith(".js"));
const commands = [];


for (const file of files) {
  const filePath = path.join(commandsDir, file);
  const mod = await import(pathToFileURL(filePath).href);
  const cmd = mod.default;

  if (cmd?.data && cmd?.execute) {
    commands.push(cmd.data.toJSON());
  }
}


const rest = new REST({ version: '10' }).setToken(TOKEN);

try {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
  console.log('Deploiement de la commande ${commands.length}.');
} catch (err) {
  console.error("Erreur de deploiement Discord:", err);
  process.exit(1);
}