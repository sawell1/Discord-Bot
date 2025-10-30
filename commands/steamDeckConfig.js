const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('steamdeck-config')
        .setDescription('Konfiguriere den automatischen Steam Deck Checker')
        .addSubcommand(subcommand =>
            subcommand
                .setName('channel')
                .setDescription('Setze den Channel für Steam Deck Benachrichtigungen')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel für Benachrichtigungen')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Zeige den aktuellen Status des Steam Deck Checkers')
        ),
        
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'channel') {
            const channel = interaction.options.getChannel('channel');
            
            const embed = new EmbedBuilder()
                .setTitle('🎮 Steam Deck Checker Konfiguration')
                .setDescription(`✅ **Benachrichtigungs-Channel gesetzt!**\n\nSteam Deck Angebote werden jetzt in ${channel} gemeldet.`)
                .addFields(
                    { name: 'Channel', value: `${channel}`, inline: true },
                    { name: 'Channel ID', value: `${channel.id}`, inline: true },
                    { name: 'Prüfzeit', value: 'Täglich um 09:00 Uhr', inline: true }
                )
                .setColor('#00ff00')
                .setTimestamp()
                .setFooter({ text: 'Steam Deck Checker' });
                
            await interaction.reply({ embeds: [embed] });
            
            // Hier könntest du die Channel ID in einer Datenbank speichern
            console.log(`Steam Deck Channel gesetzt: ${channel.name} (${channel.id})`);
            
        } else if (subcommand === 'status') {
            const embed = new EmbedBuilder()
                .setTitle('🎮 Steam Deck Checker Status')
                .setDescription('**Automatischer Steam Deck Checker ist aktiv**')
                .addFields(
                    { name: 'Status', value: '🟢 Aktiv', inline: true },
                    { name: 'Prüfzeit', value: 'Täglich um 09:00 Uhr', inline: true },
                    { name: 'Letzte Prüfung', value: 'Beim Bot-Start', inline: true },
                    { name: 'Benachrichtigungen', value: process.env.STEAM_DECK_CHANNEL_ID ? '✅ Konfiguriert' : '❌ Nicht konfiguriert', inline: true },
                    { name: 'Features', value: '• Automatische tägliche Prüfung\n• Benachrichtigung bei Angeboten\n• Status-Änderungs-Alerts', inline: false }
                )
                .setColor('#0099ff')
                .setTimestamp()
                .setFooter({ text: 'Steam Deck Checker' });
                
            await interaction.reply({ embeds: [embed] });
        }
    },
};