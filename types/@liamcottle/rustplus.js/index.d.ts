declare module '@liamcottle/rustplus.js' {
  export default class RustPlus extends (await import('events')).EventEmitter {
    /**
     * @param server The ip address or hostname of the Rust Server
     * @param port The port of the Rust Server (app.port in server.cfg)
     * @param playerId SteamId of the Player
     * @param playerToken Player Token from Server Pairing
     * @param useFacepunchProxy True to use secure websocket via Facepunch's proxy, or false to directly connect to Rust Server
     *
     * Events emitted by the RustPlus class instance
     * - connecting: When we are connecting to the Rust Server.
     * - connected: When we are connected to the Rust Server.
     * - message: When an AppMessage has been received from the Rust Server.
     * - request: When an AppRequest has been sent to the Rust Server.
     * - disconnected: When we are disconnected from the Rust Server.
     * - error: When something goes wrong.
     */
    constructor(server: string, port: number, playerId: string, playerToken: string, useFacepunchProxy?: boolean);
    /**
     * This sets everything up and then connects to the Rust Server via WebSocket.
     */
    connect: () => void;
    /**
     * Disconnect from the Rust Server.
     */
    disconnect: () => void;
    /**
     * Check if RustPlus is connected to the server.
     * @returns {boolean}
     */
    isConnected: () => boolean;
    /**
     * Send a Request to the Rust Server with an optional callback when a Response is received.
     * @param data this should contain valid data for the AppRequest packet in the rustplus.proto schema file
     * @param callback
     */
    sendRequest: (data: string, callback: (data: any) => void) => void;
    /**
     * Send a Request to the Rust Server and return a Promise
     * @param data this should contain valid data for the AppRequest packet defined in the rustplus.proto schema file
     * @param timeoutMilliseconds milliseconds before the promise will be rejected. Defaults to 10 seconds.
     */
    sendRequestAsync: (data: string, timeoutMilliseconds?: number) => Promise<any>;
    /**
     * Send a Request to the Rust Server to set the Entity Value.
     * @param entityId the entity id to set the value for
     * @param value the value to set on the entity
     * @param callback
     */
    setEntityValue: (entityId: string, value: any, callback: (data: any) => void) => void;
    /**
     * Turn a Smart Switch On
     * @param entityId the entity id of the smart switch to turn on
     * @param callback
     */
    turnSmartSwitchOn: (entityId: string, callback: (data: any) => void) => void;
    /**
     * Turn a Smart Switch Off
     * @param entityId the entity id of the smart switch to turn off
     * @param callback
     */
    turnSmartSwitchOff: (entityId: string, callback: (data: any) => void) => void;
    /**
     * Quickly turn on and off a Smart Switch as if it were a Strobe Light.
     * You will get rate limited by the Rust Server after a short period.
     * It was interesting to watch in game though 😝
     * @param entityId the entity id to set the value for
     * @param timeoutMilliseconds milliseconds to wait to wait between loops. Defaults to 0.1 seconds.
     * @param value the value to set on the entity
     */
    strobe: (entityId: string, timeoutMilliseconds?: number, value?: boolean) => void;
    /**
     * Send a message to Team Chat
     * @param message the message to send to team chat
     * @param callback
     */
    sendTeamMessage: (message: string, callback: (data: any) => void) => void;
    /**
     * Get info for an Entity
     * @param entityId the id of the entity to get info of
     * @param callback
     */
    getEntityInfo: (entityId: string, callback: (data: any) => void) => void;
    /**
     * Get the Map
     * @param callback
     */
    getMap: (callback: (data: any) => void) => void;
    /**
     * Get the ingame time
     * @param callback
    */
    getTime: (callback: (data: any) => void) => void;
    /**
     * Get all map markers
     * @param callback
     */
    getMapMarkers: (callback : (data: any) => void) => void;
    /**
     * Get the server info
     * @param callback
     */
    getInfo: (callback: (data: any) => void) => void;
    /**
     * Get team info
     * @param callback
     */
    getTeamInfo: (callback: (data: any) => void) => void;
    /**
     * Subscribes to a Camera
     * @param identifier Camera Identifier, such as OILRIG1 (or custom name)
     * @param callback
     */
    subscribeToCamera: (identifier: string, callback: (data: any) => void) => void;
    /**
     * Unsubscribes from a Camera
     * @param callback
     */
    unsubscribeFromCamera: (callback: (data: any) => void) => void;
    /**
     * Sends camera input to the server (mouse movement)
     * @param buttons The buttons that are currently pressed
     * @param x The x delta of the mouse movement
     * @param y The y delta of the mouse movement
     * @param callback
     */
    sendCameraInput: (buttons: any, x: number, y:number , callback: (data: any) => void) => void;
    /**
     * Get a camera instance for controlling CCTV Cameras, PTZ Cameras and  Auto Turrets
     * @param identifier Camera Identifier, such as DOME1, OILRIG1L1, (or a custom camera id)
     * @returns {Camera}
     */
    getCamera(identifier: string): Camera;
  }
  export class Camera extends (await import('events')).EventEmitter {
    /**
     * These represent the possible buttons that can be sent to the server.
     */
    static Buttons: {
      NONE: 0,
      FORWARD: 2,
      BACKWARD: 4,
      LEFT: 8,
      RIGHT: 16,
      JUMP: 32,
      DUCK: 64,
      SPRINT: 128,
      USE: 256,
      FIRE_PRIMARY: 1024,
      FIRE_SECONDARY: 2048,
      RELOAD: 8192,
      FIRE_THIRD: 134217728
    };
    /**
     * These represent the possible control flags that can be sent to the server.
     * For example, Static CCTV cameras will not support movement.
     */
    static ControlFlags: {
      NONE: 0,
      MOVEMENT: 1,
      MOUSE: 2,
      SPRINT_AND_DUCK: 4,
      FIRE: 8,
      RELOAD: 16,
      CROSSHAIR: 32,
    };
    /**
     * @param rustplus An existing RustPlus instance
     * @param identifier Camera Identifier, such as OILRIG1 (or custom name)
     *
     * Events emitted by the Camera class instance
     * - subscribing: When we are subscribing to the Camera.
     * - subscribed: When we are subscribed to the Camera.
     * - unsubscribing: When we are unsubscribing from the Camera.
     * - unsubscribed: When we are unsubscribed from the Camera.
     * - render: When a camera frame has been rendered. A png image buffer will be provided.
     */
    constructor(rustplus: RustPlus, identifier: string);
  }
}