// src/services/integrations/tiktok.js
import AsyncStorage from '@react-native-async-storage/async-storage';
 
const API_URL = 'https://thaiquestify.com/api';
const TIKTOK_CALLBACK_DEEPLINK_PREFIX = 'thaiquestify://integrations/tiktok';
 
async function getAuthHeader() {
  const token = await AsyncStorage.getItem('authToken');
  return { Authorization: `Bearer ${token}` };
}
 
export async function getTikTokStatus() {
  const headers = {
    'Content-Type': 'application/json',
    ...(await getAuthHeader()),
  };
 
  const res = await fetch(`${API_URL}/integrations/tiktok/status`, { headers });
 
  // If backend not implemented yet
  if (res.status === 404) {
    return { success: true, connected: false, notImplemented: true };
  }
 
  const data = await res.json().catch(() => ({}));
 
  if (!res.ok || !data?.success) {
    return { success: false, connected: false, message: data?.message || `HTTP ${res.status}` };
  }
 
  return {
    success: true,
    connected: !!data.connected,
    openId: data.openId || null,
    username: data.username || null,
    profileUrl: data.profileUrl || null,
    followerCount: data.followerCount || 0,
    lastSynced: data.lastSynced || null,
  };
}
 
export async function startTikTokConnect() {
  const headers = {
    'Content-Type': 'application/json',
    ...(await getAuthHeader()),
  };
 
  const res = await fetch(`${API_URL}/integrations/tiktok/start`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });
 
  if (res.status === 404) {
    return { success: false, notImplemented: true, message: 'Missing backend endpoint: POST /api/integrations/tiktok/start' };
  }
 
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.success || !data?.url) {
    return { success: false, message: data?.message || `HTTP ${res.status}` };
  }
 
  return { success: true, url: data.url };
}
 
export async function disconnectTikTok() {
  const headers = {
    'Content-Type': 'application/json',
    ...(await getAuthHeader()),
  };
 
  const res = await fetch(`${API_URL}/integrations/tiktok/disconnect`, {
    method: 'POST',
    headers,
  });
 
  if (res.status === 404) {
    // Treat as disconnected locally if backend not implemented
    return { success: true, disconnectedLocally: true };
  }
 
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.success) {
    return { success: false, message: data?.message || `HTTP ${res.status}` };
  }
 
  return { success: true };
}
 
export const TikTokIntegration = {
  API_URL,
  TIKTOK_CALLBACK_DEEPLINK_PREFIX,
};