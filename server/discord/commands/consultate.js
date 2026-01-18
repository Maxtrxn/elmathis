import { SlashCommandBuilder } from 'discord.js';
import { fetchSchedule } from "../utils/fetchBackend.js";

export default {
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
            .setDescription("Heure de consultation")
            .setRequired(false)
            .setMinValue(8)
            .setMaxValue(17)
        ),

    async execute(interaction) {
        const etudiant = interaction.options.getString("etudiant");
        const jour = interaction.options.getString("jour");
        const heure = interaction.options.getInteger("heure");
        
        await interaction.deferReply();

        if (heure !== null && !jour) {
            return interaction.editReply("Erreur : si l'heure est renseignée, il faut aussi renseigner le jour.");
        }

        const data = await fetchSchedule(etudiant);

        const name = data.name || etudiant;
        const lastUpdate = data.lastUpdate || "Inconnue";
        const schedule = data.schedule || {};

        const msg =" Emploi du temps de " + name + "\n(dernière modification le " + lastUpdate + ")\n";

        if (jour === null && heure === null) {
            let message = msg;
            const jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

            for (let j of jours) {
                message += "\n" + j + ":\n";

                if (schedule[j] && schedule[j].length > 0) {
                    for (let cours of schedule[j]) {
                        message += "- " + cours + "\n";
                    }
                } else {
                    message += "- vide\n";
                }
            }

            if (message.length > 1900) {
                message = message.slice(0, 1900) + "\n...(trop long)";
            }

            return interaction.editReply(message);
        }


        else if (jour !== null && heure === null) {
            let message = msg;
            message += jour + ":\n";

            if (schedule[jour] && schedule[jour].length > 0) {
                for (let cours of schedule[jour]) {
                    message += "- " + cours + "\n";
                }
            } else {
                message += "- vide\n";
            }

            return interaction.editReply(message);
        }


        else if (jour !== null && heure !== null) {
            let message = msg;
            message += jour + " à " + heure + "h :\n";

            let trouve = false;

            if (schedule[jour]) {
                for (let cours of schedule[jour]) {
                    if (cours.startsWith(heure + "h:")) {
                        message += "- " + cours;
                        trouve = true;
                    }
                }
            }

            if (!trouve) {
                message += "- vide";
            }

            return interaction.editReply(message);
        }


        return interaction.editReply("Erreur dans les paramètres.");
    },
};
