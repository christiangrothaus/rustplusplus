import 'dotenv/config';
import Manager from './src/classes/Manager';

const manager = new Manager();

manager.start();

process.on('SIGTERM', () => {manager?.destroy();});
process.on('SIGINT', () => {manager?.destroy();});
process.on('uncaughtException', (err) => {
  console.error(err);
  manager?.destroy();
});