import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import 'dotenv/config'

const { TOKEN_DISCORD, ID_BOT_DICORD } = process.env;


const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// --- 1. Définition des commandes ---
const commands = [
    {
        name: 'ping',
        description: 'Répond avec Pong!',
    },
];

const rest = new REST({ version: '10' }).setToken(TOKEN_DISCORD);

// --- 2. Enregistrement des commandes au démarrage ---
(async () => {
    try {
        console.log('Enregistrement des commandes...');

        // Enregistre les commandes pour tous les serveurs (peut prendre 1h à se mettre à jour)
        // Pour tester instantanément, utilise Routes.applicationGuildCommands(CLIENT_ID, 'ID_DU_SERVEUR')
        await rest.put(Routes.applicationCommands(ID_BOT_DICORD), { body: commands });

        console.log('Commandes enregistrées avec succès !');
    } catch (error) {
        console.error(error);
    }
})();

// --- 3. Gestion de l'interaction (Réponse) ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'ping') {
        await interaction.reply(`Pong ! 🏓 a toi ${interaction.user} `);
    }
});

client.login(TOKEN_DISCORD);