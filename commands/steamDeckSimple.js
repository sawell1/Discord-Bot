const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('steamdeck')
        .setDescription('Prüft ob das Steam Deck derzeit im Angebot ist'),
        
    async execute(interaction) {
        await interaction.deferReply();

        try {
            // Einfache Version ohne externe API-Calls für Debugging
            const embed = new EmbedBuilder()
                .setTitle('🎮 Steam Deck Status')
                .setDescription('ℹ️ **Steam Deck Checker ist aktiv!**')
                .addFields(
                    { name: 'Status', value: 'Checker funktioniert', inline: true },
                    { name: 'Link', value: '[Zum Steam Store](https://store.steampowered.com/app/1675200/Steam_Deck/)', inline: false },
                    { name: 'Debug', value: 'Vereinfachte Version für Tests', inline: false }
                )
                .setColor('#0099ff')
                .setTimestamp()
                .setFooter({ text: 'Steam Deck Checker - Debug Mode' });

            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Fehler im steamdeck command:', error);
            
            try {
                await interaction.editReply({ 
                    content: 'Es gab einen Fehler beim Steam Deck Checker. Siehe Bot-Logs für Details.',
                    ephemeral: true 
                });
            } catch (replyError) {
                console.error('Fehler beim Senden der Fehler-Antwort:', replyError);
            }
        }
    },
};