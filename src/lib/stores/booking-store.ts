import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { apiClient } from '@/lib/api/client';
import { socketClient } from '@/lib/socket/client';
import { type Booking, type CreateBooking } from '@/lib/db/schema';

interface BookingStore {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchBookings: (params?: { startDate?: string; endDate?: string; artistId?: string }) => Promise<void>;
  createBooking: (data: Partial<CreateBooking>) => Promise<void>;
  updateBooking: (id: string, data: Partial<Booking>) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  
  // Real-time updates
  addBooking: (booking: Booking) => void;
  updateBookingLocal: (booking: Booking) => void;
  removeBooking: (id: string) => void;
  
  // Optimistic updates
  addOptimisticBooking: (booking: Partial<Booking> & { tempId: string }) => void;
  removeOptimisticBooking: (tempId: string) => void;
  replaceOptimisticBooking: (tempId: string, booking: Booking) => void;
}

export const useBookingStore = create<BookingStore>()(
  subscribeWithSelector((set, get) => ({
    bookings: [],
    loading: false,
    error: null,

    fetchBookings: async (params) => {
      set({ loading: true, error: null });
      try {
        const response = await apiClient.getBookings(params);
        set({ bookings: response.data, loading: false });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch bookings',
          loading: false 
        });
      }
    },

    createBooking: async (data) => {
      const tempId = `temp-${Date.now()}`;
      const optimisticBooking = {
        ...data,
        id: tempId,
        tempId,
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      };

      // Add optimistic booking
      get().addOptimisticBooking(optimisticBooking);

      try {
        const response = await apiClient.createBooking(data);
        // Replace optimistic with real booking
        get().replaceOptimisticBooking(tempId, response.data);
      } catch (error) {
        // Remove optimistic booking on error
        get().removeOptimisticBooking(tempId);
        set({ error: error instanceof Error ? error.message : 'Failed to create booking' });
        throw error;
      }
    },

    updateBooking: async (id, data) => {
      try {
        const response = await apiClient.updateBooking(id, data);
        get().updateBookingLocal(response.data);
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to update booking' });
        throw error;
      }
    },

    deleteBooking: async (id) => {
      try {
        await apiClient.deleteBooking(id);
        get().removeBooking(id);
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to delete booking' });
        throw error;
      }
    },

    // Real-time update handlers
    addBooking: (booking) => {
      set((state) => ({
        bookings: [...state.bookings, booking],
      }));
    },

    updateBookingLocal: (booking) => {
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === booking.id ? booking : b)),
      }));
    },

    removeBooking: (id) => {
      set((state) => ({
        bookings: state.bookings.filter((b) => b.id !== id),
      }));
    },

    // Optimistic update handlers
    addOptimisticBooking: (booking) => {
      set((state) => ({
        bookings: [...state.bookings, booking as Booking],
      }));
    },

    removeOptimisticBooking: (tempId) => {
      set((state) => ({
        bookings: state.bookings.filter((b) => 
          !('tempId' in b) || b.tempId !== tempId
        ),
      }));
    },

    replaceOptimisticBooking: (tempId, booking) => {
      set((state) => ({
        bookings: state.bookings.map((b) => 
          'tempId' in b && b.tempId === tempId ? booking : b
        ),
      }));
    },
  }))
);

// Set up real-time event listeners
if (typeof window !== 'undefined') {
  socketClient.onBookingCreated((booking) => {
    useBookingStore.getState().addBooking(booking);
  });

  socketClient.onBookingUpdated((booking) => {
    useBookingStore.getState().updateBookingLocal(booking);
  });

  socketClient.onBookingDeleted((bookingId) => {
    useBookingStore.getState().removeBooking(bookingId);
  });
}