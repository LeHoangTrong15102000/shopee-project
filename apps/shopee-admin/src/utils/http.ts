import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/';

const URL_LOGIN = 'login';
const URL_REFRESH_TOKEN = 'refresh-access-token';
const URL_LOGOUT = 'logout';

function getAccessTokenFromLS() {
  return localStorage.getItem('accessToken') || '';
}
function getRefreshTokenFromLS() {
  return localStorage.getItem('refreshToken') || '';
}
function setAccessTokenToLS(token: string) {
  localStorage.setItem('accessToken', token);
}
function setRefreshTokenToLS(token: string) {
  localStorage.setItem('refreshToken', token);
}
function setProfileToLS(profile: unknown) {
  localStorage.setItem('profile', JSON.stringify(profile));
}
function clearLS() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('profile');
}

// Callback for handling auth failure navigation (single consumer — router layer)
let onAuthFailure: (() => void) | null = null;
export function setOnAuthFailure(cb: () => void) {
  onAuthFailure = cb;
}

// Callback for syncing token refresh with external state (single consumer — auth store)
let onTokenRefreshed: ((accessToken: string) => void) | null = null;
export function setOnTokenRefreshed(cb: (accessToken: string) => void) {
  onTokenRefreshed = cb;
}

export class Http {
  readonly instance: AxiosInstance;
  private accessToken: string;
  private refreshToken: string;
  private refreshTokenRequest: Promise<string> | null;

  constructor() {
    this.accessToken = getAccessTokenFromLS();
    this.refreshToken = getRefreshTokenFromLS();
    this.refreshTokenRequest = null;
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.instance.interceptors.request.use(
      (config) => {
        if (this.accessToken && config.headers) {
          config.headers.authorization = this.accessToken;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.instance.interceptors.response.use(
      (response) => {
        const { url } = response.config;
        if (url === URL_LOGIN) {
          const data = response.data as {
            data: { access_token: string; refresh_token: string; user: unknown };
          };
          this.accessToken = data.data.access_token;
          this.refreshToken = data.data.refresh_token;
          setAccessTokenToLS(this.accessToken);
          setRefreshTokenToLS(this.refreshToken);
          setProfileToLS(data.data.user);
        } else if (url === URL_LOGOUT) {
          this.accessToken = '';
          this.refreshToken = '';
          clearLS();
        }
        return response;
      },
      async (error: AxiosError) => {
        if (error.response?.status === 401 && error.config?.url !== URL_REFRESH_TOKEN) {
          this.refreshTokenRequest = this.refreshTokenRequest ?? this.handleRefreshToken();
          try {
            const accessToken = await this.refreshTokenRequest;
            // Retry original request
            const config = error.config as AxiosRequestConfig;
            if (config.headers) {
              config.headers.authorization = accessToken;
            }
            return this.instance(config);
          } catch {
            clearLS();
            this.accessToken = '';
            this.refreshToken = '';
            if (onAuthFailure) {
              onAuthFailure();
            } else {
              window.location.href = '/login';
            }
            throw error;
          } finally {
            this.refreshTokenRequest = null;
          }
        }
        return Promise.reject(error);
      },
    );
  }

  private async handleRefreshToken() {
    return this.instance
      .post<{ data: { access_token: string } }>(URL_REFRESH_TOKEN, {
        refresh_token: this.refreshToken,
      })
      .then((res) => {
        const { access_token } = res.data.data;
        setAccessTokenToLS(access_token);
        this.accessToken = access_token;
        onTokenRefreshed?.(access_token);
        return access_token;
      })
      .catch((error) => {
        clearLS();
        this.accessToken = '';
        this.refreshToken = '';
        throw error;
      });
  }
}

const http = new Http().instance;
export default http;

export {
  getAccessTokenFromLS,
  getRefreshTokenFromLS,
  setAccessTokenToLS,
  setRefreshTokenToLS,
  setProfileToLS,
  clearLS,
  URL_LOGIN,
  URL_LOGOUT,
  URL_REFRESH_TOKEN,
};
