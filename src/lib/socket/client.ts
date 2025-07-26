import { io, Socket } from 'socket.io-client';
import { type Booking, type Resource } from '@/lib/db/schema';

class SocketClient {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(process.env.NEXT_PUBLIC_API_URL || '', {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Booking events
  onBookingCreated(callback: (booking: Booking) => void) {
    this.socket?.on('booking:created', callback);
  }

  onBookingUpdated(callback: (booking: Booking) => void) {
    this.socket?.on('booking:updated', callback);
  }

  onBookingDeleted(callback: (bookingId: string) => void) {
    this.socket?.on('booking:deleted', callback);
  }

  // Resource events
  onResourceUpdated(callback: (data: { resourceId: string; availability: any }) => void) {
    this.socket?.on('resource:updated', callback);
  }

  // Subscribe to specific resource updates
  subscribeToResource(resourceId: string) {
    this.socket?.emit('booking:subscribe', resourceId);
  }

  unsubscribeFromResource(resourceId: string) {
    this.socket?.emit('booking:unsubscribe', resourceId);
  }

  // Join tenant room
  joinTenantRoom(tenantId: string) {
    this.socket?.emit('tenant:join', tenantId);
  }

  // Remove event listeners
  offBookingCreated(callback?: (booking: Booking) => void) {
    this.socket?.off('booking:created', callback);
  }

  offBookingUpdated(callback?: (booking: Booking) => void) {
    this.socket?.off('booking:updated', callback);
  }

  offBookingDeleted(callback?: (bookingId: string) => void) {
    this.socket?.off('booking:deleted', callback);
  }

  offResourceUpdated(callback?: (data: any) => void) {
    this.socket?.off('resource:updated', callback);
  }

  get connected() {
    return this.isConnected;
  }
}

export const socketClient = new SocketClient();