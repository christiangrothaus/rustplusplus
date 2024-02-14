import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, MessageCreateOptions } from 'discord.js';

export type SmartAlarmInfo = {
  name: string;
  entityId: string;
  isActive?: boolean;
};

export type SmartSwitchInfo = {
  name: string;
  entityId: string;
  isActive?: boolean;
};

export type StorageMonitorInfo = {
  name: string;
  entityId: string;
  capacity?: number;
};

type SmartMessageJson<AllInfos> = {
  entityInfo: AllInfos,
  messageId: string
}

export type AllInfos = SmartAlarmInfo | SmartSwitchInfo | StorageMonitorInfo;

export default abstract class BaseSmartMessage<AllInfos> implements MessageCreateOptions {
  public embeds: Array<EmbedBuilder>;

  public components: Array<ActionRowBuilder<ButtonBuilder>>;

  public entityInfo: AllInfos;

  public messageId: string;

  protected abstract ENTITY_IMAGE_URL: string;

  constructor(entityInfo: AllInfos) {
    this.entityInfo = entityInfo;

    this.embeds = [this.createMessageEmbed(entityInfo)];
    this.components = [this.createMessageButtons(entityInfo)];
  }

  public updateMessage(entityInfo: Partial<AllInfos>): void {
    this.entityInfo = { ...this.entityInfo, ...entityInfo };

    this.embeds = [this.createMessageEmbed(this.entityInfo)];
    this.components = [this.createMessageButtons(this.entityInfo)];
  }

  public toJSON(): SmartMessageJson<AllInfos> {
    return {
      entityInfo: this.entityInfo,
      messageId: this.messageId
    };
  }

  abstract createMessageEmbed(entityInfo: AllInfos): EmbedBuilder;

  //TODO - Add discord message param to auto update the message
  abstract createMessageButtons(entityInfo: AllInfos): ActionRowBuilder<ButtonBuilder>;
}