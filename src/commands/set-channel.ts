import { SlashCommandBuilder } from 'discord.js';
import Command, { CommandExecute } from '../classes/Command';

export const data = new SlashCommandBuilder()
  .setName('setchannel')
  .setDescription('Sets the channel to be used');

export const execute: CommandExecute = async (interaction, discordManager) => {
  discordManager.state.channelId = interaction.channelId;

  interaction.reply({ content: 'Switches being created', ephemeral: true }).then(message => {
    setTimeout(() => message.delete(), 5000);
  });
};

export default new Command(data, execute);