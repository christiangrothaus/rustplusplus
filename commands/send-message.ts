import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { rustPlusClient } from '..';

const MESSAGE_PARAM = 'message';

export const data = new SlashCommandBuilder()
  .setName('sendmessage')
  .setDescription('Sends a message in game')
  .addStringOption(option => 
    option.setDescription('The message to send')
      .setName(MESSAGE_PARAM)
  );

export const execute = (interaction: ChatInputCommandInteraction) => {
  console.log(interaction.options.getString(MESSAGE_PARAM));
  rustPlusClient.sendRequest({
    sendTeamMessage: {
      message: interaction.options.getString(MESSAGE_PARAM)
    }
  }, () => {
    interaction.reply('Message sent');
  });
};