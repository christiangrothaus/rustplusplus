import 'dotenv/config';
import RustPlus from '@liamcottle/rustplus.js';
import { EntityChanged, EntityInfo, Message } from '../models/RustPlus.models';
import { EventEmitter } from 'events';
import State from './State';

export const RUST_PLUS_SERVER_PORT_DEFAULT = 28082;
export const RUST_PLUS_SERVER_PORT_OFFSET = 67;

export enum RustPlusEvents {
  EntityChange = 'EntityChange',
  Connected = 'Connected'
}

declare interface RustPlusWrapper {
  on(event: RustPlusEvents.EntityChange, listener: (entityChanged: EntityChanged) => void): this;
  on(event: RustPlusEvents.Connected, listener: () => void): this;
}

class RustPlusWrapper extends EventEmitter {

  serverHost: string;

  serverPort: number;

  rustToken: string;

  state: State = State.getInstance();

  private client: RustPlus;

  private keepAliveId: NodeJS.Timeout;

  private storageMonitorUpdaterId: NodeJS.Timeout;

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
    this.stopStorageMonitorUpdater();
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

      if (on) {
        this.client.turnSmartSwitchOn(entityId, (message: Message) => {
          const error = this.getErrorMessage(message);
          console.log(error);
          if (error) {
            reject(error);
          }
          resolve(message);
        });
      } else {
        this.client.turnSmartSwitchOff(entityId, (message: Message) => {
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

  public isConnected(): boolean {
    return this.client?.isConnected?.() ?? false;
  }

  public subscribeToAllEntityChanges(): void {
    if (!this.client) {
      throw new Error('Failed to get all entity info. Client not connected.');
    }

    const pairedSwitches = this.state.pairedSwitches.values();
    const pairedAlarms = this.state.pairedAlarms.values();
    const pairedStorageMonitors = this.state.pairedStorageMonitors.values();
    const pairedEntities = [...pairedSwitches, ...pairedAlarms, ...pairedStorageMonitors];

    for (const entity of pairedEntities) {
      this.client.getEntityInfo(entity.entityInfo.entityId, (message: Message) => {
        const entityChanged: EntityChanged = {
          entityId: +entity.entityInfo.entityId,
          ...message.response.entityInfo
        };

        this.emit(RustPlusEvents.EntityChange, entityChanged);
      });
      setTimeout(() => {}, 334); // set to about 3 requests per second to match the replenish rate
    }

    this.startStorageMonitorUpdater();
  }

  private startStorageMonitorUpdater(): void {
    this.storageMonitorUpdaterId = setInterval(() => {
      const pairedStorageMonitors = this.state.pairedStorageMonitors.values();

      for (const storageMonitor of pairedStorageMonitors) {
        setTimeout(() => {}, 334); // set to about 3 requests per second to match the replenish rate

        this.client.getEntityInfo(storageMonitor.entityInfo.entityId, (message: Message) => {
          const entityChanged: EntityChanged = {
            entityId: +storageMonitor.entityInfo.entityId,
            ...message.response.entityInfo
          };

          this.emit(RustPlusEvents.EntityChange, entityChanged);
        });
      }
    }, 5 * 60 * 1000);
  }

  private registerListeners(): void {
    this.client.on('connected', () => {
      this.emit(RustPlusEvents.Connected);
    });

    this.client.on('message', (message: Message) => {
      if (message?.broadcast?.entityChanged) {
        this.emit(RustPlusEvents.EntityChange, message.broadcast.entityChanged);
      }
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

  private stopStorageMonitorUpdater(): void {
    clearInterval(this.storageMonitorUpdaterId);
    this.storageMonitorUpdaterId = undefined;
  }
}

export default RustPlusWrapper;