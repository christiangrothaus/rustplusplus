import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import BaseSmartMessage from './BaseSmartMessage';
import SmartSwitchEntityInfo from '../entityInfo/SmartSwitchEntityInfo';



export default class SmartSwitchMessage extends BaseSmartMessage<SmartSwitchEntityInfo> {
  protected ENTITY_IMAGE_URL = 'https://raw.githubusercontent.com/christiangrothaus/rustplusplus/main/src/assets/images/smart-switch.png';

  constructor(entityInfo: SmartSwitchEntityInfo) {
    super(entityInfo);
  }

  createMessageEmbed(entityInfo: SmartSwitchEntityInfo): EmbedBuilder {
    const { name, entityId, isActive } = entityInfo;

    const embedBuilder = new EmbedBuilder()
      .setColor(isActive ? 0x55ff55 : 0xff5555)
      .addFields({ name: 'Status', value: isActive ? 'On' : 'Off' })
      .setTitle(name)
      .setFooter({ text: entityId })
      .setTimestamp()
      .setThumbnail(this.ENTITY_IMAGE_URL);

    return embedBuilder;
  }

  createMessageButtons(entityInfo: SmartSwitchEntityInfo): ActionRowBuilder<ButtonBuilder> {
    const { entityId } = entityInfo;

    const onButton = new ButtonBuilder()
      .setCustomId(entityId + '-on')
      .setLabel('On')
      .setStyle(ButtonStyle.Success);

    const offButton = new ButtonBuilder()
      .setCustomId(entityId + '-off')
      .setLabel('Off')
      .setStyle(ButtonStyle.Danger);

    const editButton = new ButtonBuilder()
      .setCustomId(entityId + '-edit')
      .setLabel('Edit')
      .setStyle(ButtonStyle.Primary);

    const deleteButton = new ButtonBuilder()
      .setCustomId(entityId + '-delete')
      .setLabel('Delete')
      .setStyle(ButtonStyle.Secondary);

    return new ActionRowBuilder<ButtonBuilder>().setComponents(onButton, offButton, editButton, deleteButton);
  }
}