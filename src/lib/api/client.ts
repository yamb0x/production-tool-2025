import { type Booking, type Resource, type Project } from '@/lib/db/schema';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  // Bookings
  async getBookings(params?: {
    startDate?: string;
    endDate?: string;
    artistId?: string;
  }): Promise<{ data: Booking[] }> {
    const searchParams = new URLSearchParams();
    
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.resourceId) searchParams.set('resourceId', params.resourceId);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/bookings${query}`);
  }

  async createBooking(data: Partial<Booking>): Promise<{ data: Booking }> {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBooking(id: string, data: Partial<Booking>): Promise<{ data: Booking }> {
    return this.request(`/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteBooking(id: string): Promise<void> {
    return this.request(`/bookings/${id}`, {
      method: 'DELETE',
    });
  }

  // Resources
  async getResources(): Promise<{ data: Resource[] }> {
    return this.request('/resources');
  }

  async createResource(data: Partial<Resource>): Promise<{ data: Resource }> {
    return this.request('/resources', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Projects
  async getProjects(): Promise<{ data: Project[] }> {
    return this.request('/projects');
  }

  async createProject(data: Partial<Project>): Promise<{ data: Project }> {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Availability check
  async checkAvailability(resourceId: string, startTime: string, endTime: string): Promise<{ available: boolean }> {
    return this.request('/bookings/check-availability', {
      method: 'POST',
      body: JSON.stringify({ resourceId, startTime, endTime }),
    });
  }
}

export const apiClient = new ApiClient();