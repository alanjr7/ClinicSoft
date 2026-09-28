// Helpers para persistencia de tokens en localStorage

const ACCESS_KEY = "ds_access_token";

export const getAccessToken = (): string | null => localStorage.getItem(ACCESS_KEY);
export const getRefreshToken = (): string | null => null;

export const setTokens = (access: string): void => {
  localStorage.setItem(ACCESS_KEY, access);
};

export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_KEY);
};
