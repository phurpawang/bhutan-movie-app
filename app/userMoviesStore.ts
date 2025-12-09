import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserMovie = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  posterUri?: string | null;
  trailerUrl?: string;
  genre?: string;
  year?: string;
  actors?: string[];
  createdAt: number;
};

const USER_MOVIES_BASE = 'userMovies';
const USER_MOVIES_ALL_KEY = 'userMovies:all';
const GLOBAL_LIMIT = 80;

function keyFor(userId: string) {
  return `${USER_MOVIES_BASE}:${userId}`;
}

async function readList(userId: string): Promise<UserMovie[]> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('userMoviesStore readList failed', e);
    return [];
  }
}

async function writeList(userId: string, list: UserMovie[]) {
  try {
    await AsyncStorage.setItem(keyFor(userId), JSON.stringify(list));
  } catch (e) {
    console.warn('userMoviesStore writeList failed', e);
  }
}

async function readGlobalList(): Promise<UserMovie[]> {
  try {
    const raw = await AsyncStorage.getItem(USER_MOVIES_ALL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('userMoviesStore readGlobalList failed', e);
    return [];
  }
}

async function writeGlobalList(list: UserMovie[]) {
  try {
    await AsyncStorage.setItem(USER_MOVIES_ALL_KEY, JSON.stringify(list.slice(0, GLOBAL_LIMIT)));
  } catch (e) {
    console.warn('userMoviesStore writeGlobalList failed', e);
  }
}

export async function listUserMovies(userId: string) {
  return readList(userId);
}

export async function listAllUserMovies() {
  return readGlobalList();
}

export type CreateUserMovieInput = {
  title: string;
  description: string;
  posterUri?: string | null;
  trailerUrl?: string;
  genre?: string;
  year?: string;
  actors?: string[];
};

export async function addUserMovie(userId: string, payload: CreateUserMovieInput) {
  const list = await readList(userId);
  const next: UserMovie = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ownerId: userId,
    title: payload.title.trim(),
    description: payload.description.trim(),
    posterUri: payload.posterUri || null,
    trailerUrl: payload.trailerUrl?.trim(),
    genre: payload.genre?.trim(),
    year: payload.year?.trim(),
    actors: payload.actors?.map((a) => a.trim()).filter(Boolean),
    createdAt: Date.now(),
  };
  const nextList = [next, ...list];
  await writeList(userId, nextList);

  const global = await readGlobalList();
  const filtered = global.filter((movie) => movie.id !== next.id);
  await writeGlobalList([next, ...filtered]);

  return next;
}

export async function clearUserMovies(userId: string) {
  try {
    await AsyncStorage.removeItem(keyFor(userId));
  } catch (e) {
    console.warn('userMoviesStore clearUserMovies failed', e);
  }
}

export async function removeUserMovie(userId: string, movieId: string) {
  const list = await readList(userId);
  const nextList = list.filter((movie) => movie.id !== movieId);
  await writeList(userId, nextList);

  const global = await readGlobalList();
  const nextGlobal = global.filter((movie) => movie.id !== movieId);
  await writeGlobalList(nextGlobal);

  return nextList;
}

export async function searchUserMovies(term: string) {
  const list = await readGlobalList();
  const query = term.trim().toLowerCase();
  if (!query) return list;
  return list.filter((movie) => {
    const haystack = [
      movie.title,
      movie.description,
      movie.genre,
      movie.year,
      ...(movie.actors || []),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });
}

export default {
  listUserMovies,
  listAllUserMovies,
  addUserMovie,
  clearUserMovies,
  searchUserMovies,
  removeUserMovie,
};
