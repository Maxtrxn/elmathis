import { SlashCommandBuilder } from 'discord.js';

export default {
    // La définition (data)
    data: new SlashCommandBuilder()
        .setName('bdh-update')
        .setDescription("Mettre à jour son emploi du temps")
        .addStringOption(option =>
            option.setName("jour")
            .setDescription("Jour du cours à modifier")
            .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("heure")
            .setDescription("Heure de cours à modifier")
            .setRequired(true)
        ),

    // L'action (execute)
    async execute(interaction) {
        const jour = interaction.options.getString("jour");
        const heure = interaction.options.getString("heure");
        
        await interaction.deferReply();
        // setRequired est mis en true en haut
        // donc pas besoin de testé si les paramètres sont définies.
        const data = await fetchBackend({ jour, heure });

        await interaction.editReply(data);
    },
};
