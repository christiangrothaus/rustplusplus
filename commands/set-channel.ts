import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { BehaviorSubject } from 'rxjs';
import Command, { CommandExecute } from '../classes/Command';

export const channelId$ = new BehaviorSubject<string>('');

export const data = new SlashCommandBuilder()
  .setName('setchannel')
  .setDescription('Sets the channel to be used');

export const execute: CommandExecute = async (interaction: ChatInputCommandInteraction) => {
  channelId$.next(interaction.channelId);

  interaction.reply('Switches being created');
};

export default new Command(data, execute);