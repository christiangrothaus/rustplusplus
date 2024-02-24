import { EntityInfo, EntityType, Message } from '../../models/RustPlus.models';
import RustPlusWrapper from '../RustPlusWrapper';
import RustPlus from '@liamcottle/rustplus.js';

describe('RustPlusWrapper', () => {
  describe('ctor', () => {
    it('should set serverHost, serverPort, and rustToken', () => {
      const wrapper = new RustPlusWrapper('localhost', 'token', 1234);

      expect(wrapper.serverHost).toBe('localhost');
      expect(wrapper.serverPort).toBe(1234);
      expect(wrapper.rustToken).toBe('token');
    });

    it('should use the default port if one is not provided', () => {
      const wrapper = new RustPlusWrapper('localhost', 'token');

      expect(wrapper.serverPort).toBe(28082);
    });
  });

  describe('connect', () => {
    it('should create a new RustPlus client and connect', () => {
      const rustPlusConnectSpy = jest.spyOn(RustPlus.prototype, 'connect').mockImplementation(() => {});
      const wrapper = new RustPlusWrapper('localhost', 'token');

      wrapper.connect();

      expect(rustPlusConnectSpy).toHaveBeenCalled();
    });
  });

  describe('getEntityInfo', () => {
    it('should throw an error if the client is not connected', async () => {
      const wrapper = new RustPlusWrapper('localhost', 'token');

      await expect(wrapper.getEntityInfo('entityId')).rejects.toThrow('Failed to get entity info. Client not connected.');
    });

    it('should return the entity info', async () => {
      const wrapper = new RustPlusWrapper('localhost', 'token');
      const expectedEntityInfo: EntityInfo ={ payload: { items: [] }, type: EntityType.Switch };
      jest.spyOn(RustPlus.prototype, 'connect').mockImplementation(() => {});
      jest.spyOn(RustPlus.prototype, 'getEntityInfo').mockImplementation((entId: string, callback) => {
        callback({ response: { entityInfo: expectedEntityInfo } });
      });

      wrapper.connect();
      const entityInfo = await wrapper.getEntityInfo('entityId');

      expect(entityInfo).toBe(expectedEntityInfo);
    });
  });

  describe('toggleSmartSwitch', () => {
    it('should throw an error if the client is not connected', async () => {
      const wrapper = new RustPlusWrapper('localhost', 'token');

      await expect(wrapper.toggleSmartSwitch('entityId', true)).rejects.toThrow('Failed to toggle smart switch. Client not connected.');
    });

    it('should reject with an error if the request times out', async () => {
      const wrapper = new RustPlusWrapper('localhost', 'token');
      jest.spyOn(RustPlus.prototype, 'connect').mockImplementation(() => {});
      jest.spyOn(RustPlus.prototype, 'turnSmartSwitchOn').mockImplementation(() => {});

      wrapper.connect();

      await expect(wrapper.toggleSmartSwitch('entityId', true)).rejects.toBe('Request timed out');
    });

    describe('on', () => {
      it('should resolve with the message if the request is successful', async () => {
        const wrapper = new RustPlusWrapper('localhost', 'token');
        const expectedMessage = { response: { entityInfo: { payload: { items: [] }, type: EntityType.Switch } } };
        jest.spyOn(RustPlus.prototype, 'connect').mockImplementation(() => {});
        jest.spyOn(RustPlus.prototype, 'turnSmartSwitchOn').mockImplementation((entId: string, callback) => {
          callback(expectedMessage);
        });

        wrapper.connect();

        await expect(wrapper.toggleSmartSwitch('entityId', true)).resolves.toBe(expectedMessage);
      });

      it('should reject with the message if the request is unsuccessful', async () => {
        const wrapper = new RustPlusWrapper('localhost', 'token');
        const expectedMessage = { response: { error: { error: 'Error message' } } };
        jest.spyOn(RustPlus.prototype, 'connect').mockImplementation(() => {});
        jest.spyOn(RustPlus.prototype, 'turnSmartSwitchOn').mockImplementation((entId: string, callback) => {
          callback(expectedMessage);
        });

        wrapper.connect();

        await expect(wrapper.toggleSmartSwitch('entityId', true)).rejects.toBe('Error message');
      });
    });

    describe('off', () => {
      it('should resolve with the message if the request is successful', async () => {
        const wrapper = new RustPlusWrapper('localhost', 'token');
        const expectedMessage = { response: { entityInfo: { payload: { items: [] }, type: EntityType.Switch } } };
        jest.spyOn(RustPlus.prototype, 'connect').mockImplementation(() => {});
        jest.spyOn(RustPlus.prototype, 'turnSmartSwitchOff').mockImplementation((entId: string, callback) => {
          callback(expectedMessage);
        });

        wrapper.connect();

        await expect(wrapper.toggleSmartSwitch('entityId', false)).resolves.toBe(expectedMessage);
      });

      it('should reject with the message if the request is unsuccessful', async () => {
        const wrapper = new RustPlusWrapper('localhost', 'token');
        const expectedMessage = { response: { error: { error: 'Error message' } } };
        jest.spyOn(RustPlus.prototype, 'connect').mockImplementation(() => {});
        jest.spyOn(RustPlus.prototype, 'turnSmartSwitchOff').mockImplementation((entId: string, callback) => {
          callback(expectedMessage);
        });

        wrapper.connect();

        await expect(wrapper.toggleSmartSwitch('entityId', false)).rejects.toBe('Error message');
      });
    });
  });

  describe('onEntityChange', () => {
    it('should add the callback to the entityChangeCallbacks array', () => {
      const wrapper = new RustPlusWrapper('localhost', 'token');
      const callback = jest.fn();

      wrapper.onEntityChange(callback);

      expect(wrapper['entityChangeCallbacks']).toContain(callback);
    });
  });

  describe('onConnected', () => {
    it('should add the callback to the connectedCallbacks array', () => {
      const wrapper = new RustPlusWrapper('localhost', 'token');
      const callback = jest.fn();

      wrapper.onConnected(callback);

      expect(wrapper['connectedCallbacks']).toContain(callback);
    });
  });

  describe('hasClient', () => {
    it('should return true if the client is connected', () => {
      const wrapper = new RustPlusWrapper('localhost', 'token');

      wrapper.connect();

      expect(wrapper.hasClient()).toBe(true);
    });

    it('should return false if the client is not connected', () => {
      const wrapper = new RustPlusWrapper('localhost', 'token');

      expect(wrapper.hasClient()).toBe(false);
    });
  });

  describe('registerListeners', () => {
    it('should register a connected listener', () => {
      const wrapper = new RustPlusWrapper('localhost', 'token');
      const onSpy = jest.spyOn(RustPlus.prototype, 'on').mockImplementation(() => {});
      wrapper.connect();

      wrapper['registerListeners']();

      expect(onSpy).toHaveBeenCalledWith('connected', wrapper['callConnectedCallbacks']);
    });

    it('should register a message listener', () => {
      const wrapper = new RustPlusWrapper('localhost', 'token');
      const onSpy = jest.spyOn(RustPlus.prototype, 'on').mockImplementation(() => {});
      wrapper.connect();

      wrapper['registerListeners']();

      expect(onSpy).toHaveBeenCalledWith('message', wrapper['callEntityChangeCallbacks']);
    });
  });

  describe('callConnectedCallbacks', () => {
    it('should call all connectedCallbacks', () => {
      const wrapper = new RustPlusWrapper('localhost', 'token');
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      wrapper.onConnected(callback1);
      wrapper.onConnected(callback2);

      wrapper['callConnectedCallbacks']();

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('callEntityChangeCallbacks', () => {
    it('should call all entityChangeCallbacks', () => {
      const wrapper = new RustPlusWrapper('localhost', 'token');
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      wrapper.onEntityChange(callback1);
      wrapper.onEntityChange(callback2);
      const message = { broadcast: { entityChanged: {} } } as Message;

      wrapper['callEntityChangeCallbacks'](message);

      expect(callback1).toHaveBeenCalledWith({});
      expect(callback2).toHaveBeenCalledWith({});
    });
  });

  describe('getErrorMessage', () => {
    it('should return the error message if one exists', () => {
      const wrapper = new RustPlusWrapper('localhost', 'token');
      const message = { response: { error: { error: 'Error message' } } } as Message;

      const error = wrapper['getErrorMessage'](message);

      expect(error).toBe('Error message');
    });

    it('should format the error message when it is not_found', () => {
      const wrapper = new RustPlusWrapper('localhost', 'token');
      const message = { response: { error: { error: 'not_found' } } } as Message;
      const expectedError = 'Entity not found';

      const error = wrapper['getErrorMessage'](message);

      expect(error).toBe(expectedError);
    });
  });
});