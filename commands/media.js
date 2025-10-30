const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { exec } = require('child_process');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('media')
        .setDescription('Media Server Verwaltung')
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Zeige Media Server Status')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Starte Media Server')
                .addStringOption(option =>
                    option
                        .setName('service')
                        .setDescription('Welcher Service')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Plex', value: 'plex' },
                            { name: 'Jellyfin', value: 'jellyfin' },
                            { name: 'Nginx RTMP', value: 'nginx-rtmp' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stop')
                .setDescription('Stoppe Media Server')
                .addStringOption(option =>
                    option
                        .setName('service')
                        .setDescription('Welcher Service')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Plex', value: 'plex' },
                            { name: 'Jellyfin', value: 'jellyfin' },
                            { name: 'Nginx RTMP', value: 'nginx-rtmp' }
                        )
                )
        ),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const subcommand = interaction.options.getSubcommand();
        const service = interaction.options.getString('service');
        
        try {
            if (subcommand === 'status') {
                await this.checkMediaStatus(interaction);
            } else if (subcommand === 'start') {
                await this.startMediaService(interaction, service);
            } else if (subcommand === 'stop') {
                await this.stopMediaService(interaction, service);
            }
        } catch (error) {
            console.error('Media command error:', error);
            await interaction.editReply({
                content: 'Fehler beim Ausführen des Media Commands.',
                ephemeral: true
            });
        }
    },
    
    async checkMediaStatus(interaction) {
        exec('docker ps --format "table {{.Names}}\\t{{.Status}}" | grep -E "(plex|jellyfin|nginx-rtmp)"', (error, stdout, stderr) => {
            const embed = new EmbedBuilder()
                .setTitle('📺 Media Server Status')
                .setColor('#9932cc')
                .setTimestamp()
                .setFooter({ text: 'Media Server Manager' });
                
            if (error || !stdout.trim()) {
                embed.setDescription('❌ **Keine Media Server gefunden**')
                    .addFields(
                        { name: 'Status', value: 'Keine aktiven Container', inline: true },
                        { name: 'Verfügbare Services', value: '• Plex\n• Jellyfin\n• Nginx RTMP', inline: true }
                    );
            } else {
                embed.setDescription('✅ **Media Server gefunden**')
                    .addFields(
                        { name: 'Aktive Container', value: '```\n' + stdout.trim() + '\n```', inline: false }
                    );
            }
            
            interaction.editReply({ embeds: [embed] });
        });
    },
    
    async startMediaService(interaction, service) {
        const serviceCommands = {
            'plex': 'docker run -d --name plex --network=host -e PUID=1000 -e PGID=1000 -v /opt/plex:/config -v /opt/media:/media --restart unless-stopped plexinc/pms-docker',
            'jellyfin': 'docker run -d --name jellyfin -p 8096:8096 -v /opt/jellyfin:/config -v /opt/media:/media --restart unless-stopped jellyfin/jellyfin',
            'nginx-rtmp': 'docker run -d --name nginx-rtmp -p 1935:1935 -p 8080:8080 tiangolo/nginx-rtmp'
        };
        
        const command = serviceCommands[service];
        if (!command) {
            await interaction.editReply('Unbekannter Service!');
            return;
        }
        
        exec(command, (error, stdout, stderr) => {
            const embed = new EmbedBuilder()
                .setTitle(`📺 ${service.toUpperCase()} Media Server`)
                .setTimestamp()
                .setFooter({ text: 'Media Server Manager' });
                
            if (error) {
                embed.setColor('#ff0000')
                    .setDescription(`❌ **Fehler beim Starten von ${service}**`)
                    .addFields(
                        { name: 'Fehler', value: error.message.substring(0, 1000), inline: false }
                    );
            } else {
                embed.setColor('#00ff00')
                    .setDescription(`✅ **${service.toUpperCase()} erfolgreich gestartet!**`)
                    .addFields(
                        { name: 'Service', value: service, inline: true },
                        { name: 'Status', value: 'Gestartet', inline: true },
                        { name: 'Zugriff', value: this.getServiceUrl(service), inline: false }
                    );
            }
            
            interaction.editReply({ embeds: [embed] });
        });
    },
    
    async stopMediaService(interaction, service) {
        exec(`docker stop ${service} && docker rm ${service}`, (error, stdout, stderr) => {
            const embed = new EmbedBuilder()
                .setTitle(`📺 ${service.toUpperCase()} Media Server`)
                .setTimestamp()
                .setFooter({ text: 'Media Server Manager' });
                
            if (error) {
                embed.setColor('#ff9900')
                    .setDescription(`⚠️ **${service} war bereits gestoppt oder existiert nicht**`);
            } else {
                embed.setColor('#ff0000')
                    .setDescription(`🛑 **${service.toUpperCase()} erfolgreich gestoppt!**`);
            }
            
            interaction.editReply({ embeds: [embed] });
        });
    },
    
    getServiceUrl(service) {
        const urls = {
            'plex': 'http://SERVER-IP:32400/web',
            'jellyfin': 'http://SERVER-IP:8096',
            'nginx-rtmp': 'rtmp://SERVER-IP:1935/live'
        };
        return urls[service] || 'URL nicht verfügbar';
    }
};