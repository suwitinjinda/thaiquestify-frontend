// src/config/api.js
// export const API_BASE = 'http://192.168.1.40:5000/api'; // ใช้ IP จริงของคุณ
// หรือใช้ localhost ถ้าทดสอบบนเครื่องเดียวกัน
// export const API_BASE = 'http://localhost:5000/api';

// export const API_ENDPOINTS = {
//   AUTH: {
//     LINE_LOGIN: `${API_BASE}/auth/line`,
//     VERIFY_TOKEN: `${API_BASE}/auth/verify`,
//   },
//   PARTNERS: {
//     REGISTER: `${API_BASE}/partners/register`,
//     DASHBOARD: `${API_BASE}/partners/dashboard`,
//   },
//   SHOPS: {
//     REGISTER: `${API_BASE}/shops/register`,
//   },
//   QUESTS: {
//     LIST: `${API_BASE}/quests`,
//   }
// };

// src/config/api.js
export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.40:5000/api',
  USE_MOCK_API: false, // เปลี่ยนเป็น false เพื่อใช้ real API
};

export const getApiBaseUrl = () => {
  return API_CONFIG.BASE_URL;
};