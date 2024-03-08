import { EmbedBuilder, MessageCreateOptions } from 'discord.js';
import BaseNotificationInfo from './notification-info/BaseNotificationInfo';

export default abstract class BaseNotification<T extends BaseNotificationInfo> implements MessageCreateOptions {
  public embeds: Array<EmbedBuilder>;

  public get entityInfo(): Readonly<T> {
    return this._entityInfo;
  }

  protected _entityInfo: T;

  constructor(entityInfo: T) {
    this.embeds = [this.createNotificationEmbed(entityInfo)];
  }

  protected abstract createNotificationEmbed(entityInfo: T): EmbedBuilder;
}