import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { RefreshTokenResponse } from '@/types/auth.type';
import { URL_REFRESH_TOKEN } from '@/apis/auth.constants';
import { API_BASE_URL } from '@/config/env';

class Http {
  readonly instance: AxiosInstance;
  private refreshTokenRequest: Promise<string> | null;

  constructor() {
    this.refreshTokenRequest = null;
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'expire-access-token': 60 * 60 * 24,
        'refresh-access-token': 60 * 60 * 24 * 7,
      },
    });

    this.instance.interceptors.request.use(
      (config) => {
        const accessToken = useAuthStore.getState().accessToken;
        if (accessToken && config.headers) {
          config.headers.authorization = accessToken;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.instance.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error: AxiosError) => {
        const status = error.response?.status;

        if (status === 401) {
          const config = error.response?.config ?? ({} as AxiosRequestConfig);
          const { url } = config;
          const errorData = error.response?.data as { data?: { name?: string } } | undefined;
          const isExpiredToken = errorData?.data?.name === 'EXPIRED_TOKEN';

          if (isExpiredToken && url !== URL_REFRESH_TOKEN) {
            this.refreshTokenRequest = this.refreshTokenRequest
              ? this.refreshTokenRequest
              : this.handleRefreshToken().finally(() => {
                  this.refreshTokenRequest = null;
                });

            return this.refreshTokenRequest.then((access_token) => {
              return this.instance({
                ...config,
                headers: { ...(config.headers || {}), authorization: access_token },
              });
            });
          }

          useAuthStore.getState().logout();
        }

        return Promise.reject(error);
      }
    );
  }

  private async handleRefreshToken() {
    const refreshToken = useAuthStore.getState().refreshToken;
    return this.instance
      .post<RefreshTokenResponse>(URL_REFRESH_TOKEN, {
        refresh_token: refreshToken,
      })
      .then((res) => {
        const { access_token } = res.data.data;
        useAuthStore.getState().setAccessToken(access_token);
        return access_token;
      })
      .catch((error) => {
        useAuthStore.getState().logout();
        throw error;
      });
  }
}

const http = new Http().instance;

export default http;
