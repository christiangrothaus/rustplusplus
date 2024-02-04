import 'dotenv/config';
import * as rustplus from '@liamcottle/rustplus.js';
import DiscordManager from './classes/DiscordManager';
import { Client, GatewayIntentBits } from 'discord.js';

export const discordManager = new DiscordManager(
  new Client({ intents: [GatewayIntentBits.Guilds] }), 
  new rustplus('168.100.163.133', '28182', '76561198057625988', process.env.RUST_TOKEN)
);

discordManager.start();

process.on('SIGTERM', discordManager.destroy);
process.on('SIGINT', discordManager.destroy);