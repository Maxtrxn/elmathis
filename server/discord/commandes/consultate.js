import { SlashCommandBuilder } from 'discord.js';

export default {
    // La définition (data)
    data: new SlashCommandBuilder()
        .setName('bdh-consult')
        .setDescription("Consulter l'emploi du temps d'un élève")
        .addStringOption(option => 
            option.setName("etudiant")
            .setDescription("ID Discord")
            .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("jour")
            .setDescription("Jour de consultation")
            .setRequired(false)
        )
        .addStringOption(option =>
            option.setName("heure")
            .setDescription("Heure de consultation")
            .setRequired(false)
        ),

    // L'action (execute)
    async execute(interaction) {
        const etudiant = interaction.options.getString("etudiant");
        const jour = interaction.options.getString("jour");
        const heure = interaction.options.getString("heure");
        
        await interaction.deferReply();
        let data;

        if (etudiant && !jour && !heure) {
            // option etudiant uniquement
            data = await fetchBackend({ etudiant });

        }
        else if (etudiant && jour && !heure) {
            // options etudiant et jour
            data = await fetchBackend({ etudiant, jour });

        }
        else if (etudiant && jour && heure) {
            // toutes les options remplies
            data = await fetchBackend({ etudiant, jour, heure });

        }
        else {
            //mauvais nombre d'options
            return interaction.editReply("Mauvais nombre d'arguments");
        }

        await interaction.editReply(data);
    },
};
