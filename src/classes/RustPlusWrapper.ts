import 'dotenv/config';
import RustPlus from '@liamcottle/rustplus.js';

export const RUST_PLUS_SERVER_PORT_DEFAULT = 28082;
export const RUST_PLUS_SERVER_PORT_OFFSET = 67;

export default class RustPlusWrapper {

  serverHost: string;

  serverPort: number;

  private client: RustPlus;

  private entityChangeCallbacks: Array<(message: any) => void> = [];

  private connectedCallbacks: Array<() => void> = [];

  constructor(serverHost: string, serverPort?: number) {
    this.serverHost = serverHost;
    this.serverPort = serverPort || RUST_PLUS_SERVER_PORT_DEFAULT;
  }

  public connect(): void {
    this.client = new RustPlus(this.serverHost, this.serverPort, process.env.STEAM_ID, process.env.RUST_TOKEN);
    this.client.connect();
    this.registerListeners();
  }

  public async getEntityInfo(entityId: string): Promise<any> {
    if (!this.client) { return; }
    return new Promise((resolve) => {
      this.client.getEntityInfo(entityId, (message) => {
        resolve(message);
        return true;
      });
    });
  }

  public async toggleSmartSwitch(entityId: string, on: boolean): Promise<any> {
    if (!this.client) { return; }
    return new Promise((resolve, reject) => {
      if (on) {
        this.client.turnSmartSwitchOn(entityId, (message) => {
          const error = this.getErrorMessage(message);
          console.log(error);
          if (error) {
            reject(error);
          }
          resolve(message);
        });
      } else {
        this.client.turnSmartSwitchOff(entityId, (message) => {
          const error = this.getErrorMessage(message);
          if (error) {
            reject(error);
          }
          resolve(message);
        });
      }
    });
  }

  public onEntityChange(callback: (message: any) => void): void {
    this.entityChangeCallbacks.push(callback);
  }

  public onConnected(callback: () => void): void {
    this.connectedCallbacks.push(callback);
  }

  public hasClient(): boolean {
    return !!this.client;
  }

  private registerListeners(): void {
    this.client.on('connected', () => {
      this.connectedCallbacks.forEach((callback) => callback());
    });

    this.client.on('message', (msg) => {
      console.log('message received: ' + JSON.stringify(msg));
      if (msg?.broadcast?.entityChanged) {
        this.entityChangeCallbacks.forEach((callback) => callback(msg));
      }
    });
  }

  private getErrorMessage(message): string | undefined {
    const error = message?.response?.error?.error;

    switch (error) {
      case 'not_found': {
        return 'Entity not found';
      }
    }

    return;
  }
}