import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, MessageCreateOptions } from 'discord.js';
import { EntityType } from '../../models/RustPlus.models';

export type MessageJson<BaseEntityInfo> = {
  entityInfo: BaseEntityInfo,
  messageId: string,
  channelId: string
  entityType: EntityType
};

export default abstract class BaseSmartMessage<BaseEntityInfo> implements MessageCreateOptions {
  public embeds: Array<EmbedBuilder>;

  public components: Array<ActionRowBuilder<ButtonBuilder>>;

  public entityInfo: BaseEntityInfo;

  public messageId: string;

  public channelId: string;

  public abstract readonly entityType: EntityType;

  protected abstract ENTITY_IMAGE_URL: string;

  constructor(entityInfo: BaseEntityInfo) {
    this.entityInfo = entityInfo;

    this.embeds = [this.createMessageEmbed(this.entityInfo)];
    this.components = [this.createMessageButtons(this.entityInfo)];
  }

  public async update(entityInfo: Partial<BaseEntityInfo>): Promise<void> {
    this.entityInfo = { ...this.entityInfo, ...entityInfo };

    this.embeds = [this.createMessageEmbed(this.entityInfo)];
    this.components = [this.createMessageButtons(this.entityInfo)];
  }

  public toJSON(): MessageJson<BaseEntityInfo> {
    return {
      entityInfo: this.entityInfo,
      messageId: this.messageId,
      channelId: this.channelId,
      entityType: this.entityType
    };
  }

  protected abstract createMessageEmbed(entityInfo: BaseEntityInfo): EmbedBuilder;

  protected abstract createMessageButtons(entityInfo: BaseEntityInfo): ActionRowBuilder<ButtonBuilder>;
}