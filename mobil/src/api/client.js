import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// API adresi app.json > expo.extra.apiUrl üzerinden okunur.
// Geliştirme için: bilgisayarının yerel IP'sini app.json'da güncelle (ipconfig / ifconfig).
// Prod build'lerde EAS'da profile bazlı farklı app.json / env-config kullanılması önerilir.
const BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const user = await AsyncStorage.getItem('user');
  if (user) {
    const { token } = JSON.parse(user);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// App.js bu fonksiyonla kendini kaydeder; 401 geldiğinde React state de güncellenir
// (aksi halde AsyncStorage temizlenir ama ekran hâlâ giriş yapılmış gibi kalır).
let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.removeItem('user');
      if (onUnauthorized) onUnauthorized();
    }
    return Promise.reject(err);
  }
);

export default api;
export { BASE_URL };
