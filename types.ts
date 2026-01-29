
export type MessageRole = 'user' | 'model';

export interface ChatMessage {
  role: MessageRole;
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface UniversityResource {
  title: string;
  description: string;
  category: 'academic' | 'admin' | 'campus';
}

export enum AppView {
  CHAT = 'chat',
  VOICE = 'voice',
  RESOURCES = 'resources',
  ANALYTICS = 'analytics'
}
