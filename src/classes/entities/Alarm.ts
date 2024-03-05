import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import BaseEntity from './BaseEntity';
import AlarmEntityInfo from '../entityInfo/AlarmEntityInfo';
import { EntityType } from '../../models/RustPlus.models';

export default class Alarm extends BaseEntity<AlarmEntityInfo> {
  public readonly entityType = EntityType.Alarm;

  protected ENTITY_IMAGE_URL = 'https://raw.githubusercontent.com/christiangrothaus/rustplusplus/main/src/assets/images/smart-alarm.png';

  constructor(entityInfo: AlarmEntityInfo) {
    super(entityInfo);
  }

  createMessageEmbed(entityInfo: AlarmEntityInfo): EmbedBuilder {
    const { name, entityId } = entityInfo;

    const embedBuilder = new EmbedBuilder()
      .setColor(0xff5555)
      .setTitle(name)
      .setFooter({ text: entityId })
      .setTimestamp()
      .setThumbnail(this.ENTITY_IMAGE_URL);

    return embedBuilder;
  }

  createMessageButtons(entityInfo: AlarmEntityInfo): ActionRowBuilder<ButtonBuilder> {
    const { entityId } = entityInfo;

    const editButton = new ButtonBuilder()
      .setCustomId(entityId + '-edit')
      .setLabel('Edit')
      .setStyle(ButtonStyle.Primary);

    const deleteButton = new ButtonBuilder()
      .setCustomId(entityId + '-delete')
      .setLabel('Delete')
      .setStyle(ButtonStyle.Secondary);

    return new ActionRowBuilder<ButtonBuilder>().setComponents(editButton, deleteButton);
  }
}