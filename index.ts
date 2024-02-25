import 'dotenv/config';
import Manager from './src/classes/Manager';
import PushListener from './src/classes/PushListener';

const pushListener = new PushListener();

pushListener.fcmRegister();

const manager = new Manager();

manager.start();

process.on('SIGTERM', () => {manager.destroy();});
process.on('SIGINT', () => {manager.destroy();});
process.on('uncaughtException', (err) => {
  console.error(err);
  manager.destroy();
});