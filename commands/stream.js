const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stream')
        .setDescription('Live Streaming Verwaltung')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup RTMP Streaming Server')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Zeige Streaming Informationen')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('viewers')
                .setDescription('Zeige aktuelle Zuschauer')
        ),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'setup') {
            await this.setupStreaming(interaction);
        } else if (subcommand === 'info') {
            await this.streamingInfo(interaction);
        } else if (subcommand === 'viewers') {
            await this.viewerStats(interaction);
        }
    },
    
    async setupStreaming(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🎥 Live Streaming Setup')
            .setDescription('**RTMP Streaming Server Konfiguration**')
            .addFields(
                { name: '📋 Setup Schritte', value: '1. Nginx RTMP Container starten\n2. OBS Studio konfigurieren\n3. Stream Key generieren\n4. Zuschauer-Interface bereitstellen', inline: false },
                { name: '🔧 Docker Command', value: '```bash\ndocker run -d --name streaming-server \\\n  -p 1935:1935 \\\n  -p 8080:8080 \\\n  -v /opt/streaming:/etc/nginx \\\n  tiangolo/nginx-rtmp\n```', inline: false },
                { name: '🎬 OBS Einstellungen', value: '**Server:** rtmp://DEINE-IP:1935/live\n**Stream Key:** beliebiger-schluessel', inline: false },
                { name: '👀 Zuschauer URL', value: 'http://DEINE-IP:8080/live/STREAM-KEY.m3u8', inline: false },
                { name: '⚖️ Rechtlicher Hinweis', value: 'Nur eigene Inhalte oder lizenzfreie Medien streamen!', inline: false }
            )
            .setColor('#ff6b6b')
            .setTimestamp()
            .setFooter({ text: 'Live Streaming Setup' });
            
        await interaction.editReply({ embeds: [embed] });
    },
    
    async streamingInfo(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('📺 Streaming Möglichkeiten')
            .setDescription('**Verschiedene Streaming-Optionen für deinen Server**')
            .addFields(
                { name: '🎬 Plex Media Server', value: '• Persönliche Filme & Serien\n• Web & App Interface\n• Multi-User Support\n• Hardware Transcoding', inline: true },
                { name: '🟣 Jellyfin', value: '• Open Source Alternative\n• Kostenlos ohne Limits\n• Plugin System\n• Self-Hosted', inline: true },
                { name: '🔴 Live Streaming', value: '• RTMP Server\n• OBS Integration\n• Real-Time Streaming\n• Multi-Viewer', inline: true },
                { name: '📡 Technische Details', value: '**Ports:**\n• Plex: 32400\n• Jellyfin: 8096\n• RTMP: 1935\n• HLS: 8080', inline: false },
                { name: '⚠️ Wichtige Hinweise', value: '• Ausreichend Speicherplatz\n• Gute Internetverbindung\n• Rechtliche Aspekte beachten\n• HTTPS für externe Zugriffe', inline: false }
            )
            .setColor('#4ecdc4')
            .setTimestamp()
            .setFooter({ text: 'Streaming Information' });
            
        await interaction.editReply({ embeds: [embed] });
    },
    
    async viewerStats(interaction) {
        // Hier könntest du echte Statistiken aus Nginx RTMP Logs holen
        const embed = new EmbedBuilder()
            .setTitle('📊 Streaming Statistiken')
            .setDescription('**Aktuelle Zuschauer und Stream-Status**')
            .addFields(
                { name: '👥 Aktive Streams', value: 'Keine aktiven Streams', inline: true },
                { name: '📺 Zuschauer', value: '0 Viewer', inline: true },
                { name: '📈 Bandwidth', value: '0 Mbps', inline: true },
                { name: '🎥 Stream Quality', value: 'N/A', inline: true },
                { name: '⏱️ Uptime', value: '00:00:00', inline: true },
                { name: '💾 Storage Used', value: 'N/A', inline: true }
            )
            .setColor('#f39c12')
            .setTimestamp()
            .setFooter({ text: 'Stream Statistics' });
            
        await interaction.editReply({ embeds: [embed] });
    }
};