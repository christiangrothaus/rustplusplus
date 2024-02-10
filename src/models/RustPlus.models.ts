
export type EntityType = 'Switch' | 'Alarm' | 'StorageMonitor'

export type TeamInfoMember = {
  steamId: string,
  name: string,
  x: string,
  y: string,
  isOnline: boolean,
  spawnTime: string,
  isAlive: boolean,
  deathTime: string
}

export type TeamInfoNote = {
  type: string,
  x: string,
  y: string
}

export type TeamInfo = {
  leaderSteamId: string,
  members: Array<TeamInfoMember>,
  mapNotes: Array<TeamInfoNote>,
  leaderMapNotes: Array<TeamInfoNote>
}

export type TeamChanged = {
  playerId: string,
  teamInfo: TeamInfo
}

export type NewTeamMessage = {
  message: TeamMessage
}

export type TeamMessage = {
  steamId: string,
  name: string,
  message: string,
  color: string,
  time: string
}

export type EntityChanged = {
  entityId: string,
  payload: EntityPayload,
}

export type EntityPayloadItem = {
  itemId: string,
  quantity: string,
  itemIsBlueprint: boolean
}

export type EntityPayload = {
  value?: boolean,
  items: Array<EntityPayloadItem>,
  capacity?: string,
  hasProtection?: boolean,
  protectionExpiry?: string
}

export type ClanInfoRole = {
  roleId: string,
  rank: string,
  name: string,
  canSetMotd: boolean,
  canSetLogo: boolean,
  canInvite: boolean,
  canKick: boolean,
  canPromote: boolean,
  canDemote: boolean,
  canSetPlayerNotes: boolean,
  canAccessLogs: boolean
}

export type ClanInfoMember = {
  steamId: string,
  roleId: string,
  joined: string,
  lastSeen: string,
  notes?: string,
  online?: boolean
}

export type ClanInfoInvite = {
  steamId: string,
  recruiter: string,
  timestamp: string
}

export type ClanInfo = {
  clanId: string,
  name: string,
  created: string,
  creator: string,
  motd?: string,
  motdTimestamp?: string,
  motdAuthor?: string,
  logo?: string,
  color?: string,
  roles: Array<ClanInfoRole>,
  members: Array<ClanInfoMember>,
  invites: Array<ClanInfoInvite>,
  maxMemberCount?: string
}

export type ClanMessage = {
  steamId: string,
  name: string,
  message: string,
  time: string
}

export type NewClanMessage = {
  clanId: string,
  message: ClanMessage,
}

export type ClanChanged = {
  clanInfo?: ClanInfo
};

export type CameraRaysEntityType = {
  EntityType: 'Tree' | 'Player'
}

export type Vector3 = {
  x?: string,
  y?: string,
  z?: string
}

export type Vector4 = {
  x?: string,
  y?: string,
  z?: string,
  w?: string
}

export type AppCameraRaysEntity = {
  entityId: string,
  type: CameraRaysEntityType,
  position: Vector3,
  rotation: Vector3,
  size: Vector3,
  name?: string
}

export type CameraRays = {
  verticalFov: string,
  sampleOffset: string,
  rayData: string,
  distance: string,
  entities: Array<AppCameraRaysEntity>
}

export type Broadcast = {
  teamChanged?: TeamChanged,
  teamMessage?: NewTeamMessage,
  entityChanged?: EntityChanged,
  clanChanged?: ClanChanged,
  clanMessage?: NewClanMessage,
  cameraRays?: CameraRays
}

export type AppError = {
  error: string
}

export type Flag = {
  value: boolean
}

export type Success = { [key: string]: never }

export type Empty = { [key: string]: never }

export type SendMessage = {
  message: string
}

export type SetEntityValue = {
  value: boolean
}

export type PromoteToLeader = {
  steamId: string
}

export type GetNexusAuth = {
  appKey: string
}

export type Info = {
  name: string,
  headerImage: string,
  url: string,
  map: string,
  mapSize: string,
  wipeTime: string,
  players: string,
  maxPlayers: string,
  queuedPlayers: string,
  seed?: string,
  salt?: string,
  logoImage?: string,
  nexus?: string,
  nexusId?: string,
  nexusZone?: string
}

export type Time = {
  dayLengthMinutes: string,
  timeScale: string,
  sunrise: string,
  sunset: string,
  time: string
}

export type TeamChat = {
  messages: Array<TeamMessage>
}

export type EntityInfo = {
  type: EntityType
  payload: EntityPayload
}

export type MapMarkers = {
  markers: Array<Marker>
}

export type MarkerSellOrder = {
  itemId: string,
  quantity: string,
  currencyId: string,
  costPerItem: string,
  amountInStock: string,
  itemIsBlueprint: boolean,
  currencyIsBlueprint: boolean,
  itemCondition?: string,
  itemConditionMax?: string
}

export type MarkerType = 'Undefined' | 'Player' | 'Explosion' | 'VendingMachine' | 'CH47' | 'CargoShip' | 'Crate' | 'GenericRadius' | 'PatrolHelicopter'

export type Marker = {
  id: string,
  type: MarkerType,
  x: string,
  y: string,
  steamId?: string,
  rotation?: string,
  radius?: string,
  color1?: Vector4,
  color2?: Vector4,
  alpha?: string,
  name?: string,
  outOfStock?: boolean,
  sellOrders: Array<MarkerSellOrder>
}

export type ClanChat = {
  messages: Array<ClanMessage>
}

export type AppMapMonument = {
  token: string,
  x: string,
  y: string
}

export type AppMap = {
  width: string,
  height: string,
  jpgImage: string,
  oceanMargin: string,
  monuments: Array<AppMapMonument>,
  background?: string
}

export type NexusAuth = {
  serverId: string,
  playerToken: string
}

export type CameraInfo = {
  width: string,
  height: string,
  nearPlane: string,
  farPlane: string,
  controlFlags: string
}

export type Response = {
  seq: string,
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
}

export type Message = {
  response?: Response,
  broadcast?: Broadcast,
}