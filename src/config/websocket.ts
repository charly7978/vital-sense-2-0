
interface WebSocketConfig {
  url: string;
  options: {
    reconnectAttempts: number;
    reconnectInterval: number;
    timeout: number;
  };
}

export const websocketConfig: WebSocketConfig = {
  url: process.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080',
  options: {
    reconnectAttempts: 5,
    reconnectInterval: 3000,
    timeout: 5000
  }
};
