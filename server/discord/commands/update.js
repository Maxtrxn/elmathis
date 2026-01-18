import { SlashCommandBuilder } from 'discord.js';
import { batchUpdateSchedule } from "../utils/fetchBackend.js";

export default {
    data: new SlashCommandBuilder()
        .setName('bdh-update')
        .setDescription("Mettre à jour son emploi du temps")
        .addStringOption(option =>
            option.setName("jour")
            .setDescription("Jour du cours à modifier")
            .setRequired(true)
            .addChoices(
                { name: "Lundi", value: "Lundi" },
                { name: "Mardi", value: "Mardi" },
                { name: "Mercredi", value: "Mercredi" },
                { name: "Jeudi", value: "Jeudi" },
                { name: "Vendredi", value: "Vendredi" }
            )
        )
        .addIntegerOption(option =>
            option.setName("heure")
            .setDescription("Heure de cours à modifier")
            .setRequired(true)
            .setMinValue(8)
            .setMaxValue(17)
        )
        .addStringOption(option =>
            option.setName("cours")
            .setDescription("Nom du cours, écrire VIDE pour supprimer")
            .setRequired(true)
        ),

    async execute(interaction) {
        const jour = interaction.options.getString("jour");
        const heure = interaction.options.getInteger("heure");
        const cours = interaction.options.getString("cours");
        const etudiantId = interaction.user.id;
        let coursReturn = cours;
        if (coursReturn.trim().toUpperCase() === "VIDE") {
            coursReturn = "";
        }
        
        await interaction.deferReply({ ephemeral: true });

        const res = await batchUpdateSchedule(etudiantId, [
        { day: jour, hour: heure, course: coursReturn }
        ]);


        if (res && res.success) {
            await interaction.editReply("Modification effectuée : " + jour + " " + heure + "h -> " + (coursReturn || "(vide)"));

        } else {
            await interaction.editReply("Erreur : mise à jour impossible.");
        }

    },
};
