import { ActionRowBuilder, ButtonBuilder } from 'discord.js';
import SmartSwitch from '../SmartSwitch';

describe('SmartSwitch', () => {
  it('should create a new SmartSwitch', () => {
    const smartSwitch = new SmartSwitch('name', 'entityId');

    expect(smartSwitch).toBeDefined();
  });

  it('should create a new SmartSwitch with isActive', () => {
    const smartSwitch = new SmartSwitch('name', 'entityId', true);

    expect(smartSwitch.isActive).toBe(true);
  });

  describe('toJSON', () => {
    it('should convert a SmartSwitch to JSON', () => {
      const smartSwitch = new SmartSwitch('name', 'entityId', true, 'messageId');
      const expected = { name: 'name', entityId: 'entityId', isActive: true, messageId: 'messageId' };

      expect(smartSwitch.toJSON()).toEqual(expected);
    });
  });

  describe('toEmbedMessage', () => {
    it('should create an message with 1 row', () => {
      const smartSwitch = new SmartSwitch('name', 'entityId');

      expect(smartSwitch.toEmbedMessage().components.length).toBe(1);
    });

    it('should create an message with 4 buttons', () => {
      const smartSwitch = new SmartSwitch('name', 'entityId');

      const row = smartSwitch.toEmbedMessage().components[0] as ActionRowBuilder<ButtonBuilder>;

      expect(row.components.length).toBe(4);
    });

    it('should create an message with the first button labeled "On"', () => {
      const smartSwitch = new SmartSwitch('name', 'entityId');

      const row = smartSwitch.toEmbedMessage().components[0] as ActionRowBuilder<ButtonBuilder>;
      const buttonlabel = row.components[0].data.label;

      expect(buttonlabel).toBe('On');
    });

    it('should create an message with the second button labeled "Off"', () => {
      const smartSwitch = new SmartSwitch('name', 'entityId');

      const row = smartSwitch.toEmbedMessage().components[0] as ActionRowBuilder<ButtonBuilder>;
      const buttonlabel = row.components[1].data.label;

      expect(buttonlabel).toBe('Off');
    });

    it('should create an message with the second button labeled "Name"', () => {
      const smartSwitch = new SmartSwitch('name', 'entityId');

      const row = smartSwitch.toEmbedMessage().components[0] as ActionRowBuilder<ButtonBuilder>;
      const buttonlabel = row.components[2].data.label;

      expect(buttonlabel).toBe('Name');
    });

    it('should create an message with the second button labeled "Refresh"', () => {
      const smartSwitch = new SmartSwitch('name', 'entityId');

      const row = smartSwitch.toEmbedMessage().components[0] as ActionRowBuilder<ButtonBuilder>;
      const buttonlabel = row.components[3].data.label;

      expect(buttonlabel).toBe('Refresh');
    });
  });
});