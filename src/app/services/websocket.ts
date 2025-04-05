export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageQueue: any[] = [];
  private isConnecting = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Delay the initial connection attempt to ensure the server is ready
      setTimeout(() => this.connect(), 1000);
    }
  }

  private async connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;

    try {
      // Close existing connection if any
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/websocket`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.flushMessageQueue();
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.ws = null;
        this.attemptReconnect();
      };

      this.ws.onerror = () => {
        // Don't log the error object as it's not useful in the browser
        console.log('WebSocket connection failed');
        this.isConnecting = false;
        this.ws = null;
        this.attemptReconnect();
      };

      this.ws.onmessage = (event) => {
        if (event.data) {
          try {
            const data = JSON.parse(event.data);
            window.dispatchEvent(new CustomEvent('websocket-message', { detail: data }));
          } catch (error) {
            // Ignore parsing errors for empty or invalid messages
            console.log('Invalid WebSocket message received');
          }
        }
      };
    } catch (error) {
      console.log('Failed to create WebSocket connection');
      this.isConnecting = false;
      this.ws = null;
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && !this.isConnecting) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    }
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  public send(data: any) {
    try {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(data));
      } else {
        this.messageQueue.push(data);
        this.connect();
      }
    } catch (error) {
      console.log('Failed to send WebSocket message');
      this.messageQueue.push(data);
    }
  }

  public close() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageQueue = [];
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }
}

export const websocketService = typeof window !== 'undefined' ? new WebSocketService() : null; 