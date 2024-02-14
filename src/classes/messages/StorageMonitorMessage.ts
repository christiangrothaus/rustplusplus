import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import BaseSmartMessage from './BaseSmartMessage';
import StorageMonitorEntityInfo from '../entityInfo/StorageMonitorEntityInfo';

export default class StorageMonitorMessage extends BaseSmartMessage<StorageMonitorEntityInfo> {
  protected ENTITY_IMAGE_URL = 'https://raw.githubusercontent.com/christiangrothaus/rustplusplus/main/src/assets/images/storage-monitor.png';

  constructor(entityInfo: StorageMonitorEntityInfo) {
    super(entityInfo);
  }

  createMessageEmbed(entityInfo: StorageMonitorEntityInfo): EmbedBuilder {
    const { name, entityId, capacity } = entityInfo;

    const embedBuilder = new EmbedBuilder()
      .setColor(0x2255ff)
      .addFields({ name: 'Status', value: `${capacity}` })
      .setTitle(name)
      .setFooter({ text: entityId })
      .setTimestamp()
      .setThumbnail(this.ENTITY_IMAGE_URL);

    return embedBuilder;
  }

  createMessageButtons(entityInfo: StorageMonitorEntityInfo): ActionRowBuilder<ButtonBuilder> {
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