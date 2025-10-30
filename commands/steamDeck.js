const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const https = require('https');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('steamdeck')
        .setDescription('Prüft ob das Steam Deck derzeit im Angebot ist'),
        
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const steamDeckInfo = await checkSteamDeckOffer();
            
            const embed = new EmbedBuilder()
                .setTitle('🎮 Steam Deck Status')
                .setColor(steamDeckInfo.onSale ? '#00ff00' : '#0099ff')
                .setTimestamp()
                .setFooter({ text: 'Steam Deck Checker' });

            if (steamDeckInfo.onSale) {
                embed.setDescription('✅ **Steam Deck ist derzeit im Angebot!**')
                    .addFields(
                        { name: 'Rabatt', value: steamDeckInfo.discount || 'Unbekannt', inline: true },
                        { name: 'Status', value: 'Im Angebot 🔥', inline: true },
                        { name: 'Link', value: '[Zum Steam Store](https://store.steampowered.com/app/1675200/Steam_Deck/)', inline: false }
                    );
            } else {
                embed.setDescription('ℹ️ **Steam Deck ist derzeit nicht im Angebot**')
                    .addFields(
                        { name: 'Status', value: steamDeckInfo.status || 'Regulärer Preis', inline: true },
                        { name: 'Verfügbarkeit', value: steamDeckInfo.availability || 'Verfügbar', inline: true },
                        { name: 'Link', value: '[Zum Steam Store](https://store.steampowered.com/app/1675200/Steam_Deck/)', inline: false }
                    );
            }

            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Fehler beim Prüfen des Steam Deck Angebots:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Fehler')
                .setDescription('Es gab einen Fehler beim Prüfen des Steam Deck Status. Bitte versuche es später erneut.')
                .setColor('#ff0000')
                .setTimestamp();
                
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};

// Exportiere die Funktion für den Scheduler
async function checkSteamDeckOffer() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'store.steampowered.com',
            path: '/app/1675200/Steam_Deck/',
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
                'Accept-Encoding': 'identity',
                'Cookie': 'birthtime=283993201; mature_content=1; Steam_Language=german'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    let result = {
                        onSale: false,
                        status: 'Regulärer Preis',
                        availability: 'Verfügbar',
                        discount: null
                    };

                    const htmlContent = data.toLowerCase();
                    
                    const saleIndicators = [
                        'discount_block',
                        'discount_pct',
                        'sale_price',
                        'discount_final_price',
                        'discount_original_price',
                        'rabatt',
                        'angebot',
                        'reduziert'
                    ];

                    let foundSaleIndicator = false;
                    for (const indicator of saleIndicators) {
                        if (htmlContent.includes(indicator)) {
                            foundSaleIndicator = true;
                            break;
                        }
                    }

                    if (foundSaleIndicator) {
                        result.onSale = true;
                        result.status = 'Im Angebot';
                        
                        const discountMatch = data.match(/-(\d+)%/);
                        if (discountMatch) {
                            result.discount = `-${discountMatch[1]}%`;
                        } else {
                            result.discount = 'Rabatt verfügbar';
                        }
                    }

                    if (htmlContent.includes('nicht verfügbar') || 
                        htmlContent.includes('not available') ||
                        htmlContent.includes('ausverkauft') ||
                        htmlContent.includes('sold out')) {
                        result.availability = 'Nicht verfügbar';
                    }

                    resolve(result);
                    
                } catch (parseError) {
                    console.error('Fehler beim Parsen der Steam-Seite:', parseError);
                    resolve({
                        onSale: false,
                        status: 'Status unbekannt (Parsing-Fehler)',
                        availability: 'Unbekannt',
                        discount: null
                    });
                }
            });
        });

        req.on('error', (error) => {
            console.error('HTTP Request Fehler:', error);
            reject(error);
        });

        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('Request Timeout - Steam Store antwortet nicht'));
        });

        req.end();
    });
}

module.exports.checkSteamDeckOffer = checkSteamDeckOffer;
