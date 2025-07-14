const API_BASE_URL = 'http://localhost:3001/api';

export interface LoginResponse {
  message: string;
  user: {
    _id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    lastLogin: string;
    createdAt: string;
    updatedAt: string;
  };
  token: string;
  loginTime: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiError {
  error: string;
  code?: string;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error');
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getProfile(token: string): Promise<LoginResponse['user']> {
    return this.request<LoginResponse['user']>('/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async createGuestSession(): Promise<{
    message: string;
    sessionId: string;
    token: string;
    expiresAt: string;
  }> {
    return this.request('/auth/guest-session', {
      method: 'POST',
    });
  }

  async refreshGuestSession(sessionId: string, token: string): Promise<{
    message: string;
    sessionId: string;
    token: string;
    expiresAt: string;
  }> {
    return this.request('/auth/guest-session/refresh', {
      method: 'POST',
      body: JSON.stringify({ sessionId, token }),
    });
  }
}

export const apiService = new ApiService();
export default apiService; 