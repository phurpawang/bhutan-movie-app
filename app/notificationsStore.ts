import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppNotification = {
  id: string;
  movieId?: number;
  title: string;
  message: string;
  poster_path?: string | null;
  createdAt: number;
  read: boolean;
};

const NOTIFICATIONS_KEY = 'notifications:list';
const NOTIFIED_IDS_KEY = 'notifications:seenMovieIds';
const MAX_NOTIFICATIONS = 40;

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn('notificationsStore readJSON failed', e);
    return fallback;
  }
}

async function writeJSON(key: string, value: any) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('notificationsStore writeJSON failed', e);
  }
}

export async function getNotifications(): Promise<AppNotification[]> {
  return readJSON<AppNotification[]>(NOTIFICATIONS_KEY, []);
}

export async function getUnreadCount(): Promise<number> {
  const list = await getNotifications();
  return list.filter((item) => !item.read).length;
}

export async function clearNotifications() {
  await AsyncStorage.removeItem(NOTIFICATIONS_KEY);
}

export async function markAllRead(): Promise<AppNotification[]> {
  const list = await getNotifications();
  const next = list.map((item) => (item.read ? item : { ...item, read: true }));
  await writeJSON(NOTIFICATIONS_KEY, next);
  return next;
}

function movieToNotification(movie: any): AppNotification {
  const title = movie?.title || movie?.name || 'New movie available';
  return {
    id: `${movie?.id || 'movie'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    movieId: movie?.id,
    title,
    message: `${title} just dropped for you. Tap to start watching!`,
    poster_path: movie?.poster_path || movie?.backdrop_path || null,
    createdAt: Date.now(),
    read: false,
  };
}

export async function syncNewMovieNotifications(movies: any[] = []) {
  try {
    const seen = await readJSON<number[]>(NOTIFIED_IDS_KEY, []);
    const seenSet = new Set<number>(seen);
    const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 14; // last 14 days
    const fresh: AppNotification[] = [];

    for (const movie of movies) {
      if (!movie || !movie.id || seenSet.has(movie.id)) continue;
      const releaseDate = movie.release_date || movie.first_air_date;
      if (!releaseDate) continue;
      const releaseMs = new Date(releaseDate).getTime();
      if (Number.isNaN(releaseMs) || releaseMs < cutoff) continue;
      seenSet.add(movie.id);
      fresh.push(movieToNotification(movie));
    }

    if (!fresh.length) {
      return;
    }

    const existing = await getNotifications();
    const merged = [...fresh, ...existing];
    const trimmed = merged.slice(0, MAX_NOTIFICATIONS);
    await writeJSON(NOTIFICATIONS_KEY, trimmed);
    await writeJSON(NOTIFIED_IDS_KEY, Array.from(seenSet));
  } catch (e) {
    console.warn('syncNewMovieNotifications failed', e);
  }
}

export default {
  getNotifications,
  getUnreadCount,
  markAllRead,
  clearNotifications,
  syncNewMovieNotifications,
};
