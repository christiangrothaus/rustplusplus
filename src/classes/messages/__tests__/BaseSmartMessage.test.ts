import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, TextChannel, Message } from 'discord.js';
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
  const mockChannel = { id: '1' } as TextChannel;
  const mockMessage = { id: '2' } as Message;

  describe('ctor', () => {
    it('should create a new instance of BaseSmartMessage', () => {
      const entityInfo = new SmartAlarmEntityInfo('name', 'id');
      const baseSmartMessage = new DummySmartMessage(mockChannel, entityInfo);

      expect(baseSmartMessage.entityInfo).toEqual(entityInfo);
      expect(baseSmartMessage.embeds).toHaveLength(1);
      expect(baseSmartMessage.components).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update the entityInfo and components if the message has been sent', () => {
      const entityInfo = new SmartAlarmEntityInfo('name', 'id');
      const baseSmartMessage = new DummySmartMessage(mockChannel, entityInfo);
      baseSmartMessage['message'] = {
        edit: (async (content: string) => {return { content: content } as Message<boolean>;})
      } as Message;

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

    it('should throw an error if the message has not been sent yet', () => {
      const entityInfo = new SmartAlarmEntityInfo('name', 'id');
      const baseSmartMessage = new DummySmartMessage(mockChannel, entityInfo);

      const updatedEntityInfo = {
        name: 'new name'
      };

      expect(async () => {
        await baseSmartMessage.update(updatedEntityInfo);
      }).rejects.toThrow('Message not sent yet');
    });
  });

  describe('toJSON', () => {
    it('should return the entityInfo and messageId', () => {
      const entityInfo = new SmartAlarmEntityInfo('name', 'id');
      const baseSmartMessage = new DummySmartMessage(mockChannel, entityInfo);
      baseSmartMessage.message = mockMessage;

      expect(baseSmartMessage.toJSON()).toEqual({
        entityInfo,
        messageId: baseSmartMessage.message.id
      });
    });
  });
});