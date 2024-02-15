import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, MessageCreateOptions } from 'discord.js';
import { EntityType } from '../../models/RustPlus.models';
import BaseEntityInfo from '../entityInfo/BaseEntityInfo';

export type MessageJson<BaseEntityInfo> = {
  entityInfo: BaseEntityInfo,
  messageId: string,
  channelId: string
  entityType: EntityType
};

export default abstract class BaseSmartMessage<T extends BaseEntityInfo> implements MessageCreateOptions {
  public embeds: Array<EmbedBuilder>;

  public components: Array<ActionRowBuilder<ButtonBuilder>>;

  public entityInfo: T;

  public messageId: string;

  public channelId: string;

  public abstract readonly entityType: EntityType;

  protected abstract ENTITY_IMAGE_URL: string;

  constructor(entityInfo: T) {
    this.entityInfo = entityInfo;

    this.embeds = [this.createMessageEmbed(this.entityInfo)];
    this.components = [this.createMessageButtons(this.entityInfo)];
  }

  public async update(entityInfo: Partial<T>): Promise<void> {
    this.entityInfo = { ...this.entityInfo, ...entityInfo };

    this.embeds = [this.createMessageEmbed(this.entityInfo)];
    this.components = [this.createMessageButtons(this.entityInfo)];
  }

  public toJSON(): MessageJson<T> {
    return {
      entityInfo: this.entityInfo,
      messageId: this.messageId,
      channelId: this.channelId,
      entityType: this.entityType
    };
  }

  protected abstract createMessageEmbed(entityInfo: T): EmbedBuilder;

  protected abstract createMessageButtons(entityInfo: T): ActionRowBuilder<ButtonBuilder>;
}