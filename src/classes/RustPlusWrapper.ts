import 'dotenv/config';
import RustPlus from '@liamcottle/rustplus.js';

export const RUST_PLUS_SERVER_PORT_DEFAULT = 28082;
export const RUST_PLUS_SERVER_PORT_OFFSET = 67;

export default class RustPlusWrapper {

  serverHost: string;

  serverPort: number;

  private client: RustPlus;

  constructor(serverHost: string, serverPort: number) {
    this.serverHost = serverHost;
    this.serverPort = serverPort || RUST_PLUS_SERVER_PORT_DEFAULT;
  }

  public connect(): void {
    this.client = new RustPlus(this.serverHost, this.serverPort, process.env.STEAM_ID, process.env.RUST_TOKEN);
    this.client.connect();
  }

  public async getEntityInfo(entityId: string): Promise<any> {
    if (!this.client) { return; }
    return new Promise((resolve) => {
      this.client.getEntityInfo(entityId, (message) => {
        resolve(message);
      });
    });
  }

  public async toggleSmartSwitch(entityId: string, on: boolean): Promise<any> {
    if (!this.client) { return; }
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

  public hasClient(): boolean {
    return !!this.client;
  }
}