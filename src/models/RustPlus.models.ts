
export enum EntityType {
  Switch = 'Switch',
  Alarm = 'Alarm',
  StorageMonitor = 'Storage Monitor'
}

export type TeamInfoMember = {
  steamId: number,
  name: string,
  x: number,
  y: number,
  isOnline: boolean,
  spawnTime: number,
  isAlive: boolean,
  deathTime: number
};

export type TeamInfoNote = {
  type: number,
  x: number,
  y: number
};

export type TeamInfo = {
  leaderSteamId: number,
  members: Array<TeamInfoMember>,
  mapNotes: Array<TeamInfoNote>,
  leaderMapNotes: Array<TeamInfoNote>
};

export type TeamChanged = {
  playerId: number,
  teamInfo: TeamInfo
};

export type NewTeamMessage = {
  message: TeamMessage
};

export type TeamMessage = {
  steamId: number,
  name: string,
  message: string,
  color: string,
  time: number
};

export type EntityChanged = {
  entityId: number,
  payload: EntityPayload,
};

export type EntityPayloadItem = {
  itemId: number,
  quantity: number,
  itemIsBlueprint: boolean
};

export type EntityPayload = {
  value?: boolean,
  items: Array<EntityPayloadItem>,
  capacity?: number,
  hasProtection?: boolean,
  protectionExpiry?: number
};

export type ClanInfoRole = {
  roleId: number,
  rank: number,
  name: string,
  canSetMotd: boolean,
  canSetLogo: boolean,
  canInvite: boolean,
  canKick: boolean,
  canPromote: boolean,
  canDemote: boolean,
  canSetPlayerNotes: boolean,
  canAccessLogs: boolean
};

export type ClanInfoMember = {
  steamId: number,
  roleId: number,
  joined: number,
  lastSeen: number,
  notes?: string,
  online?: boolean
};

export type ClanInfoInvite = {
  steamId: number,
  recruiter: number,
  timestamp: number
};

export type ClanInfo = {
  clanId: number,
  name: string,
  created: number,
  creator: number,
  motd?: string,
  motdTimestamp?: number,
  motdAuthor?: number,
  logo?: string,
  color?: number,
  roles: Array<ClanInfoRole>,
  members: Array<ClanInfoMember>,
  invites: Array<ClanInfoInvite>,
  maxMemberCount?: number
};

export type ClanMessage = {
  steamId: number,
  name: string,
  message: string,
  time: number
};

export type NewClanMessage = {
  clanId: number,
  message: ClanMessage,
};

export type ClanChanged = {
  clanInfo?: ClanInfo
};

export type CameraRaysEntityType = {
  EntityType: 'Tree' | 'Player'
};

export type Vector3 = {
  x?: number,
  y?: number,
  z?: number
};

export type Vector4 = {
  x?: number,
  y?: number,
  z?: number,
  w?: number
};

export type CameraRaysEntity = {
  entityId: number,
  type: CameraRaysEntityType,
  position: Vector3,
  rotation: Vector3,
  size: Vector3,
  name?: string
};

export type CameraRays = {
  verticalFov: number,
  sampleOffset: number,
  rayData: string,
  distance: number,
  entities: Array<CameraRaysEntity>
};

export type Broadcast = {
  teamChanged?: TeamChanged,
  teamMessage?: NewTeamMessage,
  entityChanged?: EntityChanged,
  clanChanged?: ClanChanged,
  clanMessage?: NewClanMessage,
  cameraRays?: CameraRays
};

export type AppError = {
  error: string
};

export type Flag = {
  value: boolean
};

export type Success = { [key: string]: never };

export type Empty = { [key: string]: never };

export type SendMessage = {
  message: string
};

export type SetEntityValue = {
  value: boolean
};

export type PromoteToLeader = {
  steamId: number
};

export type GetNexusAuth = {
  appKey: string
};

export type Info = {
  name: string,
  headerImage: string,
  url: string,
  map: string,
  mapSize: number,
  wipeTime: number,
  players: number,
  maxPlayers: number,
  queuedPlayers: number,
  seed?: number,
  salt?: number,
  logoImage?: string,
  nexus?: string,
  nexusId?: number,
  nexusZone?: string
};

export type Time = {
  dayLengthMinutes: number,
  timeScale: number,
  sunrise: number,
  sunset: number,
  time: number
};

export type TeamChat = {
  messages: Array<TeamMessage>
};

export type EntityInfo = {
  type: EntityType
  payload: EntityPayload
};

export type MapMarkers = {
  markers: Array<Marker>
};

export type MarkerSellOrder = {
  itemId: number,
  quantity: number,
  currencyId: number,
  costPerItem: number,
  amountInStock: number,
  itemIsBlueprint: boolean,
  currencyIsBlueprint: boolean,
  itemCondition?: number,
  itemConditionMax?: number
};

export type MarkerType = 'Undefined' | 'Player' | 'Explosion' | 'VendingMachine' | 'CH47' | 'CargoShip' | 'Crate' | 'GenericRadius' | 'PatrolHelicopter';

export type Marker = {
  id: number,
  type: MarkerType,
  x: number,
  y: number,
  steamId?: number,
  rotation?: number,
  radius?: number,
  color1?: Vector4,
  color2?: Vector4,
  alpha?: number,
  name?: string,
  outOfStock?: boolean,
  sellOrders: Array<MarkerSellOrder>
};

export type ClanChat = {
  messages: Array<ClanMessage>
};

export type AppMapMonument = {
  token: string,
  x: number,
  y: number
};

export type AppMap = {
  width: number,
  height: number,
  jpgImage: string,
  oceanMargin: number,
  monuments: Array<AppMapMonument>,
  background?: string
};

export type NexusAuth = {
  serverId: string,
  playerToken: number
};

export type CameraInfo = {
  width: number,
  height: number,
  nearPlane: number,
  farPlane: number,
  controlFlags: number
};

export type Response = {
  seq: number,
  success?: Success
  error?: AppError
  info?: Info
  time?: Time
  map?: AppMap
  teamInfo?: TeamInfo
  teamChat?: TeamChat
  entityInfo?: EntityInfo
  flag?: Flag
  mapMarkers?: MapMarkers
  clanInfo?: ClanInfo
  clanChat?: ClanChat
  nexusAuth?: NexusAuth
  cameraSubscribeInfo?: CameraInfo
};

export type Message = {
  response?: Response,
  broadcast?: Broadcast,
};