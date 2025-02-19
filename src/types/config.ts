
import { SystemConfig } from './vitals';
import { websocketConfig } from '@/config/websocket';

export interface WebSocketConfig {
  websocket: {
    url: string;
    options: {
      reconnectAttempts: number;
      reconnectInterval: number;
      timeout: number;
    };
  };
}

export type AppConfig = SystemConfig & {
  websocket: WebSocketConfig;
};

export { websocketConfig };
