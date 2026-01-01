export interface Note {
  id: string;
  timestamp: number;
  text: string;
  thumbnail?: string; // Base64 image string of the frame
  aiGenerated?: boolean;
}

export enum PlayerState {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  ENDED = 'ENDED'
}
