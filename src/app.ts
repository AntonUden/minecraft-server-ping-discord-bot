import MinecraftPingBot from "./MinecraftServerPingBot";

const config: any = require('../config.json');

const bot: MinecraftPingBot = new MinecraftPingBot(config.discord_token, config.max_requests_per_minute);