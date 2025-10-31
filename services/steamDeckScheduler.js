/**
 * Steam Deck Daily Checker
 * Überprüft täglich automatisch ob das Steam Deck im Angebot ist
 * und sendet Benachrichtigungen in einen Discord Channel
 */

const { EmbedBuilder } = require('discord.js');
const { checkSteamDeckOffer } = require('../commands/steamDeck.js');
const fs = require('fs');
const path = require('path');

class SteamDeckScheduler {
    constructor(client) {
        this.client = client;
        this.configPath = path.join(__dirname, '../config/steamDeckConfig.json');
        this.config = this.loadConfig();
        this.channelId = process.env.STEAM_DECK_CHANNEL_ID || this.config.channelId;
        this.lastKnownState = null; // Speichert den letzten bekannten Status
        this.checkInterval = null;
        this.logger = client.logger; // Discord Logger
    }

    /**
     * Lädt die Konfiguration aus der JSON-Datei
     */
    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const configData = fs.readFileSync(this.configPath, 'utf8');
                return JSON.parse(configData);
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden der Steam Deck Konfiguration:', error);
        }
        
        // Standard-Konfiguration zurückgeben falls Datei nicht existiert
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
     * Speichert die Konfiguration in die JSON-Datei
     */
    saveConfig() {
        try {
            const configDir = path.dirname(this.configPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Steam Deck Konfiguration:', error);
        }
    }

    /**
     * Startet den täglichen Check
     * @param {string} time - Zeit im Format "HH:MM" (z.B. "09:00") - optional, wird aus Config gelesen
     */
    start(time = null) {
        const checkTime = time || this.config.checkTime || "09:00";
        this.config.checkTime = checkTime;
        this.saveConfig();
        
        console.log(`🎮 Steam Deck Scheduler gestartet - tägliche Überprüfung um ${checkTime}`);
        
        // Sofort einmal prüfen beim Start
        this.performCheck();
        
        // Dann täglich zur angegebenen Zeit
        this.scheduleDaily(checkTime);
    }

    /**
     * Plant die tägliche Ausführung
     */
    scheduleDaily(time) {
        const [hours, minutes] = time.split(':').map(Number);
        
        const now = new Date();
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        // Wenn die Zeit heute schon vorbei ist, plane für morgen
        if (scheduledTime <= now) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
        
        const timeUntilNext = scheduledTime.getTime() - now.getTime();
        
        setTimeout(() => {
            this.performCheck();
            // Nach dem ersten Check, alle 24 Stunden wiederholen
            this.checkInterval = setInterval(() => {
                this.performCheck();
            }, 24 * 60 * 60 * 1000); // 24 Stunden
        }, timeUntilNext);
        
        console.log(`⏰ Nächste Steam Deck Überprüfung: ${scheduledTime.toLocaleString('de-DE')}`);
    }

    /**
     * Führt die Steam Deck Überprüfung durch
     */
    async performCheck() {
        try {
            console.log('🔍 Überprüfe Steam Deck Status...');
            if (this.logger) {
                await this.logger.info('Steam Deck Check', 'Automatische Überprüfung gestartet...');
            }
            
            const steamDeckInfo = await checkSteamDeckOffer();
            const currentState = steamDeckInfo.onSale;
            
            // Prüfe ob sich der Status geändert hat
            const statusChanged = this.lastKnownState !== null && this.lastKnownState !== currentState;
            
            // Discord Log für Steam Deck Check
            if (this.logger) {
                await this.logger.logSteamDeckCheck(currentState, statusChanged, {
                    'Verfügbarkeit': steamDeckInfo.availability || 'Unbekannt',
                    'Rabatt': steamDeckInfo.discount || 'Keiner',
                    'Preis-Status': steamDeckInfo.status || 'Unbekannt'
                });
            }
            
            // Sende Benachrichtigung wenn:
            // 1. Status hat sich geändert ODER
            // 2. Steam Deck ist im Angebot (auch wenn schon bekannt - tägliche Erinnerung)
            if (statusChanged || currentState) {
                await this.sendNotification(steamDeckInfo, statusChanged);
            }
            
            this.lastKnownState = currentState;
            
            // Aktualisiere lastCheck Zeit in der Config
            this.config.lastCheck = new Date().toLocaleString('de-DE');
            this.saveConfig();
            
            console.log(`✅ Steam Deck Check abgeschlossen - Im Angebot: ${currentState ? 'JA' : 'NEIN'}`);
            
        } catch (error) {
            console.error('❌ Fehler beim automatischen Steam Deck Check:', error);
            
            // Discord Error Log
            if (this.logger) {
                await this.logger.logError('Steam Deck Check Fehler', error, 'Automatische Überprüfung');
            }
            
            await this.sendErrorNotification(error);
        }
    }

    /**
     * Sendet eine Benachrichtigung in den Discord Channel
     */
    async sendNotification(steamDeckInfo, statusChanged) {
        if (!this.channelId) {
            console.log('⚠️ Keine Channel-ID für Steam Deck Benachrichtigungen konfiguriert');
            return;
        }

        try {
            const channel = await this.client.channels.fetch(this.channelId);
            if (!channel) {
                console.error('❌ Steam Deck Benachrichtigungs-Channel nicht gefunden');
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('🎮 Steam Deck - Automatische Überprüfung')
                .setTimestamp()
                .setFooter({ text: 'Automatischer Steam Deck Checker' });

            // Prüfe ob User gepingt werden sollen
            let shouldPingUsers = false;
            let messageContent = '';
            
            if (steamDeckInfo.onSale) {
                // Bei Angeboten immer pingen wenn onlyPingOnSale aktiviert ist
                shouldPingUsers = this.config.onlyPingOnSale;
                
                embed.setColor('#00ff00')
                    .setDescription('🚨 **ALERT: Steam Deck ist im Angebot!** 🚨')
                    .addFields(
                        { name: 'Rabatt', value: steamDeckInfo.discount || 'Unbekannt', inline: true },
                        { name: 'Status', value: 'Im Angebot 🔥', inline: true },
                        { name: 'Verfügbarkeit', value: steamDeckInfo.availability || 'Verfügbar', inline: true },
                        { name: 'Link', value: '[🛒 Jetzt kaufen!](https://store.steampowered.com/app/1675200/Steam_Deck/)', inline: false }
                    );
                
                if (statusChanged) {
                    embed.addFields({ name: '📢 Änderung', value: 'Gerade in den Angebot gekommen!', inline: false });
                }
            } else {
                // Nicht im Angebot - nur pingen wenn onlyPingOnSale deaktiviert ist
                shouldPingUsers = !this.config.onlyPingOnSale;
                
                embed.setColor('#ff9900')
                    .setDescription('ℹ️ **Steam Deck ist nicht im Angebot**')
                    .addFields(
                        { name: 'Status', value: steamDeckInfo.status || 'Regulärer Preis', inline: true },
                        { name: 'Verfügbarkeit', value: steamDeckInfo.availability || 'Verfügbar', inline: true },
                        { name: 'Link', value: '[Steam Store](https://store.steampowered.com/app/1675200/Steam_Deck/)', inline: false }
                    );
            }
            
            // Erstelle User- und Rollen-Pings falls aktiviert
            if (shouldPingUsers && this.config.pingUsers && this.config.pingRoles) {
                const pings = [];
                
                // User-Pings hinzufügen
                if (this.config.pingUsers.length > 0) {
                    const userPings = this.config.pingUsers.map(userId => `<@${userId}>`);
                    pings.push(...userPings);
                }
                
                // Rollen-Pings hinzufügen
                if (this.config.pingRoles.length > 0) {
                    const rolePings = this.config.pingRoles.map(roleId => `<@&${roleId}>`);
                    pings.push(...rolePings);
                }
                
                if (pings.length > 0) {
                    messageContent = `${pings.join(' ')}\n🔔 **Steam Deck Update!**`;
                }
            }

            // Sende Nachricht mit oder ohne Pings
            const messageOptions = { embeds: [embed] };
            if (messageContent) {
                messageOptions.content = messageContent;
            }
            
            await channel.send(messageOptions);
            
            const totalPings = (this.config.pingUsers?.length || 0) + (this.config.pingRoles?.length || 0);
            const pingInfo = shouldPingUsers && totalPings > 0 
                ? ` (${this.config.pingUsers?.length || 0} User + ${this.config.pingRoles?.length || 0} Rollen gepingt)` 
                : '';
            console.log(`📨 Steam Deck Benachrichtigung gesendet${pingInfo}`);

        } catch (error) {
            console.error('❌ Fehler beim Senden der Steam Deck Benachrichtigung:', error);
        }
    }

    /**
     * Sendet eine Fehler-Benachrichtigung
     */
    async sendErrorNotification(error) {
        if (!this.channelId) return;

        try {
            const channel = await this.client.channels.fetch(this.channelId);
            if (!channel) return;

            const embed = new EmbedBuilder()
                .setTitle('❌ Steam Deck Checker - Fehler')
                .setDescription('Es gab einen Fehler beim automatischen Steam Deck Check')
                .addFields(
                    { name: 'Fehler', value: error.message || 'Unbekannter Fehler', inline: false },
                    { name: 'Zeit', value: new Date().toLocaleString('de-DE'), inline: true }
                )
                .setColor('#ff0000')
                .setTimestamp()
                .setFooter({ text: 'Automatischer Steam Deck Checker' });

            await channel.send({ embeds: [embed] });

        } catch (sendError) {
            console.error('❌ Fehler beim Senden der Fehler-Benachrichtigung:', sendError);
        }
    }

    /**
     * Stoppt den Scheduler
     */
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            console.log('🛑 Steam Deck Scheduler gestoppt');
        }
    }
}

module.exports = SteamDeckScheduler;