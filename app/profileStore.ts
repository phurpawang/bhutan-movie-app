import AsyncStorage from '@react-native-async-storage/async-storage';

// per-user storage keys
function keyFor(base: string, userId: string) {
  return `${base}:${userId}`;
}

const HISTORY_BASE = 'watchHistory';
const DOWNLOADS_BASE = 'downloads';
const FAVORITES_BASE = 'favorites';

export async function addHistory(userId: string, entry: any) {
  try {
    const k = keyFor(HISTORY_BASE, userId);
    const raw = await AsyncStorage.getItem(k);
    const arr = raw ? JSON.parse(raw) : [];
    const next = [{ ...entry, watchedAt: Date.now() }, ...arr];
    await AsyncStorage.setItem(k, JSON.stringify(next));
    return next;
  } catch (e) {
    console.warn('addHistory failed', e);
    return null;
  }
}

export async function getHistory(userId: string) {
  try {
    const k = keyFor(HISTORY_BASE, userId);
    const raw = await AsyncStorage.getItem(k);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('getHistory failed', e);
    return [];
  }
}

export async function clearHistory(userId: string) {
  try {
    const k = keyFor(HISTORY_BASE, userId);
    await AsyncStorage.removeItem(k);
  } catch (e) {
    console.warn('clearHistory failed', e);
  }
}

export async function addDownload(userId: string, entry: any) {
  try {
    const k = keyFor(DOWNLOADS_BASE, userId);
    const raw = await AsyncStorage.getItem(k);
    const arr = raw ? JSON.parse(raw) : [];
    const exists = arr.find((a: any) => a.id === entry.id);
    let next = arr;
    if (!exists) next = [...arr, { ...entry, downloadedAt: Date.now() }];
    await AsyncStorage.setItem(k, JSON.stringify(next));
    return next;
  } catch (e) {
    console.warn('addDownload failed', e);
    return null;
  }
}

export async function getDownloads(userId: string) {
  try {
    const k = keyFor(DOWNLOADS_BASE, userId);
    const raw = await AsyncStorage.getItem(k);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('getDownloads failed', e);
    return [];
  }
}

export async function clearDownloads(userId: string) {
  try {
    const k = keyFor(DOWNLOADS_BASE, userId);
    await AsyncStorage.removeItem(k);
  } catch (e) {
    console.warn('clearDownloads failed', e);
  }
}

export async function removeDownload(userId: string, movieId: number) {
  try {
    const k = keyFor(DOWNLOADS_BASE, userId);
    const raw = await AsyncStorage.getItem(k);
    const arr = raw ? JSON.parse(raw) : [];
    const next = arr.filter((item: any) => item?.id !== movieId);
    await AsyncStorage.setItem(k, JSON.stringify(next));
    return next;
  } catch (e) {
    console.warn('removeDownload failed', e);
    return null;
  }
}

// favorites per user
export async function addFavorite(userId: string, movie: any) {
  try {
    const k = keyFor(FAVORITES_BASE, userId);
    const raw = await AsyncStorage.getItem(k);
    const arr = raw ? JSON.parse(raw) : [];
    const exists = arr.find((f: any) => (typeof f === 'number' ? f === movie.id : f.id === movie.id));
    if (!exists) {
      const next = [...arr, movie];
      await AsyncStorage.setItem(k, JSON.stringify(next));
      return next;
    }
    return arr;
  } catch (e) {
    console.warn('addFavorite failed', e);
    return null;
  }
}

export async function getFavorites(userId: string) {
  try {
    const k = keyFor(FAVORITES_BASE, userId);
    const raw = await AsyncStorage.getItem(k);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('getFavorites failed', e);
    return [];
  }
}

export async function removeFavorite(userId: string, movieId: number | string) {
  try {
    const k = keyFor(FAVORITES_BASE, userId);
    const raw = await AsyncStorage.getItem(k);
    const arr = raw ? JSON.parse(raw) : [];
    const target = String(movieId);
    const next = arr.filter((f: any) => {
      const current = typeof f === 'number' ? String(f) : String(f.id);
      return current !== target;
    });
    await AsyncStorage.setItem(k, JSON.stringify(next));
    return next;
  } catch (e) {
    console.warn('removeFavorite failed', e);
    return null;
  }
}

export async function clearFavorites(userId: string) {
  try {
    const k = keyFor(FAVORITES_BASE, userId);
    await AsyncStorage.removeItem(k);
  } catch (e) {
    console.warn('clearFavorites failed', e);
  }
}

export default { addHistory, getHistory, addDownload, getDownloads, clearHistory, clearDownloads, removeDownload, addFavorite, getFavorites, removeFavorite, clearFavorites };
