export default {
    name: 'interactionCreate',
    once: false, // Cet événement s'active plusieurs fois (à chaque commande)
    async execute(interaction, client) {
        // Si ce n'est pas une commande, on ignore
        if (!interaction.isChatInputCommand()) return;

        // On récupère la commande dans la collection du client
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`Aucune commande trouvée pour ${interaction.commandName}`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Il y a eu une erreur en exécutant cette commande !', ephemeral: true });
        }
    },
};