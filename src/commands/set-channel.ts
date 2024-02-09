import { SlashCommandBuilder } from 'discord.js';
import Command, { CommandExecute } from '../classes/Command';
import { ephemeralReply } from '../utils/messages';

export const data = new SlashCommandBuilder()
  .setName('setchannel')
  .setDescription('Sets the channel to be used');

export const execute: CommandExecute = async (interaction, discordManager) => {
  discordManager.saveData.channelId = interaction.channelId;

  interaction.reply(ephemeralReply('Switches being created')).then(message => {
    setTimeout(() => message.delete(), 5000);
  });
};

export default new Command(data, execute);