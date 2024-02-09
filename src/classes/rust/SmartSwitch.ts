import { ActionRowBuilder, BaseMessageOptions, ButtonBuilder, ButtonStyle } from 'discord.js';
import { newSmartSwitchEmbed } from '../../utils/messages';

export type SmartSwitchJSON = {
  name: string,
  entityId: string,
  isActive?: boolean,
  messageId?: string
}

export default class SmartSwitch {

  name: string;

  entityId: string;

  isActive?: boolean;

  messageId?: string;

  constructor(name: string, entityId: string, isActive?: boolean, messageId?: string) {
    this.name = name;

    this.entityId = entityId;

    this.isActive = isActive;

    this.messageId = messageId;
  }

  toEmbedMessage(): BaseMessageOptions {
    const onButton = new ButtonBuilder()
      .setCustomId(this.entityId + '-on')
      .setLabel('On')
      .setStyle(ButtonStyle.Success);

    const offButton = new ButtonBuilder()
      .setCustomId(this.entityId + '-off')
      .setLabel('Off')
      .setStyle(ButtonStyle.Danger);

    const nameButton = new ButtonBuilder()
      .setCustomId(this.entityId + '-name')
      .setLabel('Name')
      .setStyle(ButtonStyle.Primary);

    const refreshButton = new ButtonBuilder()
      .setCustomId(this.entityId + '-refresh')
      .setLabel('Refresh')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().setComponents(onButton, offButton, nameButton, refreshButton);
    const embed = newSmartSwitchEmbed(this.name, this.entityId, this.isActive);

    return {
      embeds: [embed],
      components: [row]
    };
  }

  toJSON(): SmartSwitchJSON {
    return {
      name: this.name,
      entityId: this.entityId,
      isActive: this.isActive,
      messageId: this.messageId
    };
  }
}