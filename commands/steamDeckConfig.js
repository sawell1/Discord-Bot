const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Hilfsfunktion zum Laden der Konfiguration
function loadConfig() {
    const configPath = path.join(__dirname, '../config/steamDeckConfig.json');
    try {
        if (fs.existsSync(configPath)) {
            const configData = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configData);
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Konfiguration:', error);
    }
    
    return {
        checkTime: "09:00",
        channelId: null,
        logChannelId: null,
        lastCheck: null,
        isActive: true,
        pingUsers: [],
        pingRoles: [],
        onlyPingOnSale: true
    };
}

// Hilfsfunktion zum Speichern der Konfiguration
function saveConfig(config) {
    const configPath = path.join(__dirname, '../config/steamDeckConfig.json');
    try {
        const configDir = path.dirname(configPath);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Konfiguration:', error);
        return false;
    }
}

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
                .setName('time')
                .setDescription('Setze die Zeit für den automatischen Check')
                .addStringOption(option =>
                    option
                        .setName('time')
                        .setDescription('Zeit im Format HH:MM (z.B. 09:00, 14:30)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ping-add')
                .setDescription('Füge einen User hinzu, der bei Steam Deck Angeboten gepingt wird')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User der gepingt werden soll')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ping-remove')
                .setDescription('Entferne einen User von den Steam Deck Pings')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User der nicht mehr gepingt werden soll')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ping-add-role')
                .setDescription('Füge eine Rolle hinzu, die bei Steam Deck Angeboten gepingt wird')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Rolle die gepingt werden soll')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ping-remove-role')
                .setDescription('Entferne eine Rolle von den Steam Deck Pings')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Rolle die nicht mehr gepingt werden soll')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ping-list')
                .setDescription('Zeige alle User und Rollen die bei Steam Deck Angeboten gepingt werden')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('log-channel')
                .setDescription('Setze den Channel für Bot-Logs (Alternative zu Portainer)')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel für Bot-Logs und System-Nachrichten')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ping-mode')
                .setDescription('Stelle ein, wann Pings gesendet werden sollen')
                .addStringOption(option =>
                    option
                        .setName('mode')
                        .setDescription('Ping-Modus auswählen')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Nur bei Angeboten (empfohlen)', value: 'sale-only' },
                            { name: 'Bei allen Checks', value: 'all-checks' }
                        )
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
            
        } else if (subcommand === 'log-channel') {
            const channel = interaction.options.getChannel('channel');
            const config = loadConfig();
            
            // Speichere Log-Channel in Config
            const oldLogChannel = config.logChannelId;
            config.logChannelId = channel.id;
            
            if (saveConfig(config)) {
                const embed = new EmbedBuilder()
                    .setTitle('🤖 Bot Log-Channel Konfiguration')
                    .setDescription(`✅ **Log-Channel erfolgreich gesetzt!**\n\nAlle Bot-Logs werden jetzt in ${channel} angezeigt.`)
                    .addFields(
                        { name: 'Log-Channel', value: `${channel}`, inline: true },
                        { name: 'Channel ID', value: `${channel.id}`, inline: true },
                        { name: 'Ersetzt', value: 'Portainer/Console-Logs', inline: true },
                        { name: 'Log-Typen', value: '• Bot Start/Stop\n• Steam Deck Checks\n• Command Nutzung\n• Fehler & Warnungen\n• Konfigurations-Änderungen', inline: false },
                        { name: '💡 Vorteil', value: 'Keine Portainer-Logs mehr nötig!', inline: false }
                    )
                    .setColor('#00ff00')
                    .setTimestamp()
                    .setFooter({ text: 'Bot Logger System' });
                    
                await interaction.reply({ embeds: [embed] });
                console.log(`Bot Log-Channel gesetzt: ${channel.name} (${channel.id})`);
                
                // Test-Log senden
                try {
                    const testEmbed = new EmbedBuilder()
                        .setTitle('🔧 Log-System Test')
                        .setDescription('✅ **Log-Channel erfolgreich konfiguriert!**\n\nDieses ist eine Test-Nachricht um zu bestätigen, dass das Log-System funktioniert.')
                        .addFields(
                            { name: 'Konfiguriert von', value: `${interaction.user.tag}`, inline: true },
                            { name: 'Zeit', value: new Date().toLocaleString('de-DE'), inline: true },
                            { name: 'Status', value: '🟢 Aktiv', inline: true }
                        )
                        .setColor('#0099ff')
                        .setTimestamp()
                        .setFooter({ text: 'Bot Log - INFO' });
                        
                    await channel.send({ embeds: [testEmbed] });
                } catch (error) {
                    console.error('Fehler beim Senden der Test-Log:', error);
                }
            } else {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Fehler beim Speichern')
                    .setDescription('Der Log-Channel konnte nicht gesetzt werden. Bitte versuche es erneut.')
                    .setColor('#ff0000')
                    .setTimestamp();
                    
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            
        } else if (subcommand === 'time') {
            const timeInput = interaction.options.getString('time');
            
            // Validiere Zeit-Format (HH:MM)
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(timeInput)) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Ungültiges Zeit-Format')
                    .setDescription('Bitte verwende das Format **HH:MM** (z.B. 09:00, 14:30, 23:15)')
                    .setColor('#ff0000')
                    .setTimestamp();
                    
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }
            
            // Lade aktuelle Konfiguration und aktualisiere die Zeit
            const config = loadConfig();
            const oldTime = config.checkTime;
            config.checkTime = timeInput;
            
            // Speichere die neue Konfiguration
            if (saveConfig(config)) {
                const embed = new EmbedBuilder()
                    .setTitle('🎮 Steam Deck Checker - Zeit konfiguriert')
                    .setDescription(`✅ **Prüfzeit erfolgreich geändert!**\n\nDer automatische Steam Deck Check wird jetzt täglich um **${timeInput}** durchgeführt.`)
                    .addFields(
                        { name: 'Neue Zeit', value: `${timeInput}`, inline: true },
                        { name: 'Alte Zeit', value: oldTime, inline: true },
                        { name: 'Status', value: '✅ Gespeichert', inline: true },
                        { name: '⚠️ Wichtig', value: 'Der Bot muss **neu gestartet** werden, damit die neue Zeit aktiv wird!', inline: false }
                    )
                    .setColor('#00ff00')
                    .setTimestamp()
                    .setFooter({ text: 'Steam Deck Checker' });
                    
                await interaction.reply({ embeds: [embed] });
                console.log(`Steam Deck Check-Zeit geändert von ${oldTime} auf ${timeInput}`);
            } else {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Fehler beim Speichern')
                    .setDescription('Die neue Zeit konnte nicht gespeichert werden. Bitte versuche es erneut.')
                    .setColor('#ff0000')
                    .setTimestamp();
                    
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            
        } else if (subcommand === 'ping-add-role') {
            const role = interaction.options.getRole('role');
            const config = loadConfig();
            
            // Prüfe ob Rolle bereits in der Liste ist
            if (config.pingRoles.includes(role.id)) {
                const embed = new EmbedBuilder()
                    .setTitle('⚠️ Rolle bereits in der Liste')
                    .setDescription(`${role} wird bereits bei Steam Deck Angeboten gepingt.`)
                    .setColor('#ffaa00')
                    .setTimestamp();
                    
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }
            
            // Füge Rolle zur Liste hinzu
            config.pingRoles.push(role.id);
            
            if (saveConfig(config)) {
                const embed = new EmbedBuilder()
                    .setTitle('🎮 Steam Deck Ping - Rolle hinzugefügt')
                    .setDescription(`✅ **${role} wurde zur Ping-Liste hinzugefügt!**\n\nAlle Mitglieder dieser Rolle werden ab sofort bei Steam Deck Angeboten benachrichtigt.`)
                    .addFields(
                        { name: 'Rolle', value: `${role}`, inline: true },
                        { name: 'Rolle ID', value: role.id, inline: true },
                        { name: 'Mitglieder', value: `${role.members?.size || 'Unbekannt'} User`, inline: true },
                        { name: 'Gesamt Ping-Rollen', value: `${config.pingRoles.length} Rollen`, inline: true },
                        { name: 'Gesamt Ping-User', value: `${config.pingUsers.length} User`, inline: true },
                        { name: 'Tipp', value: '💡 Rollen sind effizienter als einzelne User!', inline: true }
                    )
                    .setColor('#00ff00')
                    .setTimestamp()
                    .setFooter({ text: 'Steam Deck Checker' });
                    
                await interaction.reply({ embeds: [embed] });
                console.log(`Steam Deck Ping-Rolle hinzugefügt: ${role.name} (${role.id})`);
            } else {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Fehler beim Speichern')
                    .setDescription('Die Rolle konnte nicht hinzugefügt werden. Bitte versuche es erneut.')
                    .setColor('#ff0000')
                    .setTimestamp();
                    
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            
        } else if (subcommand === 'ping-remove-role') {
            const role = interaction.options.getRole('role');
            const config = loadConfig();
            
            // Prüfe ob Rolle in der Liste ist
            const roleIndex = config.pingRoles.indexOf(role.id);
            if (roleIndex === -1) {
                const embed = new EmbedBuilder()
                    .setTitle('⚠️ Rolle nicht in der Liste')
                    .setDescription(`${role} ist nicht in der Steam Deck Ping-Liste.`)
                    .setColor('#ffaa00')
                    .setTimestamp();
                    
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }
            
            // Entferne Rolle aus der Liste
            config.pingRoles.splice(roleIndex, 1);
            
            if (saveConfig(config)) {
                const embed = new EmbedBuilder()
                    .setTitle('🎮 Steam Deck Ping - Rolle entfernt')
                    .setDescription(`✅ **${role} wurde aus der Ping-Liste entfernt!**\n\nMitglieder dieser Rolle werden nicht mehr bei Steam Deck Angeboten benachrichtigt.`)
                    .addFields(
                        { name: 'Rolle', value: `${role}`, inline: true },
                        { name: 'Rolle ID', value: role.id, inline: true },
                        { name: 'Betroffen', value: `${role.members?.size || 'Unbekannt'} User`, inline: true },
                        { name: 'Verbleibende Rollen', value: `${config.pingRoles.length} Rollen`, inline: true },
                        { name: 'Verbleibende User', value: `${config.pingUsers.length} User`, inline: true },
                        { name: 'Status', value: '✅ Entfernt', inline: true }
                    )
                    .setColor('#ff9900')
                    .setTimestamp()
                    .setFooter({ text: 'Steam Deck Checker' });
                    
                await interaction.reply({ embeds: [embed] });
                console.log(`Steam Deck Ping-Rolle entfernt: ${role.name} (${role.id})`);
            } else {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Fehler beim Speichern')
                    .setDescription('Die Rolle konnte nicht entfernt werden. Bitte versuche es erneut.')
                    .setColor('#ff0000')
                    .setTimestamp();
                    
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            
        } else if (subcommand === 'ping-add') {
            const user = interaction.options.getUser('user');
            const config = loadConfig();
            
            // Prüfe ob User bereits in der Liste ist
            if (config.pingUsers.includes(user.id)) {
                const embed = new EmbedBuilder()
                    .setTitle('⚠️ User bereits in der Liste')
                    .setDescription(`${user} wird bereits bei Steam Deck Angeboten gepingt.`)
                    .setColor('#ffaa00')
                    .setTimestamp();
                    
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }
            
            // Füge User zur Liste hinzu
            config.pingUsers.push(user.id);
            
            if (saveConfig(config)) {
                const embed = new EmbedBuilder()
                    .setTitle('🎮 Steam Deck Ping - User hinzugefügt')
                    .setDescription(`✅ **${user} wurde zur Ping-Liste hinzugefügt!**\n\nDer User wird ab sofort bei Steam Deck Angeboten benachrichtigt.`)
                    .addFields(
                        { name: 'User', value: `${user}`, inline: true },
                        { name: 'User ID', value: user.id, inline: true },
                        { name: 'Gesamt Pings', value: `${config.pingUsers.length} User`, inline: true }
                    )
                    .setColor('#00ff00')
                    .setTimestamp()
                    .setFooter({ text: 'Steam Deck Checker' });
                    
                await interaction.reply({ embeds: [embed] });
                console.log(`Steam Deck Ping hinzugefügt: ${user.tag} (${user.id})`);
            } else {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Fehler beim Speichern')
                    .setDescription('Der User konnte nicht hinzugefügt werden. Bitte versuche es erneut.')
                    .setColor('#ff0000')
                    .setTimestamp();
                    
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            
        } else if (subcommand === 'ping-remove') {
            const user = interaction.options.getUser('user');
            const config = loadConfig();
            
            // Prüfe ob User in der Liste ist
            const userIndex = config.pingUsers.indexOf(user.id);
            if (userIndex === -1) {
                const embed = new EmbedBuilder()
                    .setTitle('⚠️ User nicht in der Liste')
                    .setDescription(`${user} ist nicht in der Steam Deck Ping-Liste.`)
                    .setColor('#ffaa00')
                    .setTimestamp();
                    
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }
            
            // Entferne User aus der Liste
            config.pingUsers.splice(userIndex, 1);
            
            if (saveConfig(config)) {
                const embed = new EmbedBuilder()
                    .setTitle('🎮 Steam Deck Ping - User entfernt')
                    .setDescription(`✅ **${user} wurde aus der Ping-Liste entfernt!**\n\nDer User wird nicht mehr bei Steam Deck Angeboten benachrichtigt.`)
                    .addFields(
                        { name: 'User', value: `${user}`, inline: true },
                        { name: 'User ID', value: user.id, inline: true },
                        { name: 'Verbleibende Pings', value: `${config.pingUsers.length} User`, inline: true }
                    )
                    .setColor('#ff9900')
                    .setTimestamp()
                    .setFooter({ text: 'Steam Deck Checker' });
                    
                await interaction.reply({ embeds: [embed] });
                console.log(`Steam Deck Ping entfernt: ${user.tag} (${user.id})`);
            } else {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Fehler beim Speichern')
                    .setDescription('Der User konnte nicht entfernt werden. Bitte versuche es erneut.')
                    .setColor('#ff0000')
                    .setTimestamp();
                    
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            
        } else if (subcommand === 'ping-list') {
            const config = loadConfig();
            
            const embed = new EmbedBuilder()
                .setTitle('🎮 Steam Deck Ping-Liste')
                .setTimestamp()
                .setFooter({ text: 'Steam Deck Checker' });
            
            const hasUsers = config.pingUsers.length > 0;
            const hasRoles = config.pingRoles.length > 0;
            
            if (!hasUsers && !hasRoles) {
                embed.setDescription('📭 **Keine User oder Rollen in der Ping-Liste**\n\nVerwende folgende Befehle:\n• `/steamdeck-config ping-add-role @rolle` - Rolle hinzufügen\n• `/steamdeck-config ping-add @user` - User hinzufügen')
                    .setColor('#999999');
            } else {
                let description = '';
                let totalMembers = 0;
                
                // Rollen anzeigen
                if (hasRoles) {
                    const roleMentions = config.pingRoles.map(roleId => {
                        const role = interaction.guild.roles.cache.get(roleId);
                        if (role) {
                            totalMembers += role.members.size;
                            return `${role} (${role.members.size} Mitglieder)`;
                        }
                        return `<@&${roleId}> (Rolle nicht gefunden)`;
                    }).join('\n');
                    
                    description += `👥 **${config.pingRoles.length} Rollen werden benachrichtigt:**\n${roleMentions}\n\n`;
                }
                
                // User anzeigen
                if (hasUsers) {
                    const userMentions = config.pingUsers.map(userId => `<@${userId}>`).join('\n');
                    description += `👤 **${config.pingUsers.length} einzelne User werden benachrichtigt:**\n${userMentions}`;
                    totalMembers += config.pingUsers.length;
                }
                
                embed.setDescription(description)
                    .addFields(
                        { name: 'Rollen', value: `${config.pingRoles.length}`, inline: true },
                        { name: 'Einzelne User', value: `${config.pingUsers.length}`, inline: true },
                        { name: 'Geschätzte Gesamtzahl', value: `~${totalMembers} User`, inline: true },
                        { name: 'Ping-Modus', value: config.onlyPingOnSale ? '🔥 Nur bei Angeboten' : '📢 Bei allen Checks', inline: true },
                        { name: '💡 Tipp', value: 'Rollen sind effizienter als einzelne User!', inline: true },
                        { name: 'Verwaltung', value: '• `/steamdeck-config ping-add-role @rolle`\n• `/steamdeck-config ping-remove-role @rolle`\n• `/steamdeck-config ping-add @user`\n• `/steamdeck-config ping-remove @user`', inline: false }
                    )
                    .setColor('#0099ff');
            }
            
            await interaction.reply({ embeds: [embed] });
            
        } else if (subcommand === 'ping-mode') {
            const mode = interaction.options.getString('mode');
            const config = loadConfig();
            
            const oldMode = config.onlyPingOnSale ? 'sale-only' : 'all-checks';
            config.onlyPingOnSale = (mode === 'sale-only');
            
            if (saveConfig(config)) {
                const modeText = config.onlyPingOnSale ? '🔥 Nur bei Angeboten' : '📢 Bei allen Checks';
                const oldModeText = oldMode === 'sale-only' ? '🔥 Nur bei Angeboten' : '📢 Bei allen Checks';
                
                const embed = new EmbedBuilder()
                    .setTitle('🎮 Steam Deck Ping-Modus geändert')
                    .setDescription(`✅ **Ping-Modus erfolgreich geändert!**\n\nUser und Rollen werden jetzt ${modeText.toLowerCase()} benachrichtigt.`)
                    .addFields(
                        { name: 'Neuer Modus', value: modeText, inline: true },
                        { name: 'Alter Modus', value: oldModeText, inline: true },
                        { name: 'Betrifft', value: `${config.pingRoles.length} Rollen + ${config.pingUsers.length} User`, inline: true },
                        { name: 'Empfehlung', value: config.onlyPingOnSale ? '✅ Optimal - weniger Spam!' : '⚠️ Kann zu vielen Benachrichtigungen führen', inline: false }
                    )
                    .setColor('#00ff00')
                    .setTimestamp()
                    .setFooter({ text: 'Steam Deck Checker' });
                    
                await interaction.reply({ embeds: [embed] });
                console.log(`Steam Deck Ping-Modus geändert: ${oldMode} → ${mode}`);
            } else {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Fehler beim Speichern')
                    .setDescription('Der Ping-Modus konnte nicht geändert werden. Bitte versuche es erneut.')
                    .setColor('#ff0000')
                    .setTimestamp();
                    
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            
        } else if (subcommand === 'status') {
            const config = loadConfig();
            
            const embed = new EmbedBuilder()
                .setTitle('🎮 Steam Deck Checker Status')
                .setDescription('**Automatischer Steam Deck Checker Konfiguration**')
                .addFields(
                    { name: 'Status', value: config.isActive ? '🟢 Aktiv' : '🔴 Inaktiv', inline: true },
                    { name: 'Prüfzeit', value: `Täglich um ${config.checkTime}`, inline: true },
                    { name: 'Letzte Prüfung', value: config.lastCheck || 'Beim Bot-Start', inline: true },
                    { name: 'Benachrichtigungen', value: process.env.STEAM_DECK_CHANNEL_ID ? '✅ Konfiguriert' : '❌ Nicht konfiguriert', inline: true },
                    { name: 'Bot-Logs', value: config.logChannelId ? '✅ Discord-Logs aktiv' : '❌ Nur Console-Logs', inline: true },
                    { name: 'Ping-Rollen', value: `${config.pingRoles.length} Rollen`, inline: true },
                    { name: 'Ping-User', value: `${config.pingUsers.length} User`, inline: true },
                    { name: 'Ping-Modus', value: config.onlyPingOnSale ? '🔥 Nur bei Angeboten' : '📢 Bei allen Checks', inline: true },
                    { name: 'Log-Channel', value: config.logChannelId ? `<#${config.logChannelId}>` : 'Nicht gesetzt', inline: true },
                    { name: 'Befehle', value: '• `/steamdeck-config log-channel #logs` - Bot-Logs in Discord\n• `/steamdeck-config time HH:MM` - Zeit ändern\n• `/steamdeck-config ping-add-role @rolle` - Rolle hinzufügen\n• `/steamdeck-config ping-list` - Ping-Liste anzeigen', inline: false }
                )
                .setColor('#0099ff')
                .setTimestamp()
                .setFooter({ text: 'Steam Deck Checker' });
                
            await interaction.reply({ embeds: [embed] });
        }
    },
};