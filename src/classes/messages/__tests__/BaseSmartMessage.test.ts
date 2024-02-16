import { EmbedBuilder, ActionRowBuilder, ButtonBuilder } from 'discord.js';
import BaseSmartMessage from '../BaseSmartMessage';
import SmartAlarmEntityInfo from '../../entityInfo/SmartAlarmEntityInfo';
import { EntityType } from '../../../models/RustPlus.models';

class DummySmartMessage extends BaseSmartMessage<SmartAlarmEntityInfo> {
  public entityType: EntityType;
  protected ENTITY_IMAGE_URL: string;

  //eslint-disable-next-line
  createMessageEmbed(entityInfo: SmartAlarmEntityInfo): EmbedBuilder {
    return new EmbedBuilder();
  }

  //eslint-disable-next-line
  createMessageButtons(entityInfo: SmartAlarmEntityInfo): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>();
  }
}

describe('BaseSmartMessage', () => {
  describe('ctor', () => {
    it('should create a new instance of BaseSmartMessage', () => {
      const entityInfo = {
        name: 'name',
        entityId: 'id',
        isActive: true
      };
      const baseSmartMessage = new DummySmartMessage(entityInfo);

      expect(baseSmartMessage.entityInfo).toEqual(entityInfo);
      expect(baseSmartMessage.embeds).toHaveLength(1);
      expect(baseSmartMessage.components).toHaveLength(1);
    });
  });

  describe('updateMessage', () => {
    it('should update the entityInfo and components', () => {
      const entityInfo = {
        name: 'name',
        entityId: 'id',
        isActive: true
      };
      const baseSmartMessage = new DummySmartMessage(entityInfo);

      const updatedEntityInfo = {
        name: 'new name'
      };
      baseSmartMessage.update(updatedEntityInfo);

      expect(baseSmartMessage.entityInfo).toEqual({
        ...entityInfo,
        ...updatedEntityInfo
      });
      expect(baseSmartMessage.embeds).toHaveLength(1);
      expect(baseSmartMessage.components).toHaveLength(1);
    });
  });

  describe('toJSON', () => {
    it('should return the entityInfo and messageId', () => {
      const entityInfo = {
        name: 'name',
        entityId: 'id',
        isActive: true
      };
      const baseSmartMessage = new DummySmartMessage(entityInfo);

      expect(baseSmartMessage.toJSON()).toEqual({
        entityInfo,
        messageId: baseSmartMessage.messageId
      });
    });
  });
});