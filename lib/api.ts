import { getAuthHeader, getRefreshToken, setToken, setRefreshToken, logout } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://krew-ai-backend-production.up.railway.app';

// Prevent multiple simultaneous refresh calls
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      setToken(data.token);
      setRefreshToken(data.refreshToken);
      return data.token;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Helper for API requests
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const buildHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
    if (options.headers) {
      Object.assign(headers, options.headers as Record<string, string>);
    }
    return headers;
  };

  try {
    const response = await fetch(url, { ...options, headers: buildHeaders() });

    // Silently refresh on expired access token and retry once
    if (response.status === 401) {
      const error = await response.json().catch(() => ({}));
      if (error.error === 'Token expired') {
        const newToken = await refreshAccessToken();
        if (newToken) {
          const retryResponse = await fetch(url, { ...options, headers: buildHeaders() });
          if (retryResponse.ok) return retryResponse.json();
          // Retry also failed — fall through to error handling below
          const retryError = await retryResponse.json().catch(() => ({}));
          throw new Error(retryError.message || retryError.error || `Request failed with status ${retryResponse.status}`);
        }
        // No refresh token or refresh failed — kick to login
        await logout();
        return;
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
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
    if (error.message === 'Failed to fetch' || error instanceof TypeError) {
      throw new Error('Unable to connect to server. Please check your internet connection.');
    }
    throw error;
  }
};

// Auth API calls
export const checkEmail = async (email: string): Promise<{ exists: boolean }> => {
  return apiRequest('/auth/check-email', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

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

  if (response.token) setToken(response.token);
  if (response.refreshToken) setRefreshToken(response.refreshToken);

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

  if (response.token) setToken(response.token);
  if (response.refreshToken) setRefreshToken(response.refreshToken);

  return response;
};

// Onboarding API call
export const saveOnboarding = async (data: {
  businessType?: string;
  revenueRange?: string;
  dmVolume?: string;
  painPoint?: string;
  brandDescription?: string;
}) => {
  const payload: Record<string, string> = {};
  if (data.businessType) payload.business_type = data.businessType;
  if (data.revenueRange) payload.revenue_range = data.revenueRange;
  if (data.dmVolume) payload.dm_volume = data.dmVolume;
  if (data.painPoint) payload.pain_point = data.painPoint;
  if (data.brandDescription) payload.brand_description = data.brandDescription;

  return apiRequest('/auth/onboarding', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// Brand description API call (for settings page)
export const updateBrandDescription = async (brand_description: string) => {
  return apiRequest('/auth/brand-description', {
    method: 'PUT',
    body: JSON.stringify({ brand_description }),
  });
};

// Products API call — returns the authenticated user's brand products
export const getProducts = async () => {
  return apiRequest('/products/mine', { method: 'GET' });
};

// Customize API calls
export const getKnowledgeBase = async () => {
  return apiRequest('/knowledge-base', {
    method: 'GET',
  });
};

export const saveKnowledgeBase = async (
  faqs: Array<{ question: string; answer: string }>,
  extras?: {
    situations_enabled?: boolean;
    situations?: Array<{ text: string }>;
    size_guides_enabled?: boolean;
    size_guides?: Array<{ product_name: string; content: string; image_url?: string }>;
  }
) => {
  return apiRequest('/knowledge-base', {
    method: 'POST',
    body: JSON.stringify({ faqs, ...extras }),
  });
};

export const uploadSizeGuideImage = async (file: File): Promise<{ url: string }> => {
  const authHeader = getAuthHeader() as Record<string, string>;
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `${API_BASE_URL}/knowledge-base/upload-image`,
    { method: 'POST', headers: authHeader, body: formData }
  );

  if (!response.ok) {
    throw new Error('Image upload failed');
  }
  return response.json();
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

// All integrations status (Shopify + Meta)
export const getIntegrationStatus = async () => {
  return apiRequest('/integrations/status', {
    method: 'GET',
  });
};

// Disconnect integration(s)
export const disconnectIntegration = async (platform: 'shopify' | 'instagram' | 'all') => {
  return apiRequest('/integrations/disconnect', {
    method: 'DELETE',
    body: JSON.stringify({ platform }),
  });
};

// Orders API calls
export const getOrders = async () => {
  return apiRequest('/orders', { method: 'GET' });
};

export const getOrderStats = async () => {
  return apiRequest('/orders/stats', { method: 'GET' });
};

// Interactions / Issues / Reports API calls
export const getIssues = async (brandId: string, days = 30) => {
  return apiRequest(`/interactions/issues?brand_id=${brandId}&days=${days}`, { method: 'GET' });
};

export const getIssueInteractions = async (brandId: string, category: string, days = 30) => {
  return apiRequest(`/interactions/issues/${encodeURIComponent(category)}?brand_id=${brandId}&days=${days}`, { method: 'GET' });
};

export const getSentiment = async (brandId: string, days = 30) => {
  return apiRequest(`/interactions/sentiment?brand_id=${brandId}&days=${days}`, { method: 'GET' });
};

export const getReports = async (brandId: string, days = 30) => {
  return apiRequest(`/interactions/reports?brand_id=${brandId}&days=${days}`, { method: 'GET' });
};

// Overview stats (aggregated from orders, exchanges, refunds, conversations)
export const getOverviewStats = async () => {
  const [orderStats, exchangeRefunds, conversations] = await Promise.all([
    apiRequest('/orders/stats', { method: 'GET' }),
    apiRequest('/exchanges-refunds?status=all', { method: 'GET' }),
    apiRequest('/conversations?status=all', { method: 'GET' }),
  ]);

  const requests: Array<{ type: string; status: string }> = exchangeRefunds.requests || [];
  const return_requests = requests.filter((r) => r.type === 'exchange').length;
  const refund_requests = requests.filter((r) => r.type === 'refund').length;
  const total_conversations = (conversations.conversations || conversations || []).length;

  return {
    orders_from_dms: orderStats.total_orders || 0,
    return_requests,
    refund_requests,
    total_conversations,
  };
};
