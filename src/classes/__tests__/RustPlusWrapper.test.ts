import { EntityInfo, EntityType, Message } from '../../models/RustPlus.models';
import RustPlusWrapper, { RustPlusEvents } from '../RustPlusWrapper';
import RustPlus from '@liamcottle/rustplus.js';

describe('RustPlusWrapper', () => {
  let wrapper: RustPlusWrapper;

  afterEach(() => {
    wrapper.disconnect();
  });

  describe('ctor', () => {
    it('should set serverHost, serverPort, and rustToken', () => {
      wrapper = new RustPlusWrapper('localhost', 'token', 1234);

      expect(wrapper.serverHost).toBe('localhost');
      expect(wrapper.serverPort).toBe(1234);
      expect(wrapper.rustToken).toBe('token');
    });

    it('should use the default port if one is not provided', () => {
      wrapper = new RustPlusWrapper('localhost', 'token');

      expect(wrapper.serverPort).toBe(28082);
    });
  });

  describe('connect', () => {
    it('should create a new RustPlus client and connect', () => {
      const rustPlusConnectSpy = jest.spyOn(RustPlus.prototype, 'connect').mockImplementation(() => {});
      wrapper = new RustPlusWrapper('localhost', 'token');

      wrapper.connect();

      expect(rustPlusConnectSpy).toHaveBeenCalled();
    });
  });

  describe('getEntityInfo', () => {
    it('should throw an error if the client is not connected', async () => {
      wrapper = new RustPlusWrapper('localhost', 'token');

      await expect(wrapper.getEntityInfo('entityId')).rejects.toThrow('Failed to get entity info. Client not connected.');
    });

    it('should return the entity info', async () => {
      wrapper = new RustPlusWrapper('localhost', 'token');
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
      wrapper = new RustPlusWrapper('localhost', 'token');

      await expect(wrapper.toggleSmartSwitch('entityId', true)).rejects.toThrow('Failed to toggle smart switch. Client not connected.');
    });

    describe('on', () => {
      it('should resolve with the message if the request is successful', async () => {
        wrapper = new RustPlusWrapper('localhost', 'token');
        const expectedMessage = { response: { entityInfo: { payload: { items: [] }, type: EntityType.Switch } } };
        jest.spyOn(RustPlus.prototype, 'connect').mockImplementation(() => {});
        jest.spyOn(RustPlus.prototype, 'turnSmartSwitchOn').mockImplementation((entId: string, callback) => {
          callback(expectedMessage);
        });

        wrapper.connect();

        await expect(wrapper.toggleSmartSwitch('entityId', true)).resolves.toBe(expectedMessage);
      });

      it('should reject with the message if the request is unsuccessful', async () => {
        wrapper = new RustPlusWrapper('localhost', 'token');
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
        wrapper = new RustPlusWrapper('localhost', 'token');
        const expectedMessage = { response: { entityInfo: { payload: { items: [] }, type: EntityType.Switch } } };
        jest.spyOn(RustPlus.prototype, 'connect').mockImplementation(() => {});
        jest.spyOn(RustPlus.prototype, 'turnSmartSwitchOff').mockImplementation((entId: string, callback) => {
          callback(expectedMessage);
        });

        wrapper.connect();

        await expect(wrapper.toggleSmartSwitch('entityId', false)).resolves.toBe(expectedMessage);
      });

      it('should reject with the message if the request is unsuccessful', async () => {
        wrapper = new RustPlusWrapper('localhost', 'token');
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

  describe('hasClient', () => {
    it('should return true if the client is connected', () => {
      wrapper = new RustPlusWrapper('localhost', 'token');

      wrapper.connect();

      expect(wrapper.hasClient()).toBe(true);
    });

    it('should return false if the client is not connected', () => {
      wrapper = new RustPlusWrapper('localhost', 'token');

      expect(wrapper.hasClient()).toBe(false);
    });
  });

  describe('registerListeners', () => {
    it('should register a connected listener', () => {
      wrapper = new RustPlusWrapper('localhost', 'token');
      const onSpy = jest.spyOn(RustPlus.prototype, 'on');
      wrapper.connect();

      wrapper['registerListeners']();

      expect(onSpy).toHaveBeenCalledWith('connected', expect.any(Function));
    });

    it('should register a message listener', () => {
      wrapper = new RustPlusWrapper('localhost', 'token');
      const onSpy = jest.spyOn(RustPlus.prototype, 'on');
      wrapper.connect();

      wrapper['registerListeners']();

      expect(onSpy).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should emit a connected event when the client connects', () => {
      wrapper = new RustPlusWrapper('localhost', 'token');
      const emitSpy = jest.spyOn(wrapper, 'emit');
      wrapper.connect();

      wrapper['registerListeners']();
      wrapper['client'].emit('connected');

      expect(emitSpy).toHaveBeenCalledWith(RustPlusEvents.Connected);
    });
  });

  describe('getErrorMessage', () => {
    it('should return the error message if one exists', () => {
      wrapper = new RustPlusWrapper('localhost', 'token');
      const message = { response: { error: { error: 'Error message' } } } as Message;

      const error = wrapper['getErrorMessage'](message);

      expect(error).toBe('Error message');
    });

    it('should format the error message when it is not_found', () => {
      wrapper = new RustPlusWrapper('localhost', 'token');
      const message = { response: { error: { error: 'not_found' } } } as Message;
      const expectedError = 'Entity not found';

      const error = wrapper['getErrorMessage'](message);

      expect(error).toBe(expectedError);
    });
  });
});