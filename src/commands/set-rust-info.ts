import { SlashCommandBuilder } from 'discord.js';
import Command, { CommandExecute } from '../classes/Command';
import { ephemeralReply } from '../utils/replies';

const SERVER_HOST_FIELD = 'Server Hostname/IP';
const SERVER_PORT_FIELD = 'Server Port';

export const data = new SlashCommandBuilder()
  .setName('setrustinfo')
  .setDescription('Sets the channel to be used')
  .addStringOption(option => {
    return option.setName(SERVER_HOST_FIELD)
      .setDescription('The hostname or IP of the server')
      .setRequired(true);
  })
  .addNumberOption(option => {
    return option.setName(SERVER_PORT_FIELD)
      .setDescription('The port of the server (default 28015)');
  });

export const execute: CommandExecute = async (interaction) => {
  const host = interaction.options.getString(SERVER_HOST_FIELD);
  const port = interaction.options.getNumber(SERVER_PORT_FIELD);

  if (!host) {
    interaction.reply(ephemeralReply('No server hostname/IP provided'));
    return;
  }

  if (port && (port < 1 || port > 65535)) {
    interaction.reply(ephemeralReply('Invalid port number'));
    return;
  }

  interaction.reply(ephemeralReply('Server info set successfully'));
};

export default new Command(data, execute);