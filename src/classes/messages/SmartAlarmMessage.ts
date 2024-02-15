import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import BaseSmartMessage from './BaseSmartMessage';
import SmartAlarmEntityInfo from '../entityInfo/SmartAlarmEntityInfo';

export default class SmartAlarmMessage extends BaseSmartMessage<SmartAlarmEntityInfo> {
  public readonly entityType = 'Alarm';

  protected ENTITY_IMAGE_URL = 'https://raw.githubusercontent.com/christiangrothaus/rustplusplus/main/src/assets/images/smart-alarm.png';

  constructor(entityInfo: SmartAlarmEntityInfo) {
    super(entityInfo);
  }

  createMessageEmbed(entityInfo: SmartAlarmEntityInfo): EmbedBuilder {
    const { name, entityId, isActive } = entityInfo;

    const embedBuilder = new EmbedBuilder()
      .setColor(isActive ? 0x55ff55 : 0xff5555)
      .addFields({ name: 'Status', value: isActive ? 'Triggered' : 'Off' })
      .setTitle(name)
      .setFooter({ text: entityId })
      .setTimestamp()
      .setThumbnail(this.ENTITY_IMAGE_URL);

    return embedBuilder;
  }

  createMessageButtons(entityInfo: SmartAlarmEntityInfo): ActionRowBuilder<ButtonBuilder> {
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