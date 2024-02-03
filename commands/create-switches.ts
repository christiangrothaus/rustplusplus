import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { BehaviorSubject } from 'rxjs';

export const createSwitches = new BehaviorSubject<string>('');

export const data = new SlashCommandBuilder()
  .setName('createswitches')
  .setDescription('Creates the switches');

export const execute = (interaction: ChatInputCommandInteraction) => {
  createSwitches.next(interaction.channelId);

  interaction.reply('Switches being created');
};