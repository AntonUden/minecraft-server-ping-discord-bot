import Discord, { Client, Message } from 'discord.js'
import validator from 'validator';

const mcping = require('minecraft-ping');

export default class MinecraftPingBot {
	private _client: Client;

	private _maxRequestsPerMinute: number;
	private _requestCount: { [key: string]: number };

	public static INSTANCE: MinecraftPingBot;

	constructor(token: string, maxRequestsPerMinute: number) {
		MinecraftPingBot.INSTANCE = this;

		this._maxRequestsPerMinute = maxRequestsPerMinute;
		this._requestCount = {};
		this._client = new Discord.Client();

		this._client.on('message', async function (msg: Message) {
			if (msg.author.bot) {
				return;
			}

			if(msg.content.toLocaleLowerCase() == "!help") {
				MinecraftPingBot.INSTANCE._sendUseage(msg);
			} else if(msg.content.toLocaleLowerCase().startsWith("!mcping") || msg.content.toLocaleLowerCase().startsWith("!mcping ")) {
				let parts: string[] = msg.content.toLocaleLowerCase().split(" ");

				if(parts.length == 1 || parts.length > 2) {
					MinecraftPingBot.INSTANCE._sendUseage(msg);
				} else {
					let serverParts: string[] = parts[1].split(":");
					
					if(serverParts.length == 1 || serverParts.length == 2) {
						let serverHost: string = serverParts[0];	
						let serverPort: number = 25565;
						if(serverParts.length == 2) {
							let portStr: string = serverParts[1];

							if(validator.isPort(portStr)) {
								serverPort = parseInt(portStr);
							} else {
								msg.reply("Invalid port number");
								return;
							}
						}

						if(MinecraftPingBot.INSTANCE._requestCount[msg.author.id] == undefined) {
							MinecraftPingBot.INSTANCE._requestCount[msg.author.id] = 0;
						}
						
						if(MinecraftPingBot.INSTANCE._requestCount[msg.author.id] >= MinecraftPingBot.INSTANCE._maxRequestsPerMinute) {
							msg.reply("You are being rate limited! Please try again later");
							return;
						}

						MinecraftPingBot.INSTANCE._requestCount[msg.author.id]++;

						msg.reply("Pinging " + serverHost + (serverPort != 25565 ? ":" + serverPort : ""));
						try {
							mcping.ping_fe01fa({host:serverHost, port:serverPort}, function(err, response) {
								if(err) {
									msg.reply("Could not reach " + serverHost + (serverPort != 25565 ? ":" + serverPort : ""));
									return;
								}

								let text: string = "";

								text += "\n" + serverHost + (serverPort != 25565 ? ":" + serverPort : "") + " is online"
								text += "\nVersion: " + response.gameVersion;
								text += "\nPlayers online: " + response.playersOnline + "/" + response.maxPlayers;
								text += "\nMOTD: " + response.motd;
								
								msg.reply(text);
							});
						} catch(err) {
							msg.reply("An error occurred! please try again later");
						}
					} else {
						MinecraftPingBot.INSTANCE._sendUseage(msg);
					}
				}
			}
		});

		this._client.on('ready', () => {
			console.log(`Logged in as ${this._client.user.tag}!`);
		});

		setInterval(function() {
			//console.log(MinecraftPingBot.INSTANCE._requestCount);
			for(let i in MinecraftPingBot.INSTANCE._requestCount) {
				MinecraftPingBot.INSTANCE._requestCount[i] = 0;
			}
		}, 60000); // 1 minute

		this._client.login(token);
	}

	_sendUseage(message: Message) {
		message.reply("Useage:\n!mcping mc.hypixel.net\n!mcping mc.hypixel.net:25565");
	}
}