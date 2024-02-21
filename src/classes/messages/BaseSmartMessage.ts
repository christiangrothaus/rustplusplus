import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, Message, MessageCreateOptions, TextChannel } from 'discord.js';
import { EntityType } from '../../models/RustPlus.models';
import BaseEntityInfo from '../entityInfo/BaseEntityInfo';

export default abstract class BaseSmartMessage<T extends BaseEntityInfo> implements MessageCreateOptions {
  public embeds: Array<EmbedBuilder>;

  public components: Array<ActionRowBuilder<ButtonBuilder>>;

  public entityInfo: T;

  public message: Message;

  public abstract readonly entityType: EntityType;

  protected channel: TextChannel;

  protected abstract ENTITY_IMAGE_URL: string;

  constructor(channel: TextChannel, entityInfo: T) {
    this.entityInfo = entityInfo;
    this.channel = channel;

    this.embeds = [this.createMessageEmbed(this.entityInfo)];
    this.components = [this.createMessageButtons(this.entityInfo)];
  }

  public async send(): Promise<Message<boolean>> {
    this.message = await this.channel.send(this);
    return this.message;
  }

  public async update(entityInfo: Partial<T>): Promise<Message<boolean>> {
    this.entityInfo = { ...this.entityInfo, ...entityInfo };

    this.embeds = [this.createMessageEmbed(this.entityInfo)];
    this.components = [this.createMessageButtons(this.entityInfo)];

    return await this.message.edit(this);
  }

  protected abstract createMessageEmbed(entityInfo: T): EmbedBuilder;

  protected abstract createMessageButtons(entityInfo: T): ActionRowBuilder<ButtonBuilder>;
}