import 'dotenv/config';
import RustPlus from '@liamcottle/rustplus.js';
import { EntityInfo, Message } from '../models/RustPlus.models';
import { EventEmitter } from 'events';

export const RUST_PLUS_SERVER_PORT_DEFAULT = 28082;
export const RUST_PLUS_SERVER_PORT_OFFSET = 67;

export enum RustPlusEvents {
  EntityChange = 'EntityChange',
  Connected = 'Connected'
}

export default class RustPlusWrapper extends EventEmitter {

  serverHost: string;

  serverPort: number;

  rustToken: string;

  private client: RustPlus;

  private keepAliveId: NodeJS.Timeout;

  constructor(serverHost: string, rustToken: string, serverPort: number = RUST_PLUS_SERVER_PORT_DEFAULT) {
    super();
    this.serverHost = serverHost;
    this.serverPort = serverPort;
    this.rustToken = rustToken;
  }

  public connect(): void {
    this.client = new RustPlus(this.serverHost, this.serverPort, process.env.STEAM_ID, this.rustToken);
    this.client.connect();
    this.registerListeners();
    this.startKeepAlive();
  }

  public updateRustPlusCreds(serverHost: string, serverPort: number = RUST_PLUS_SERVER_PORT_DEFAULT, rustToken?: string): void {
    this.serverHost = serverHost;
    this.serverPort = serverPort;
    if (rustToken) {
      this.rustToken = rustToken;
    }
    this.disconnect(false);
    this.connect();
  }

  public disconnect(removeListeners = true): void {
    this.client?.removeAllListeners();
    this.client?.disconnect();
    if (removeListeners) {
      this.removeAllListeners();
    }
    this.stopKeepAlive();
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

  public hasClient(): boolean {
    return !!this.client;
  }

  private registerListeners(): void {
    this.client.on('connected', () => {
      this.emit(RustPlusEvents.Connected);
    });

    this.client.on('message', (message: Message) => {
      this.emit(RustPlusEvents.EntityChange, message);
    });
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

  private startKeepAlive(): void {
    this.keepAliveId = setInterval(() => {
      if (this.client) {
        this.client.getTime(() => {});
      }
    }, 5 * 60 * 1000);
  }

  private stopKeepAlive(): void {
    clearInterval(this.keepAliveId);
    this.keepAliveId = undefined;
  }
}