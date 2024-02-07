import 'dotenv/config';
import DiscordManager from './src/classes/DiscordManager';

export const discordManager = new DiscordManager();

discordManager.start();

process.on('SIGTERM', discordManager.destroy);
process.on('SIGINT', discordManager.destroy);