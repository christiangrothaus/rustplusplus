import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, TextChannel } from 'discord.js';
import { newSmartSwitchEmbed } from '../../utils/messages';
import DiscordManager from '../DiscordManager';

type SmartSwitchMessageJSON = {
  smartSwitchId: string,
  channelId: string,
  messageId: string
}

export default class SmartSwitchMessage {

  channelId: string;

  messageId: string;

  smartSwitchId: string;

  constructor(smartSwitchId: string, channelId: string, messageId?: string) {
    this.smartSwitchId = smartSwitchId;
    this.channelId = channelId;
    this.messageId = messageId;
  }

  async create(discordManager: DiscordManager): Promise<Message<boolean>> {
    const smartSwitch = discordManager.saveData.switches[this.smartSwitchId];

    const onButton = new ButtonBuilder()
      .setCustomId(smartSwitch.entityId + '-on')
      .setLabel('On')
      .setStyle(ButtonStyle.Success);

    const offButton = new ButtonBuilder()
      .setCustomId(smartSwitch.entityId + '-off')
      .setLabel('Off')
      .setStyle(ButtonStyle.Danger);

    const nameButton = new ButtonBuilder()
      .setCustomId(smartSwitch.entityId + '-name')
      .setLabel('Name')
      .setStyle(ButtonStyle.Primary);

    const refreshButton = new ButtonBuilder()
      .setCustomId(smartSwitch.entityId + '-refresh')
      .setLabel('Refresh')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().setComponents(onButton, offButton, nameButton, refreshButton);
    const channel = discordManager.client.channels.cache.get(this.channelId) as TextChannel;

    const embed = newSmartSwitchEmbed(smartSwitch.name, smartSwitch.isActive);

    const message = await channel.send({
      embeds: [embed],
      components: [row]
    });

    this.messageId = message.id;

    return message;
  }

  refresh(discordManager: DiscordManager): void {
    if (!this.messageId) { return; } // The message hasn't been created yet

    const smartSwitch = discordManager.saveData.switches[this.smartSwitchId];

    const channel = discordManager.client.channels.cache.get(this.channelId) as TextChannel;
    if (channel) {
      const message = channel.messages.cache.get(this.messageId);
      if (message) {
        const embeds = [newSmartSwitchEmbed(smartSwitch.name, smartSwitch.isActive)];
        message.edit({ embeds });
      }
    }
  }

  toJSON(): SmartSwitchMessageJSON {
    return {
      channelId: this.channelId,
      messageId: this.messageId,
      smartSwitchId: this.smartSwitchId
    };
  }
}