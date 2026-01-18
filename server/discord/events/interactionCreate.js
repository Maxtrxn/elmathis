export default {
    name: 'interactionCreate',
    once: false,
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`Aucune commande trouvée pour ${interaction.commandName}`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);

            const msg = "Il y a eu une erreur en exécutant cette commande !";

            if (interaction.deferred) {
                await interaction.editReply(msg);

            } else if (interaction.replied) {
                await interaction.followUp({ content: msg, ephemeral: true });

            } else {
                await interaction.reply({ content: msg, ephemeral: true });
            }
        }
    },
};