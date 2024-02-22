import 'dotenv/config';
import Manager from './src/classes/Manager';

export const manager = new Manager();

manager.start();

process.on('SIGTERM', () => manager.destroy());
process.on('SIGINT', () => manager.destroy());
process.on('uncaughtException', () => manager.destroy());