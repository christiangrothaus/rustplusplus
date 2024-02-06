import { SlashCommandBuilder } from 'discord.js';
import { BehaviorSubject } from 'rxjs';
import Command, { CommandExecute } from '../classes/Command';
import { ephemeralReply } from '../utils/replies';

export const channelId$ = new BehaviorSubject<string>('');

export const data = new SlashCommandBuilder()
  .setName('setchannel')
  .setDescription('Sets the channel to be used');

export const execute: CommandExecute = async (interaction) => {
  channelId$.next(interaction.channelId);

  interaction.reply(ephemeralReply('Switches being created'));
};

export default new Command(data, execute);