const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('steamdeck-info')
        .setDescription('Zeige Steam Deck Checker Informationen'),
        
    async execute(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('🎮 Steam Deck Checker Info')
                .setDescription('**Debug-Informationen zum Steam Deck Checker**')
                .addFields(
                    { name: 'Status', value: '🟢 Bot läuft', inline: true },
                    { name: 'Version', value: 'Debug Mode', inline: true },
                    { name: 'Environment', value: process.env.NODE_ENV || 'production', inline: true },
                    { name: 'Channel ID gesetzt', value: process.env.STEAM_DECK_CHANNEL_ID ? '✅ Ja' : '❌ Nein', inline: true },
                    { name: 'Commands', value: '• `/steamdeck` - Status prüfen\n• `/steamdeck-info` - Diese Info', inline: false }
                )
                .setColor('#0099ff')
                .setTimestamp()
                .setFooter({ text: 'Steam Deck Debug Info' });
                
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Fehler im steamdeck-info command:', error);
            await interaction.reply({ 
                content: 'Fehler beim Anzeigen der Debug-Informationen.',
                ephemeral: true 
            });
        }
    },
};