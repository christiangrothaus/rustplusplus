import 'dotenv/config';
import * as RustPlus from '@liamcottle/rustplus.js';

export default class RustPlusWrapper {

  private client: RustPlus;

  constructor(serverHost: string, serverPort: number) {
    this.client = new RustPlus(serverHost, serverPort, process.env.STEAM_ID, process.env.RUST_TOKEN);
  }

  public connect(): void {
    this.client.connect();
  }

  public async getEntityInfo(entityId: string): Promise<any> {
    return new Promise((resolve) => {
      this.client.getEntityInfo(entityId, (message) => {
        resolve(message);
      });
    });
  }

  public async toggleSmartSwitch(entityId: string, on: boolean): Promise<any> {
    return new Promise((resolve) => {
      if (on) {
        this.client.turnSmartSwitchOn(entityId, (message) => {
          resolve(message);
        });
      } else {
        this.client.turnSmartSwitchOff(entityId, (message) => {
          resolve(message);
        });
      }
    });
  }

  public onEntityChange(callback: (message: any) => void): void {
    this.client.on('message', (msg) => {
      if (msg?.broadcast?.entityChanged) {
        callback(msg);
      }
    });
  }
}