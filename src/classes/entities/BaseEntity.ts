import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, MessageCreateOptions } from 'discord.js';
import { EntityType } from '../../models/RustPlus.models';
import BaseEntityInfo from '../entityInfo/BaseEntityInfo';

export default abstract class BaseEntity<T extends BaseEntityInfo> implements MessageCreateOptions {
  public embeds: Array<EmbedBuilder>;

  public components: Array<ActionRowBuilder<ButtonBuilder>>;

  public entityInfo: T;

  public abstract readonly entityType: EntityType;

  protected abstract ENTITY_IMAGE_URL: string;

  constructor(entityInfo: T) {
    this.entityInfo = entityInfo;

    this.embeds = [this.createMessageEmbed(this.entityInfo)];
    this.components = [this.createMessageButtons(this.entityInfo)];
  }

  public toJSON(): T {
    return this.entityInfo;
  }

  protected abstract createMessageEmbed(entityInfo: T): EmbedBuilder;

  protected abstract createMessageButtons(entityInfo: T): ActionRowBuilder<ButtonBuilder>;
}