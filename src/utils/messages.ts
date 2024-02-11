import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CacheType, Embed, EmbedBuilder, InteractionReplyOptions, Message } from 'discord.js';
import { EntityChanged } from '../models/RustPlus.models';

export const ephemeralReply = (content: string): InteractionReplyOptions => {
  const reply: InteractionReplyOptions = { content: content, ephemeral: true };
  return reply;
};

export const createSmartSwitchEmbed = (name: string, entityId: string, isActive?: boolean): EmbedBuilder => {
  const embedBuilder = new EmbedBuilder()
    .setColor(isActive ? 0x55ff55 : 0xff5555)

    .addFields({ name: 'Status', value: isActive ? 'On' : 'Off' })
    .setTimestamp();

  if (name) {
    embedBuilder.setTitle(name);
  }

  if (entityId) {
    embedBuilder.setFooter({ text: entityId });
  }

  return embedBuilder;
};

export const getMessageEmbed = (interaction: ButtonInteraction<CacheType>): Embed => {
  return interaction.message.embeds[0];
};

export const createSmartSwitchButtonRow = (entityId: string): ActionRowBuilder<ButtonBuilder> => {
  const onButton = new ButtonBuilder()
    .setCustomId(entityId + '-on')
    .setLabel('On')
    .setStyle(ButtonStyle.Success);

  const offButton = new ButtonBuilder()
    .setCustomId(entityId + '-off')
    .setLabel('Off')
    .setStyle(ButtonStyle.Danger);

  const nameButton = new ButtonBuilder()
    .setCustomId(entityId + '-name')
    .setLabel('Name')
    .setStyle(ButtonStyle.Primary);

  const deleteButton = new ButtonBuilder()
    .setCustomId(entityId + '-delete')
    .setLabel('Delete')
    .setStyle(ButtonStyle.Secondary);

  return new ActionRowBuilder<ButtonBuilder>().setComponents(onButton, offButton, nameButton, deleteButton);
};

export const updateMessageStatus = (message: Message<boolean>, entityChange: EntityChanged): void => {
  const isActive = entityChange?.payload?.value;
  const entityId = entityChange.entityId;
  const name = message.embeds[0].title;
  message.edit({ embeds: [createSmartSwitchEmbed(name, `${entityId}`, isActive)] });
};

export const updateMessageName = (message: Message<boolean>, name: string): void => {
  const entityId = message.embeds[0].footer?.text;
  const isActive = message.embeds[0].fields.find((field) => field.name === 'Status')?.value === 'On';
  message.edit({ embeds: [createSmartSwitchEmbed(name, entityId, isActive)] });
};