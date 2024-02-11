import 'dotenv/config';
import DiscordManager from './src/classes/DiscordManager';

export const SAVE_DATA_PATH = __dirname + '/save.json';

export const discordManager = new DiscordManager();

discordManager.start();

process.on('SIGTERM', () => discordManager.destroy());
process.on('SIGINT', () => discordManager.destroy());
process.on('uncaughtException', () => discordManager.destroy());