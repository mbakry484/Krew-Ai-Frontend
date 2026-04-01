import { getAuthHeader } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://krew-ai-backend-production.up.railway.app';

// Helper for API requests
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
  };

  if (options.headers) {
    const existingHeaders = options.headers as Record<string, string>;
    Object.assign(headers, existingHeaders);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Try to parse error response
      const error = await response.json().catch(() => ({}));

      // Map HTTP status codes to meaningful messages
      let errorMessage = error.message || error.detail || error.error;

      if (!errorMessage) {
        switch (response.status) {
          case 400:
            errorMessage = 'Invalid request. Please check your input.';
            break;
          case 401:
            errorMessage = 'Invalid email or password.';
            break;
          case 403:
            errorMessage = 'Access denied. Please check your credentials.';
            break;
          case 404:
            errorMessage = 'Service not found. Please try again later.';
            break;
          case 409:
            errorMessage = 'An account with this email already exists.';
            break;
          case 422:
            errorMessage = 'Invalid input. Please check your information.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please try again later.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          case 502:
          case 503:
          case 504:
            errorMessage = 'Service temporarily unavailable. Please try again.';
            break;
          default:
            errorMessage = `Request failed with status ${response.status}`;
        }
      }

      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: any) {
    // Handle network errors
    if (error.message === 'Failed to fetch' || error instanceof TypeError) {
      throw new Error('Unable to connect to server. Please check your internet connection.');
    }
    // Re-throw other errors
    throw error;
  }
};

// Auth API calls
export const signup = async (data: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  business_name: string;
}) => {
  const response = await apiRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // Store token if returned
  if (response.token) {
    localStorage.setItem('krew_token', response.token);
  }

  return response;
};

export const login = async (data: {
  email: string;
  password: string;
}) => {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // Store token if returned
  if (response.token) {
    localStorage.setItem('krew_token', response.token);
  }

  return response;
};

// Onboarding API call
export const saveOnboarding = async (data: {
  businessType?: string;
  platform?: string;
  customersPerMonth?: string;
  primaryGoal?: string;
}) => {
  return apiRequest('/auth/onboarding', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Knowledge Base API calls
export const getKnowledgeBase = async () => {
  return apiRequest('/knowledge-base', {
    method: 'GET',
  });
};

export const saveKnowledgeBase = async (faqs: Array<{
  question: string;
  answer: string;
}>) => {
  return apiRequest('/knowledge-base', {
    method: 'POST',
    body: JSON.stringify({ faqs }),
  });
};

export const deleteKnowledgeFAQ = async (index: number) => {
  return apiRequest(`/knowledge-base/${index}`, {
    method: 'DELETE',
  });
};

// Conversations API calls
export const getConversations = async (status: 'all' | 'escalated' | 'pending' | 'resolved' = 'all') => {
  return apiRequest(`/conversations?status=${status}`, { method: 'GET' });
};

export const getConversation = async (id: string) => {
  return apiRequest(`/conversations/${id}`, { method: 'GET' });
};

export const sendConversationMessage = async (id: string, content: string) => {
  return apiRequest(`/conversations/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
};

export const handoverConversation = async (id: string) => {
  return apiRequest(`/conversations/${id}/handover`, { method: 'POST', body: '{}' });
};

export const restoreLuna = async (id: string) => {
  return apiRequest(`/conversations/${id}/restore-luna`, { method: 'POST', body: '{}' });
};

export const resolveConversation = async (id: string) => {
  return apiRequest(`/conversations/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'resolved' }),
  });
};

// Exchanges & Refunds API calls
export const getExchangesRefunds = async (status: 'all' | 'pending' | 'done' | 'dismissed' = 'all') => {
  return apiRequest(`/exchanges-refunds?status=${status}`, { method: 'GET' });
};

export const updateExchangeRefundStatus = async (
  type: 'exchange' | 'refund',
  id: string,
  status: 'done' | 'dismissed'
) => {
  return apiRequest(`/exchanges-refunds/${type}/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

// User info API call
export const getUserInfo = async () => {
  return apiRequest('/auth/me', {
    method: 'GET',
  });
};

// Shopify integration API calls
export const connectShopify = async (shop_domain: string) => {
  return apiRequest('/integrations/shopify/connect', {
    method: 'POST',
    body: JSON.stringify({ shop_domain }),
  });
};

export const getShopifyStatus = async () => {
  return apiRequest('/integrations/shopify/status', {
    method: 'GET',
  });
};