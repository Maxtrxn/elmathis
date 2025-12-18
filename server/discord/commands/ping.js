import { SlashCommandBuilder } from 'discord.js';

export default {
    // La définition (data)
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Répond avec Pong!'),

    // L'action (execute)
    async execute(interaction) {
        await interaction.reply(`Pong ! 🏓 a toi ${interaction.user} `);
    },
};