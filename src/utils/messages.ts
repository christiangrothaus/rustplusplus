import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CacheType, Embed, EmbedBuilder, InteractionReplyOptions, Message } from 'discord.js';

export const ephemeralReply = (content: string): InteractionReplyOptions => {
  const reply: InteractionReplyOptions = { content: content, ephemeral: true };
  return reply;
};

export const createSmartSwitchEmbed = (name: string, entityId: string, isActive?: boolean, imageUrl?: string): EmbedBuilder => {
  const embedBuilder = new EmbedBuilder()
    .setColor(isActive ? 0x55ff55 : 0xff5555)
    .addFields({ name: 'Status', value: isActive ? 'On' : 'Off' })
    .setTitle(name)
    .setFooter({ text: entityId })
    .setTimestamp();

  if (imageUrl) {
    embedBuilder.setImage(imageUrl);
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

export const updateMessage = async (message: Message<boolean>, entityId?: string, name?: string, isActive?: boolean, imageUrl?: string): Promise<void> => {
  if (!entityId) {
    entityId = message.embeds[0].footer?.text;
  }

  if (!name) {
    name = message.embeds[0].title;
  }

  if (typeof isActive !== 'boolean') {
    isActive = message.embeds[0].fields.find((field) => field.name === 'Status')?.value === 'On';
  }

  if (!imageUrl) {
    imageUrl = message.embeds[0].image?.url;
  }

  await message.edit({ embeds: [createSmartSwitchEmbed(name, entityId, isActive, imageUrl)] });
};