import { EmbedBuilder, ActionRowBuilder, ButtonBuilder } from 'discord.js';
import BaseEntity from '../BaseEntity';
import AlarmEntityInfo from '../../entityInfo/AlarmEntityInfo';
import { EntityType } from '../../../models/RustPlus.models';

class DummySmartMessage extends BaseEntity<AlarmEntityInfo> {
  public entityType: EntityType;
  protected ENTITY_IMAGE_URL: string;

  //eslint-disable-next-line
  createMessageEmbed(entityInfo: AlarmEntityInfo): EmbedBuilder {
    return new EmbedBuilder();
  }

  //eslint-disable-next-line
  createMessageButtons(entityInfo: AlarmEntityInfo): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>();
  }
}

describe('BaseSmartMessage', () => {
  describe('ctor', () => {
    it('should create a new instance of BaseSmartMessage', () => {
      const entityInfo = new AlarmEntityInfo('name', 'id');
      const baseSmartMessage = new DummySmartMessage(entityInfo);

      expect(baseSmartMessage.entityInfo).toEqual(entityInfo);
      expect(baseSmartMessage.embeds).toHaveLength(1);
      expect(baseSmartMessage.components).toHaveLength(1);
    });
  });

  describe('toJSON', () => {
    it('should return the entityInfo and messageId', () => {
      const entityInfo = new AlarmEntityInfo('name', 'id');
      const baseSmartMessage = new DummySmartMessage(entityInfo);

      expect(baseSmartMessage.toJSON()).toEqual(entityInfo);
    });
  });
});