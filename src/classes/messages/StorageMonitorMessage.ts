import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import BaseSmartMessage, { StorageMonitorInfo } from './BaseSmartMessage';



export default class StorageMonitorMessage extends BaseSmartMessage<StorageMonitorInfo> {
  protected ENTITY_IMAGE_URL = 'https://raw.githubusercontent.com/christiangrothaus/rustplusplus/main/src/assets/images/storage-monitor.png';

  constructor(entityInfo: StorageMonitorInfo) {
    super(entityInfo);
  }

  createMessageEmbed(entityInfo: StorageMonitorInfo): EmbedBuilder {
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

  createMessageButtons(entityInfo: StorageMonitorInfo): ActionRowBuilder<ButtonBuilder> {
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