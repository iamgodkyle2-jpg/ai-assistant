export enum AppMode {
  DASHBOARD = 'DASHBOARD',
  LIVE_VOICE = 'LIVE_VOICE',
  CHAT_COMMAND = 'CHAT_COMMAND',
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  sources?: Array<{ title?: string; uri: string }>;
  isThinking?: boolean;
}

export interface SystemStatus {
  cpu: number;
  memory: number;
  network: 'ONLINE' | 'OFFLINE';
  activeModel: string;
}
