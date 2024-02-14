import { EmbedBuilder, ActionRowBuilder, ButtonBuilder } from 'discord.js';
import BaseSmartMessage, { SmartAlarmInfo } from '../BaseSmartMessage';

class DummySmartMessage extends BaseSmartMessage<SmartAlarmInfo> {
  protected ENTITY_IMAGE_URL: string;

  //eslint-disable-next-line
  createMessageEmbed(entityInfo: SmartAlarmInfo): EmbedBuilder {
    return new EmbedBuilder();
  }

  //eslint-disable-next-line
  createMessageButtons(entityInfo: SmartAlarmInfo): ActionRowBuilder<ButtonBuilder> {
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
      baseSmartMessage.updateMessage(updatedEntityInfo);

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