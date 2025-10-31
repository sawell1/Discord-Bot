/**
 * Discord Logger System
 * Sendet Bot-Logs direkt in einen Discord Channel
 * Ersetzt die Notwendigkeit, Portainer/Console-Logs zu checken
 */

const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

class DiscordLogger {
    constructor(client) {
        this.client = client;
        this.configPath = path.join(__dirname, '../config/steamDeckConfig.json');
        this.config = this.loadConfig();
        this.logChannelId = process.env.BOT_LOG_CHANNEL_ID || this.config.logChannelId;
    }

    /**
     * Lädt die Konfiguration
     */
    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const configData = fs.readFileSync(this.configPath, 'utf8');
                return JSON.parse(configData);
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden der Logger-Konfiguration:', error);
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

    /**
     * Sendet eine Log-Nachricht in den Discord Channel
     */
    async log(level, title, message, details = null) {
        if (!this.logChannelId) {
            console.log(`[${level.toUpperCase()}] ${title}: ${message}`);
            return;
        }

        try {
            const channel = await this.client.channels.fetch(this.logChannelId);
            if (!channel) {
                console.error('❌ Log-Channel nicht gefunden');
                return;
            }

            const colors = {
                info: '#0099ff',
                success: '#00ff00',
                warning: '#ffaa00',
                error: '#ff0000',
                debug: '#999999'
            };

            const icons = {
                info: 'ℹ️',
                success: '✅',
                warning: '⚠️',
                error: '❌',
                debug: '🔍'
            };

            const embed = new EmbedBuilder()
                .setTitle(`${icons[level] || '📝'} ${title}`)
                .setDescription(message)
                .setColor(colors[level] || '#0099ff')
                .setTimestamp()
                .setFooter({ text: `Bot Log - ${level.toUpperCase()}` });

            if (details) {
                if (typeof details === 'object') {
                    const detailsText = Object.entries(details)
                        .map(([key, value]) => `**${key}:** ${value}`)
                        .join('\n');
                    embed.addFields({ name: 'Details', value: detailsText, inline: false });
                } else {
                    embed.addFields({ name: 'Details', value: details, inline: false });
                }
            }

            await channel.send({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Fehler beim Senden der Discord-Log:', error);
            // Fallback auf Console-Log
            console.log(`[${level.toUpperCase()}] ${title}: ${message}`);
        }
    }

    /**
     * Info-Level Log
     */
    async info(title, message, details = null) {
        await this.log('info', title, message, details);
    }

    /**
     * Success-Level Log
     */
    async success(title, message, details = null) {
        await this.log('success', title, message, details);
    }

    /**
     * Warning-Level Log
     */
    async warning(title, message, details = null) {
        await this.log('warning', title, message, details);
    }

    /**
     * Error-Level Log
     */
    async error(title, message, details = null) {
        await this.log('error', title, message, details);
    }

    /**
     * Debug-Level Log
     */
    async debug(title, message, details = null) {
        await this.log('debug', title, message, details);
    }

    /**
     * Bot Start Log
     */
    async logBotStart(botUser) {
        await this.success('Bot gestartet', `${botUser.tag} ist online und bereit!`, {
            'Bot ID': botUser.id,
            'Start Zeit': new Date().toLocaleString('de-DE'),
            'Steam Deck Scheduler': 'Aktiviert',
            'Log System': 'Online'
        });
    }

    /**
     * Steam Deck Check Log
     */
    async logSteamDeckCheck(isOnSale, statusChanged, details) {
        const title = isOnSale ? 'Steam Deck Check - IM ANGEBOT!' : 'Steam Deck Check - Normal';
        const message = isOnSale 
            ? '🔥 Steam Deck ist im Angebot gefunden!'
            : '📋 Steam Deck Check durchgeführt - kein Angebot';

        const logDetails = {
            'Status': isOnSale ? '🔥 Im Angebot' : '📋 Regulärer Preis',
            'Status geändert': statusChanged ? 'Ja' : 'Nein',
            'Check Zeit': new Date().toLocaleString('de-DE'),
            ...details
        };

        if (isOnSale || statusChanged) {
            await this.warning(title, message, logDetails);
        } else {
            await this.info(title, message, logDetails);
        }
    }

    /**
     * Command Usage Log
     */
    async logCommandUsage(commandName, user, guild, success = true) {
        const title = success ? 'Command ausgeführt' : 'Command Fehler';
        const message = `/${commandName} von ${user.tag} ${success ? 'erfolgreich ausgeführt' : 'fehlgeschlagen'}`;

        await this.log(success ? 'info' : 'error', title, message, {
            'Command': `/${commandName}`,
            'User': `${user.tag} (${user.id})`,
            'Server': guild ? guild.name : 'DM',
            'Zeit': new Date().toLocaleString('de-DE')
        });
    }

    /**
     * Configuration Change Log
     */
    async logConfigChange(changeType, user, oldValue, newValue) {
        await this.info('Konfiguration geändert', `${changeType} wurde von ${user.tag} geändert`, {
            'Änderung': changeType,
            'Alter Wert': oldValue || 'Nicht gesetzt',
            'Neuer Wert': newValue,
            'Geändert von': `${user.tag} (${user.id})`,
            'Zeit': new Date().toLocaleString('de-DE')
        });
    }

    /**
     * Error Log
     */
    async logError(errorType, error, context = null) {
        await this.error(errorType, error.message || 'Unbekannter Fehler', {
            'Fehler-Typ': errorType,
            'Stack': error.stack ? error.stack.substring(0, 500) + '...' : 'Nicht verfügbar',
            'Kontext': context || 'Nicht verfügbar',
            'Zeit': new Date().toLocaleString('de-DE')
        });
    }
}

module.exports = DiscordLogger;