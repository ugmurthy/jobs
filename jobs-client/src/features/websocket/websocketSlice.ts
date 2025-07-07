import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface WebSocketEvent {
  type: string;
  payload: any;
  timestamp: string;
}

export interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastMessage: any | null;
  lastEvent: WebSocketEvent | null;
  events: WebSocketEvent[];
  reconnectAttempts: number;
}

const initialState: WebSocketState = {
  connected: false,
  connecting: false,
  error: null,
  lastMessage: null,
  lastEvent: null,
  events: [],
  reconnectAttempts: 0,
};

export const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    connecting: (state: WebSocketState) => {
      state.connecting = true;
      state.error = null;
    },
    connected: (state: WebSocketState, action: PayloadAction<{ id: string | undefined }>) => {
      state.connected = true;
      state.connecting = false;
      state.error = null;
      state.reconnectAttempts = 0;
    },
    disconnected: (state: WebSocketState, action: PayloadAction<{ reason: string }>) => {
      state.connected = false;
      state.connecting = false;
    },
    connectionError: (state: WebSocketState, action: PayloadAction<{ message: string }>) => {
      state.connected = false;
      state.connecting = false;
      state.error = action.payload.message;
      state.reconnectAttempts += 1;
    },
    messageReceived: (state: WebSocketState, action: PayloadAction<any>) => {
      state.lastMessage = action.payload;
    },
    eventReceived: (state: WebSocketState, action: PayloadAction<WebSocketEvent>) => {
      state.lastEvent = action.payload;
      // Add to events array, keeping the most recent 100 events
      state.events = [action.payload, ...state.events].slice(0, 100);
    },
    clearError: (state: WebSocketState) => {
      state.error = null;
    },
    resetReconnectAttempts: (state: WebSocketState) => {
      state.reconnectAttempts = 0;
    },
  },
});

export const {
  connecting,
  connected,
  disconnected,
  connectionError,
  messageReceived,
  eventReceived,
  clearError,
  resetReconnectAttempts,
} = websocketSlice.actions;

export default websocketSlice.reducer;