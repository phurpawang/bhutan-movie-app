import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const KEY = 'BHUTAN_MOVIE_WATCHLIST';

export default function useWatchlist() {
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) setWatchlist(JSON.parse(raw));
      } catch (e) {
        console.warn('load watchlist failed', e);
      }
    })();
  }, []);

  const save = async (next) => {
    setWatchlist(next);
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('save watchlist failed', e);
    }
  };

  const add = async (id) => {
    if (watchlist.includes(id)) return;
    await save([...watchlist, id]);
  };

  const remove = async (id) => {
    await save(watchlist.filter((i) => i !== id));
  };

  const toggle = async (id) => {
    if (watchlist.includes(id)) await remove(id);
    else await add(id);
  };

  const contains = (id) => watchlist.includes(id);

  return { watchlist, add, remove, toggle, contains };
}
