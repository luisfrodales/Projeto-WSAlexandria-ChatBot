export interface User {
  id: string;
  _id?: string; // MongoDB ID
  username?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: 'admin' | 'technician' | 'manager';
  avatar?: string;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  helpful?: boolean;
  suggestions?: string[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  status: 'processing' | 'completed' | 'failed';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

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