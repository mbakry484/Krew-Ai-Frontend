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

// Luna global toggle
export const getLunaGlobalStatus = async () => {
  return apiRequest('/luna/global-status', { method: 'GET' });
};

export const updateLunaGlobalStatus = async (enabled: boolean) => {
  return apiRequest('/luna/global-status', {
    method: 'PUT',
    body: JSON.stringify({ luna_global_enabled: enabled }),
  });
};

// Luna test chat — user tests Luna directly
export const sendLunaTestMessage = async (
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
) => {
  return apiRequest('/luna/test-chat', {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  });
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

// Voice profile API calls

// The backend GPT analysis returns this shape inside the `profile` JSON column
export interface VoiceProfileData {
  summary: string;
  tone: string[];
  greeting_style: { example: string; notes: string };
  closing_style: { example: string; notes: string };
  complaint_handling: { approach: string; example: string };
  order_status_replies: { example: string; notes: string };
  emoji_usage: 'none' | 'light' | 'moderate' | 'heavy';
  language_mix: { english: number; arabic: number; franco_arabic: number };
  signature_phrases: string[];
  formality: 'very_casual' | 'casual' | 'neutral' | 'formal';
  message_length: 'short' | 'medium' | 'long';
}

// The full DB row from voice_profiles table
export interface VoiceProfileRow {
  brand_id: string;
  profile: VoiceProfileData;
  is_active: boolean;
  sample_size: number;
  updated_at: string;
}

// Normalized shape used by the UI (flattened from VoiceProfileRow)
export interface VoiceProfile {
  summary: string;
  tone: string[];
  greeting: string;
  closing: string;
  complaint_handling: string;
  complaint_example: string;
  emoji_vibe: 'none' | 'light' | 'moderate' | 'heavy';
  language_mix: { english: number; arabic: number; franco_arabic: number };
  signature_phrases: string[];
  formality: 'very_casual' | 'casual' | 'neutral' | 'formal';
  message_length: 'short' | 'medium' | 'long';
  is_active: boolean;
}

/** Convert backend DB row → flat UI shape */
function normalizeVoiceProfile(row: VoiceProfileRow): VoiceProfile {
  const p = row.profile;
  return {
    summary: p.summary || '',
    tone: p.tone || [],
    greeting: p.greeting_style?.example || '',
    closing: p.closing_style?.example || '',
    complaint_handling: p.complaint_handling?.approach || '',
    complaint_example: p.complaint_handling?.example || '',
    emoji_vibe: p.emoji_usage || 'none',
    language_mix: p.language_mix || { english: 100, arabic: 0, franco_arabic: 0 },
    signature_phrases: p.signature_phrases || [],
    formality: p.formality || 'neutral',
    message_length: p.message_length || 'medium',
    is_active: row.is_active,
  };
}

/** Convert flat UI shape back → backend profile JSON for PATCH */
function denormalizeVoiceProfile(ui: VoiceProfile): Partial<VoiceProfileData> {
  return {
    summary: ui.summary,
    tone: ui.tone,
    greeting_style: { example: ui.greeting, notes: '' },
    closing_style: { example: ui.closing, notes: '' },
    complaint_handling: { approach: ui.complaint_handling, example: ui.complaint_example },
    emoji_usage: ui.emoji_vibe,
    language_mix: ui.language_mix,
    signature_phrases: ui.signature_phrases,
    formality: ui.formality,
    message_length: ui.message_length,
  };
}

/** Helper: get brand_id from /auth/me */
let cachedBrandId: string | null = null;
async function getBrandId(): Promise<string> {
  if (cachedBrandId) return cachedBrandId;
  const res = await apiRequest('/auth/me', { method: 'GET' });
  const id = res.user?.brand_id || res.brand_id;
  if (!id) throw new Error('Brand not found');
  cachedBrandId = id;
  return id;
}

export const uploadVoiceFile = async (file: File): Promise<{ job_id: string }> => {
  const authHeader = getAuthHeader() as Record<string, string>;
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `${API_BASE_URL}/api/voice/upload`,
    { method: 'POST', headers: authHeader, body: formData }
  );

  if (!response.ok) throw new Error('Voice file upload failed');
  return response.json();
};

export const getVoiceJobStatus = async (jobId: string): Promise<{
  status: 'processing' | 'ready' | 'failed';
  progress: number;
  error?: string;
} | null> => {
  const url = `${API_BASE_URL}/api/voice/status/${jobId}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
  });
  if (response.status === 304) return null;
  if (!response.ok) throw new Error(`Status check failed (${response.status})`);
  return response.json();
};

export const getVoiceProfile = async (): Promise<VoiceProfile | null> => {
  try {
    const brandId = await getBrandId();
    const row: VoiceProfileRow = await apiRequest(`/api/voice/profile/${brandId}`, { method: 'GET' });
    return normalizeVoiceProfile(row);
  } catch {
    return null;
  }
};

export const updateVoiceProfile = async (profile: VoiceProfile): Promise<VoiceProfile> => {
  const brandId = await getBrandId();
  const payload = denormalizeVoiceProfile(profile);
  const row: VoiceProfileRow = await apiRequest(`/api/voice/profile/${brandId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return normalizeVoiceProfile(row);
};

export const activateVoiceProfile = async (): Promise<void> => {
  const brandId = await getBrandId();
  await apiRequest(`/api/voice/profile/${brandId}/activate`, { method: 'POST', body: '{}' });
};

export const deactivateVoiceProfile = async (): Promise<void> => {
  const brandId = await getBrandId();
  await apiRequest(`/api/voice/profile/${brandId}/deactivate`, { method: 'POST', body: '{}' });
};

export const reanalyzeVoice = async (): Promise<{ job_id: string }> => {
  // Re-upload not needed — just re-trigger upload endpoint
  // The caller should re-upload the file; for now this is a placeholder
  throw new Error('Re-analysis requires re-uploading the file.');
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
