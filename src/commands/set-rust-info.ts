import { SlashCommandBuilder } from 'discord.js';
import Command, { CommandExecute } from '../classes/Command';
import { ephemeralReply } from '../utils/messages';
import { RUST_PLUS_SERVER_PORT_OFFSET } from '../classes/RustPlusWrapper';

const SERVER_HOST_FIELD = 'serverhost';
const SERVER_PORT_FIELD = 'serverport';

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

export const execute: CommandExecute = async (interaction, discordManager) => {
  const host = interaction.options.getString(SERVER_HOST_FIELD);
  const port = interaction.options.getNumber(SERVER_PORT_FIELD);

  if (!host) {
    interaction.reply(ephemeralReply('No server hostname/IP provided'));
    return;
  }


  if (port) {
    if (port < 1 || port > 65535) {
      interaction.reply(ephemeralReply('Invalid port number'));
      return;
    }
    discordManager.saveData.rustServerPort = port + RUST_PLUS_SERVER_PORT_OFFSET;
  }

  discordManager.saveData.rustServerHost = host;
  discordManager.restart();

  interaction.reply(ephemeralReply('Server info set successfully'));
};

export default new Command(data, execute);