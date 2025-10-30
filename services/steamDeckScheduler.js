/**
 * Steam Deck Daily Checker
 * Überprüft täglich automatisch ob das Steam Deck im Angebot ist
 * und sendet Benachrichtigungen in einen Discord Channel
 */

const { EmbedBuilder } = require('discord.js');
const { checkSteamDeckOffer } = require('../commands/steamDeck.js');

class SteamDeckScheduler {
    constructor(client) {
        this.client = client;
        this.channelId = process.env.STEAM_DECK_CHANNEL_ID; // Channel ID für Benachrichtigungen
        this.lastKnownState = null; // Speichert den letzten bekannten Status
        this.checkInterval = null;
    }

    /**
     * Startet den täglichen Check
     * @param {string} time - Zeit im Format "HH:MM" (z.B. "09:00")
     */
    start(time = "09:00") {
        console.log(`🎮 Steam Deck Scheduler gestartet - tägliche Überprüfung um ${time}`);
        
        // Sofort einmal prüfen beim Start
        this.performCheck();
        
        // Dann täglich zur angegebenen Zeit
        this.scheduleDaily(time);
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
            
            const steamDeckInfo = await checkSteamDeckOffer();
            const currentState = steamDeckInfo.onSale;
            
            // Prüfe ob sich der Status geändert hat
            const statusChanged = this.lastKnownState !== null && this.lastKnownState !== currentState;
            
            // Sende Benachrichtigung wenn:
            // 1. Status hat sich geändert ODER
            // 2. Steam Deck ist im Angebot (auch wenn schon bekannt - tägliche Erinnerung)
            if (statusChanged || currentState) {
                await this.sendNotification(steamDeckInfo, statusChanged);
            }
            
            this.lastKnownState = currentState;
            
            console.log(`✅ Steam Deck Check abgeschlossen - Im Angebot: ${currentState ? 'JA' : 'NEIN'}`);
            
        } catch (error) {
            console.error('❌ Fehler beim automatischen Steam Deck Check:', error);
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

            if (steamDeckInfo.onSale) {
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
                embed.setColor('#ff9900')
                    .setDescription('ℹ️ **Steam Deck ist nicht im Angebot**')
                    .addFields(
                        { name: 'Status', value: steamDeckInfo.status || 'Regulärer Preis', inline: true },
                        { name: 'Verfügbarkeit', value: steamDeckInfo.availability || 'Verfügbar', inline: true },
                        { name: 'Link', value: '[Steam Store](https://store.steampowered.com/app/1675200/Steam_Deck/)', inline: false }
                    );
            }

            await channel.send({ embeds: [embed] });
            console.log('📨 Steam Deck Benachrichtigung gesendet');

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