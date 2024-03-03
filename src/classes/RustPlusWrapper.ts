import 'dotenv/config';
import RustPlus from '@liamcottle/rustplus.js';
import { EntityChanged, EntityInfo, Message } from '../models/RustPlus.models';

export const RUST_PLUS_SERVER_PORT_DEFAULT = 28082;
export const RUST_PLUS_SERVER_PORT_OFFSET = 67;

export default class RustPlusWrapper {

  serverHost: string;

  serverPort: number;

  rustToken: string;

  private client: RustPlus;

  private entityChangeCallbacks: Array<(message: EntityChanged) => void> = [];

  private connectedCallbacks: Array<() => void> = [];

  constructor(serverHost: string, rustToken: string, serverPort: number = RUST_PLUS_SERVER_PORT_DEFAULT) {
    this.serverHost = serverHost;
    this.serverPort = serverPort;
    this.rustToken = rustToken;
  }

  public connect(): void {
    this.client = new RustPlus(this.serverHost, this.serverPort, process.env.STEAM_ID, this.rustToken);
    this.client.connect();
    this.registerListeners();
  }

  public updateRustPlusCreds(serverHost: string, serverPort: number = RUST_PLUS_SERVER_PORT_DEFAULT, rustToken?: string): void {
    this.serverHost = serverHost;
    this.serverPort = serverPort;
    if (rustToken) {
      this.rustToken = rustToken;
    }
    this.disconnect();
    this.connect();
  }

  public disconnect(): void {
    this.client.removeAllListeners();
    this.client.disconnect();
  }

  public async getEntityInfo(entityId: string): Promise<EntityInfo> {
    return new Promise((resolve) => {
      if (!this.client) {
        throw new Error('Failed to get entity info. Client not connected.');
      }

      this.client.getEntityInfo(entityId, (message: Message) => {
        resolve(message?.response?.entityInfo);
      });
    });
  }

  public async toggleSmartSwitch(entityId: string, on: boolean): Promise<Message> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        throw new Error('Failed to toggle smart switch. Client not connected.');
      }

      const timeoutId = setTimeout(() => {
        reject('Request timed out');
      }, 3000);
      if (on) {
        this.client.turnSmartSwitchOn(entityId, (message: Message) => {
          clearTimeout(timeoutId);
          const error = this.getErrorMessage(message);
          if (error) {
            reject(error);
          }
          resolve(message);
        });
      } else {
        this.client.turnSmartSwitchOff(entityId, (message: Message) => {
          clearTimeout(timeoutId);
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
    this.client.on('connected', () => { this.callConnectedCallbacks(); });

    this.client.on('message', (message) => { this.callEntityChangeCallbacks(message as Message); });
  }

  private callEntityChangeCallbacks(message: Message): void {
    const entityChange = message?.broadcast?.entityChanged;
    if (entityChange) {
      this.entityChangeCallbacks.forEach((callback) => callback(message?.broadcast?.entityChanged));
    }
  }

  private callConnectedCallbacks(): void {
    this.connectedCallbacks.forEach((callback) => callback());
  }

  private getErrorMessage(message: Message): string | undefined {
    const error = message?.response?.error?.error;

    switch (error) {
      case 'not_found': {
        return 'Entity not found';
      }
    }

    return error;
  }
}