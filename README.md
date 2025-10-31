
# Discord Server Bot (Enhanced Fork)

[![View on Docker Hub](https://img.shields.io/badge/Docker%20Hub-sawell1%2Fdiscord--bot-blue?logo=docker)](https://hub.docker.com/r/sawell1/discord-bot)
[![Original Repository](https://img.shields.io/badge/Original-allenrkeen%2Fserver--bot-green?logo=github)](https://github.com/allenrkeen/server-bot)

### Discord bot to remotely monitor and control a docker based server. Using the docker socket.

## 🙏 Credits & Attribution

This bot is based on the excellent work by **[allenrkeen](https://github.com/allenrkeen)**.

**Original Repository:** https://github.com/allenrkeen/server-bot  
**Original Docker Image:** `allenrkeen/server-bot`

## 🆕 Enhanced Version Features

This fork maintains full compatibility with the original bot while adding new functionality:

### 🎮 Steam Deck Monitoring
- **Automatic daily checks** for Steam Deck sales and availability
- **Smart notifications** that alert only on price changes or new deals
- **Real-time manual checking** with `/steamdeck` command
- **Configurable Discord notifications** via channel setup
- **Time configuration** - Set check time directly in Discord
- **User & Role pings** - Notify specific users or entire roles
- **Smart ping modes** - Only on sales or all checks

### 🤖 Discord Logging System
- **Real-time bot logs** directly in Discord channels
- **Replaces Portainer log checking** - no more browser tabs needed
- **Comprehensive monitoring** - startup, checks, errors, config changes
- **Professional formatting** with Discord embeds and timestamps

### 🔧 Enhanced Stability
- **Improved error handling** and logging
- **Robust timeout protection** for external API calls
- **Extended configuration options** for better customization

---

## 🚀 Setup

Setup is pretty straightforward.

1. Create a new application in the *[discord developer portal](https://discord.com/developers/applications)*
2. Go to the bot section and click *Add Bot*
3. Reset Token and keep the token somewhere secure (This will be referred to as "DISCORD_TOKEN" in .env and docker environment variables)
4. Get the "Application ID" from the General Information tab of your application (This will be referred to as "DISCORD_CLIENT_ID" in .env and docker environment variables)
5. *Optional:* If you have developer mode enabled in Discord, get your server's ID by right-clicking on the server name and clicking "Copy ID" (This will be referred to as "DISCORD_GUILD_ID" in .env and docker environment variables)
   - If you skip this, it will still work, but commands will be published globally instead of to your server and can take up to an hour to be available in your server.
   - Using the Server ID will be more secure, making the commands available only in the specified server.

## 📦 Installation Options

### Option 1: Enhanced Version (Docker - Recommended)

```bash
# Enhanced version with Steam Deck monitoring
docker run -d -v /var/run/docker.sock:/var/run/docker.sock --name server-bot \
-e DISCORD_TOKEN=your_token_here \
-e DISCORD_CLIENT_ID=your_client_id_here \
-e DISCORD_GUILD_ID=your_guild_id_here \
-e STEAM_DECK_CHANNEL_ID=your_channel_id_here \
-e BOT_LOG_CHANNEL_ID=your_log_channel_id_here \
sawell1/discord-bot:latest
```

### Option 2: Docker Compose

```yaml
version: '3'
services:
  server-bot:
    container_name: server-bot
    image: sawell1/discord-bot:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - DISCORD_TOKEN=your_token_here
      - DISCORD_CLIENT_ID=your_client_id_here
      - DISCORD_GUILD_ID=your_guild_id_here
      - STEAM_DECK_CHANNEL_ID=your_channel_id_here
      - BOT_LOG_CHANNEL_ID=your_log_channel_id_here
    restart: unless-stopped
```

### Option 3: Original Version

```bash
# Original version by allenrkeen (core functionality only)
docker run -v /var/run/docker.sock:/var/run/docker.sock --name server-bot \
-e DISCORD_TOKEN=your_token_here \
-e DISCORD_CLIENT_ID=your_client_id_here \
-e DISCORD_GUILD_ID=your_guild_id_here \
allenrkeen/server-bot:latest
```

The program will build an invite link with the correct permissions and put it in the logs. Click the link and confirm the server to add the bot to.

---

## 🤖 Available Commands

### **Core Docker Management (Original by allenrkeen):**
- **`/allcontainers`** - Provides container name and status for all containers
- **`/restartcontainer`** - Provides an autocomplete list of running containers to select from, or just type in container name then restarts the container
- **`/stopcontainer`** - Provides an autocomplete list of running containers to select from, or just type in container name then stops the container
- **`/startcontainer`** - Provides an autocomplete list of stopped containers to select from, or just type in container name then starts the container
- **`/ping`** - Replies with "Pong!" when the bot is listening
- **`/server`** - Replies with Server Name and member count, good for testing

### **🎮 Steam Deck Commands (Enhanced Features):**
- **`/steamdeck`** - Real-time Steam Deck offer checker with price analysis
- **`/steamdeck-config channel #channel`** - Set Discord channel for automatic notifications
- **`/steamdeck-config time HH:MM`** - Set automatic check time (e.g., 14:30)
- **`/steamdeck-config ping-add-role @role`** - Add role for Steam Deck notifications
- **`/steamdeck-config ping-add @user`** - Add individual user for notifications
- **`/steamdeck-config ping-remove-role @role`** - Remove role from notifications
- **`/steamdeck-config ping-remove @user`** - Remove user from notifications
- **`/steamdeck-config ping-list`** - Show all configured notification targets
- **`/steamdeck-config ping-mode`** - Configure when to send pings (only on sales vs all checks)
- **`/steamdeck-config log-channel #channel`** - Set channel for bot logs (replaces Portainer)
- **`/steamdeck-config status`** - Complete system overview and configuration status

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | ✅ Yes | Your Discord bot token |
| `DISCORD_CLIENT_ID` | ✅ Yes | Your Discord application ID |
| `DISCORD_GUILD_ID` | ⚠️ Recommended | Your Discord server ID (for faster command deployment) |
| `STEAM_DECK_CHANNEL_ID` | ❌ Optional | Channel ID for Steam Deck notifications (enhanced features) |
| `BOT_LOG_CHANNEL_ID` | ❌ Optional | Channel ID for bot logs (replaces Portainer log checking) |

---

## 🕐 Automatic Features

### Steam Deck Monitoring
- **Daily automatic checks** at configurable time (default 09:00 AM)
- **Smart notifications** that only alert on actual price changes or new deals
- **Status change tracking** to avoid notification spam
- **Role and user pings** for targeted notifications
- **Configurable ping modes** - only on sales or all checks
- **Error reporting** with automatic retry mechanisms

### Discord Logging
- **Real-time bot monitoring** directly in Discord
- **Startup notifications** confirming bot is online
- **Check results logging** for transparency
- **Error reporting** with detailed stack traces
- **Configuration change tracking** with user attribution
- **Command usage logging** for monitoring and debugging
- **Error reporting** with automatic retry mechanisms

---

## � Quick Setup Guide

### Basic Setup (Core Features Only):
1. Use `allenrkeen/server-bot` Docker image
2. Set required environment variables: `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID`

### Enhanced Setup (Steam Deck + Logging):
1. Use `sawell1/discord-bot` Docker image
2. Set basic environment variables
3. **Configure Steam Deck monitoring:**
   - `/steamdeck-config channel #steam-alerts` - Set notification channel
   - `/steamdeck-config time 14:30` - Set check time
   - `/steamdeck-config ping-add-role @SteamDeals` - Add role for notifications
4. **Configure Discord logging:**
   - `/steamdeck-config log-channel #bot-logs` - Replace Portainer log checking
5. **Test setup:**
   - `/steamdeck-config status` - View complete configuration
   - `/steamdeck` - Manual check to test functionality

### Recommended Workflow:
1. Create Discord roles: `@SteamDeals`, `@BotAdmins`
2. Create Discord channels: `#steam-alerts`, `#bot-logs`
3. Configure bot with commands above
4. Users can self-assign `@SteamDeals` role for notifications

---

## �🐳 Docker Images

| Repository | Purpose | Maintained by |
|------------|---------|---------------|
| [`allenrkeen/server-bot`](https://hub.docker.com/r/allenrkeen/server-bot) | Original core functionality | allenrkeen |
| [`sawell1/discord-bot`](https://hub.docker.com/r/sawell1/discord-bot) | Enhanced with Steam Deck monitoring, Discord logging & advanced notifications | sawell1 |

---

## 🤝 Contributing

- **For core Docker management features:** Please contribute to the [original repository](https://github.com/allenrkeen/server-bot) by allenrkeen
- **For enhanced features (Steam Deck monitoring):** Contribute to this [enhanced fork](https://github.com/sawell1/Discord-Bot)

---

## 📄 License

This project builds upon the original work by **[allenrkeen](https://github.com/allenrkeen)**. Please refer to the [original repository](https://github.com/allenrkeen/server-bot) for license details regarding the core functionality.

Enhanced features and modifications are maintained by **sawell1**.

---

## ⭐ Acknowledgments

**Special thanks to [allenrkeen](https://github.com/allenrkeen) for creating the excellent foundation that made this enhanced version possible!**

The original bot provided a solid, reliable base for Docker container management, and this fork aims to extend that functionality while maintaining the same level of quality and reliability.

---

## 🔗 Links

- **Original Repository:** https://github.com/allenrkeen/server-bot
- **Enhanced Repository:** https://github.com/sawell1/Discord-Bot
- **Original Docker Hub:** https://hub.docker.com/r/allenrkeen/server-bot
- **Enhanced Docker Hub:** https://hub.docker.com/r/sawell1/discord-bot
- **Discord Developer Portal:** https://discord.com/developers/applications
