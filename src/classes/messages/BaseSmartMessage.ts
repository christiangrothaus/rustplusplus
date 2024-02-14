import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, MessageCreateOptions } from 'discord.js';

type SmartMessageJson<BaseEntityInfo> = {
  entityInfo: BaseEntityInfo,
  messageId: string,
  channelId: string
};

export default abstract class BaseSmartMessage<BaseEntityInfo> implements MessageCreateOptions {
  public embeds: Array<EmbedBuilder>;

  public components: Array<ActionRowBuilder<ButtonBuilder>>;

  public entityInfo: BaseEntityInfo;

  public messageId: string;

  public channelId: string;

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

  public toJSON(): SmartMessageJson<BaseEntityInfo> {
    return {
      entityInfo: this.entityInfo,
      messageId: this.messageId,
      channelId: this.channelId
    };
  }

  protected abstract createMessageEmbed(entityInfo: BaseEntityInfo): EmbedBuilder;

  protected abstract createMessageButtons(entityInfo: BaseEntityInfo): ActionRowBuilder<ButtonBuilder>;
}