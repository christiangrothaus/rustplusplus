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
});