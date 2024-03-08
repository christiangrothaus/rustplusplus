import { APIEmbedField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import BaseEntity from './BaseEntity';
import StorageMonitorEntityInfo from './entity-info/StorageMonitorEntityInfo';
import { EntityType } from '../../models/RustPlus.models';
import RUST_ITEMS from '../../constants/rust-items';

export default class StorageMonitor extends BaseEntity<StorageMonitorEntityInfo> {
  public readonly entityType = EntityType.StorageMonitor;

  protected ENTITY_IMAGE_URL = 'https://raw.githubusercontent.com/christiangrothaus/rustplusplus/main/src/assets/images/storage-monitor.png';

  constructor(entityInfo: StorageMonitorEntityInfo) {
    super(entityInfo);
  }

  createMessageEmbed(entityInfo: StorageMonitorEntityInfo): EmbedBuilder {
    const { name, entityId, items } = entityInfo;

    let fields: Array<APIEmbedField> = [];
    if (items) {
      fields = Array.from(items).map(([itemId, itemCount]) => this.createField(itemId, itemCount));
      fields.slice(0, 25);
    }

    const embedBuilder = new EmbedBuilder()
      .setColor(0x2255ff)
      .addFields(fields)
      .setTitle(name)
      .setFooter({ text: entityId })
      .setTimestamp()
      .setThumbnail(this.ENTITY_IMAGE_URL);

    return embedBuilder;
  }

  createMessageButtons(entityInfo: StorageMonitorEntityInfo): ActionRowBuilder<ButtonBuilder> {
    const { entityId } = entityInfo;

    const editButton = new ButtonBuilder()
      .setCustomId(entityId + '-edit')
      .setLabel('Edit')
      .setStyle(ButtonStyle.Primary);

    const deleteButton = new ButtonBuilder()
      .setCustomId(entityId + '-delete')
      .setLabel('Delete')
      .setStyle(ButtonStyle.Secondary);

    return new ActionRowBuilder<ButtonBuilder>().setComponents(editButton, deleteButton);
  }

  toJSON(): Partial<StorageMonitorEntityInfo> {
    const json = { name: this.entityInfo.name, entityId: this.entityInfo.entityId, entityType: this.entityType };
    return json;
  }

  private createField(itemId: string, itemCount: number): APIEmbedField {
    const field: APIEmbedField = {
      name: RUST_ITEMS?.[itemId]?.displayName || 'Unknown Item',
      value: `${itemCount}`,
      inline: true
    };

    return field;
  }
}