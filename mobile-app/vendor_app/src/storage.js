import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'vendor_access_token';
const REFRESH_KEY = 'vendor_refresh_token';
const VENDOR_ID_KEY = 'vendor_id';

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function getVendorId() {
  return SecureStore.getItemAsync(VENDOR_ID_KEY);
}

export async function setTokens({ accessToken, refreshToken, vendorId }) {
  if (accessToken) {
    await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
  }
  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  }
  if (vendorId) {
    await SecureStore.setItemAsync(VENDOR_ID_KEY, vendorId);
  }
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
  await SecureStore.deleteItemAsync(VENDOR_ID_KEY);
}
