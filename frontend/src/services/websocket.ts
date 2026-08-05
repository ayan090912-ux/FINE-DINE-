type EventCallback = (event: { event_type: string; restaurant_id: string; data: any }) => void;

class RealtimeWebSocketClient {
  private socket: WebSocket | null = null;
  private listeners: Set<EventCallback> = new Set();
  private restaurantId: string = 'dineflow';
  private reconnectTimer: number | null = null;
  private isExplicitlyClosed: boolean = false;

  public connect(restaurantId: string = 'dineflow') {
    this.restaurantId = restaurantId;
    this.isExplicitlyClosed = false;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
    let wsUrl = apiBase.replace(/^http/, 'ws').replace(/\/$/, '');
    wsUrl = `${wsUrl}/api/v1/ws/restaurant/${encodeURIComponent(this.restaurantId)}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log(`[DineFlow WS] Connected to restaurant room: ${this.restaurantId}`);
        if (this.reconnectTimer) {
          window.clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'pong') return;
          this.listeners.forEach((cb) => cb(payload));
        } catch (e) {
          // Ignore non-json frames
        }
      };

      this.socket.onclose = () => {
        if (!this.isExplicitlyClosed) {
          console.warn('[DineFlow WS] Disconnected. Reconnecting in 3s...');
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (err) => {
        console.error('[DineFlow WS] Socket error:', err);
      };
    } catch (err) {
      console.error('[DineFlow WS] Connection failed:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(this.restaurantId);
    }, 3000);
  }

  public subscribe(callback: EventCallback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const realtimeWs = new RealtimeWebSocketClient();
