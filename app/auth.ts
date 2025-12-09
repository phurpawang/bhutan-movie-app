import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_API_URL } from '../constants/api';

const USER_KEY = 'user';
const ACCOUNTS_KEY = 'auth:accounts';

type StoredAccount = {
  email: string;
  name?: string;
  password?: string;
  createdAt: string;
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const readAccounts = async (): Promise<StoredAccount[]> => {
  try {
    const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('readAccounts failed', e);
    return [];
  }
};

const persistAccounts = async (accounts: StoredAccount[]) => {
  try {
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.warn('persistAccounts failed', e);
    throw e;
  }
};

export async function isLoggedIn(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return Boolean(raw);
  } catch (e) {
    console.warn('isLoggedIn check failed', e);
    return false;
  }
}

export async function login(payload: string | { email: string; password?: string; name?: string }): Promise<void> {
  try {
    if (typeof payload === 'string') {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify({ email: payload }));
      return;
    }

    const email = normalizeEmail(payload.email);
    console.log('Attempting login for:', email);
    console.log('Backend URL:', `${BACKEND_API_URL}/users/login`);
    
    const { data } = await axios.post(`${BACKEND_API_URL}/users/login`, {
      email,
      password: payload.password || null,
    });

    console.log('Login response:', data);

    if (!data?.user) {
      console.error('Login response missing user object');
      throw new Error('ACCOUNT_NOT_FOUND');
    }

    await AsyncStorage.setItem(
      USER_KEY,
      JSON.stringify({ id: data.user.id, email: data.user.email, name: data.user.name })
    );
    console.log('User saved to storage successfully');
  } catch (error: any) {
    console.error('login error details:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      url: `${BACKEND_API_URL}/users/login`,
    });
    const msg = error?.response?.data?.message || 'LOGIN_FAILED';
    console.warn('login failed', msg);
    throw new Error(msg);
  }
}

export async function signup(name: string, email: string, password: string): Promise<void> {
  const trimmedName = name.trim();
  const normalizedEmail = normalizeEmail(email);

  try {
    console.log('Attempting signup for:', normalizedEmail);
    const registerResponse = await axios.post(`${BACKEND_API_URL}/users/register`, {
      email: normalizedEmail,
      name: trimmedName || null,
      password,
    });
    console.log('Signup successful, response:', registerResponse.data);
    
    console.log('Now attempting login...');
    await login({ email: normalizedEmail, password });
    console.log('Login after signup successful');
  } catch (error: any) {
    console.error('signup error details:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
    });
    if (error?.response?.data?.message === 'ACCOUNT_EXISTS') {
      throw new Error('ACCOUNT_EXISTS');
    }
    console.error('signup network error', error);
    throw error;
  }
}

export async function logout(): Promise<void> {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch (e) {
    console.warn('logout failed', e);
    throw e;
  }
}

export async function getUser() {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('getUser failed', e);
    return null;
  }
}

export default { isLoggedIn, login, signup, logout, getUser };
