import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, TextChannel } from 'discord.js';
import BaseSmartMessage from './BaseSmartMessage';
import SmartAlarmEntityInfo from '../entityInfo/SmartAlarmEntityInfo';

export default class SmartAlarmMessage extends BaseSmartMessage<SmartAlarmEntityInfo> {
  public readonly entityType = 'Alarm';

  protected ENTITY_IMAGE_URL = 'https://raw.githubusercontent.com/christiangrothaus/rustplusplus/main/src/assets/images/smart-alarm.png';

  constructor(channel: TextChannel, entityInfo: SmartAlarmEntityInfo) {
    super(channel, entityInfo);
  }

  createMessageEmbed(entityInfo: SmartAlarmEntityInfo): EmbedBuilder {
    const { name, entityId } = entityInfo;

    const embedBuilder = new EmbedBuilder()
      .setColor(0xff5555)
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