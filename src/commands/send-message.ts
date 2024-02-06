import { SlashCommandBuilder } from 'discord.js';
import Command, { CommandData, CommandExecute } from '../classes/Command';
import { ephemeralReply } from '../utils/replies';

const MESSAGE_PARAM = 'message';

const data: CommandData = new SlashCommandBuilder()
  .setName('sendmessage')
  .setDescription('Sends a message in game')
  .addStringOption(option => 
    option.setDescription('The message to send')
      .setName(MESSAGE_PARAM)
  );

const execute: CommandExecute = async (interaction, discordManager) => {
  discordManager.rustPlus.sendRequest({
    sendTeamMessage: {
      message: interaction.options.getString(MESSAGE_PARAM)
    }
  }, () => {
    interaction.reply(ephemeralReply('Message sent'));
  });
};

export default new Command(data, execute);