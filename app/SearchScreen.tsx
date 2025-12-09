import React, { useState, useCallback, useMemo } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet, Image, GestureResponderEvent } from 'react-native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { BASE_URL, API_KEY } from '../constants/api';
import MovieCard from '../components/MovieCard';
import { Movie, UserMovie } from './types';
import auth from './auth';
import { listAllUserMovies, searchUserMovies } from './userMoviesStore';

const LANGUAGE_RULES = [
  { regex: /(bhutan|bhutanese)/, params: { with_origin_country: 'BT' } },
  { regex: /(hindhi|hindi|bollywood)/, params: { with_original_language: 'hi' } },
  { regex: /(chinese|mandarin)/, params: { with_original_language: 'zh' } },
  { regex: /(kdrama|k-drama|korean)/, params: { with_original_language: 'ko' } },
  { regex: /(japanese|anime)/, params: { with_original_language: 'ja' } },
];

const GENRE_KEYWORDS: Record<string, string> = {
  action: '28',
  adventure: '12',
  comedy: '35',
  horror: '27',
  thriller: '53',
  drama: '18',
  romance: '10749',
  animation: '16',
  fantasy: '14',
  documentary: '99',
  scifi: '878',
  'sci-fi': '878',
  'science fiction': '878',
  crime: '80',
  mystery: '9648',
};

const YEAR_PATTERN = /(19|20)\d{2}/;

const buildDiscoverParams = (raw: string) => {
  const normalized = raw.toLowerCase();
  const params: Record<string, string> = { sort_by: 'popularity.desc' };
  let useDiscover = false;

  LANGUAGE_RULES.forEach((rule) => {
    if (rule.regex.test(normalized)) {
      Object.assign(params, rule.params);
      useDiscover = true;
    }
  });

  Object.entries(GENRE_KEYWORDS).forEach(([keyword, genreId]) => {
    if (normalized.includes(keyword)) {
      params.with_genres = genreId;
      useDiscover = true;
    }
  });

  const yearMatch = normalized.match(YEAR_PATTERN);
  if (yearMatch) {
    params.primary_release_year = yearMatch[0];
    useDiscover = true;
  }

  return { useDiscover, params };
};

const SearchScreen: React.FC<any> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [favoriteKeys, setFavoriteKeys] = useState<string[]>([]);
  const [mode, setMode] = useState<'all' | 'bhutan'>('all');
  const [bhutanMovies, setBhutanMovies] = useState<Movie[]>([]);
  const [bhutanLoading, setBhutanLoading] = useState(false);
  const [fanUploads, setFanUploads] = useState<UserMovie[]>([]);
  const [fanLoading, setFanLoading] = useState(false);
  const [userResults, setUserResults] = useState<UserMovie[]>([]);
  const buildFanFavoriteKey = useCallback((movie: UserMovie) => `fan-${movie.id}`, []);

  type SearchRow =
    | { kind: 'tmdb'; movie: Movie }
    | { kind: 'custom'; movie: UserMovie };

  const loadFavorites = useCallback(async () => {
    try {
      const user = await auth.getUser();
      if (!user) return setFavoriteKeys([]);
      const favs = await (await import('./profileStore')).getFavorites(user.email);
      const ids = (favs || []).map((f: any) => String(typeof f === 'number' ? f : f.id));
      setFavoriteKeys(ids);
    } catch (e) {
      console.warn('load favorites failed', e);
    }
  }, []);

  React.useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const fetchBhutanMovies = useCallback(async () => {
    try {
      setBhutanLoading(true);
      const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_origin_country=BT&sort_by=popularity.desc&page=1`;
      const res = await axios.get(url);
      setBhutanMovies(res.data.results || []);
    } catch (e) {
      console.warn('bhutan fetch failed', e);
    } finally {
      setBhutanLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBhutanMovies();
  }, [fetchBhutanMovies]);

  const refreshFanUploads = useCallback(async () => {
    try {
      setFanLoading(true);
      const all = await listAllUserMovies();
      setFanUploads(all || []);
    } catch (error) {
      console.warn('fan uploads fetch failed', error);
    } finally {
      setFanLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshFanUploads();
  }, [refreshFanUploads]);

  const searchMovies = async (text: string, options?: { skipQueryUpdate?: boolean }) => {
    if (!options?.skipQueryUpdate) setQuery(text);
    if (mode === 'bhutan') {
      setResults([]);
      setUserResults([]);
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      setResults([]);
      setUserResults([]);
      return;
    }

    const { useDiscover, params } = buildDiscoverParams(trimmed);

    try {
      const requestConfig = {
        params: {
          api_key: API_KEY,
          include_adult: 'false',
          page: '1',
          ...(useDiscover ? params : { query: trimmed }),
        },
      };

      const endpoint = useDiscover ? `${BASE_URL}/discover/movie` : `${BASE_URL}/search/movie`;
      const res = await axios.get(endpoint, requestConfig);
      setResults(res.data.results || []);
      const locals = await searchUserMovies(trimmed);
      setUserResults(locals);
    } catch (e) {
      console.warn('search failed', e);
    }
  };

  const filteredBhutan = useMemo(() => {
    if (!query.trim()) return bhutanMovies;
    const lower = query.toLowerCase();
    return bhutanMovies.filter((movie) => movie.title?.toLowerCase().includes(lower));
  }, [bhutanMovies, query]);

  const filteredFanUploads = useMemo(() => {
    if (!query.trim()) return fanUploads;
    const lower = query.toLowerCase();
    return fanUploads.filter((movie) => movie.title?.toLowerCase().includes(lower));
  }, [fanUploads, query]);

  const activeData: SearchRow[] = useMemo(() => {
    if (mode === 'bhutan') {
      return [
        ...filteredFanUploads.map<SearchRow>((movie) => ({ kind: 'custom', movie })),
        ...filteredBhutan.map<SearchRow>((movie) => ({ kind: 'tmdb', movie })),
      ];
    }
    return [
      ...userResults.map<SearchRow>((movie) => ({ kind: 'custom', movie })),
      ...results.map<SearchRow>((movie) => ({ kind: 'tmdb', movie })),
    ];
  }, [filteredBhutan, filteredFanUploads, mode, results, userResults]);

  const emptyMessage = useMemo(() => {
    if (mode === 'bhutan') {
      if (bhutanLoading || fanLoading) return 'Loading Bhutanese catalog…';
      if (!bhutanMovies.length && !fanUploads.length) return 'Bhutanese catalog is unavailable right now.';
      return 'No Bhutanese movies matched your search.';
    }

    if (!query.trim()) {
      return 'Start typing to explore worldwide movies.';
    }

    return 'No movies found. Try another title, language, genre, or year keyword.';
  }, [bhutanLoading, fanLoading, bhutanMovies.length, fanUploads.length, mode, query]);

  const handleModeChange = (nextMode: 'all' | 'bhutan') => {
    setMode(nextMode);
    if (nextMode === 'all' && query.trim().length) {
      searchMovies(query, { skipQueryUpdate: true });
    }
  };

  const syncFavoriteKeys = useCallback((favs?: any[] | null) => {
    setFavoriteKeys((favs || []).map((f: any) => String(typeof f === 'number' ? f : f.id)));
  }, []);

  const addToFavorites = async (movie: Movie) => {
    const logged = await auth.isLoggedIn();
    if (!logged) {
      navigation.navigate('Login', { returnAction: { type: 'favorite', movieId: movie.id, movie } });
      return;
    }
    try {
      const user = await auth.getUser();
      if (!user) {
        navigation.navigate('Login', { returnAction: { type: 'favorite', movieId: movie.id, movie } });
        return;
      }
      const favs = await (await import('./profileStore')).addFavorite(user.email, movie);
      syncFavoriteKeys(favs);
    } catch (e) {
      console.warn('add favorite failed', e);
    }
  };

  const addFanFavorite = async (movie: UserMovie) => {
    const logged = await auth.isLoggedIn();
    if (!logged) {
      navigation.navigate('Login');
      return;
    }
    try {
      const user = await auth.getUser();
      if (!user) {
        navigation.navigate('Login');
        return;
      }
      const payload = {
        id: buildFanFavoriteKey(movie),
        title: movie.title,
        overview: movie.description,
        poster_path: movie.posterUri || '',
        vote_average: 0,
        release_date: movie.year,
        isFanUpload: true,
        userMoviePayload: movie,
      };
      const favs = await (await import('./profileStore')).addFavorite(user.email, payload);
      syncFavoriteKeys(favs);
    } catch (e) {
      console.warn('add fan favorite failed', e);
    }
  };

  const renderActions = (movie: Movie) => {
    const key = String(movie.id);
    const isFav = favoriteKeys.includes(key);
    return (
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.watchButton]}
          onPress={async () => {
            const logged = await auth.isLoggedIn();
            if (!logged) {
              navigation.navigate('Login', { returnAction: { type: 'watch', movieId: movie.id } });
              return;
            }
            navigation.navigate('Details', { movieId: movie.id });
          }}
        >
          <Text style={styles.actionText}>Watch</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, isFav ? styles.favActive : styles.favInactive]}
          onPress={() => addToFavorites(movie)}
        >
          <Text style={styles.actionText}>{isFav ? 'Favorited' : 'Favorite'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.searchWrap}>
        <View style={styles.searchRow}>
          <TextInput
            placeholder="Search movies..."
            value={query}
            onChangeText={searchMovies}
            placeholderTextColor="#ddd"
            returnKeyType="search"
            onSubmitEditing={() => searchMovies(query)}
            style={styles.searchInput}
          />
          <TouchableOpacity
            style={styles.searchButton}
            activeOpacity={0.85}
            onPress={() => searchMovies(query)}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.modeToggle}>
          {(['all', 'bhutan'] as const).map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.toggleButton, mode === value && styles.toggleButtonActive]}
              onPress={() => handleModeChange(value)}
            >
              <Text style={[styles.toggleText, mode === value && styles.toggleTextActive]}>
                {value === 'all' ? 'All Movies' : 'Bhutanese' }
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <FlatList
        data={activeData}
        keyExtractor={(item) =>
          item.kind === 'tmdb' ? `tmdb-${item.movie.id}` : `custom-${item.movie.id}`
        }
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 12 }}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          item.kind === 'tmdb' ? (
            <MovieCard
              movie={item.movie}
              onPress={() => navigation.navigate('Details', { movieId: item.movie.id })}
              renderActions={renderActions(item.movie)}
            />
          ) : (
            <TouchableOpacity
              style={styles.customCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Details', { userMovie: item.movie })}
            >
              <LinearGradient colors={['#ff7e5f', '#feb47b']} style={styles.customPosterShell}>
                {item.movie.posterUri ? (
                  <Image source={{ uri: item.movie.posterUri }} style={styles.customPoster} />
                ) : (
                  <View style={[styles.customPoster, styles.customPosterPlaceholder]}>
                    <Text style={{ color: '#94a3b8', fontWeight: '700' }}>No poster</Text>
                  </View>
                )}
              </LinearGradient>
              <Text style={styles.customTitle} numberOfLines={2}>
                {item.movie.title}
              </Text>
              <Text style={styles.customMeta} numberOfLines={1}>
                {item.movie.genre || 'Genre TBD'} • {item.movie.year || 'Year TBD'}
              </Text>
              {item.movie.actors?.length ? (
                <Text style={styles.customActors} numberOfLines={2}>
                  {item.movie.actors.join(', ')}
                </Text>
              ) : null}
              <View style={styles.customBadge}>
                <Text style={styles.customBadgeText}>Fan Upload</Text>
              </View>
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.watchButton]}
                  onPress={() => navigation.navigate('Details', { userMovie: item.movie })}
                >
                  <Text style={styles.actionText}>Watch</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, favoriteKeys.includes(buildFanFavoriteKey(item.movie)) ? styles.favActive : styles.favInactive]}
                  onPress={(event: GestureResponderEvent) => {
                    event.stopPropagation();
                    addFanFavorite(item.movie);
                  }}
                >
                  <Text style={styles.actionText}>
                    {favoriteKeys.includes(buildFanFavoriteKey(item.movie)) ? 'Favorited' : 'Favorite'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )
        )}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7f5f2', paddingTop: 24 },
  searchWrap: { paddingHorizontal: 16, marginBottom: 12 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1d1d1d', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, columnGap: 10 },
  searchInput: { flex: 1, height: 46, color: '#fff', paddingHorizontal: 6 },
  searchButton: { backgroundColor: '#ff7e5f', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14 },
  searchButtonText: { color: '#fff', fontWeight: '700' },
  modeToggle: { flexDirection: 'row', marginTop: 10, backgroundColor: '#222', padding: 4, borderRadius: 16 },
  toggleButton: { flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: 'center' },
  toggleButtonActive: { backgroundColor: '#ffb703' },
  toggleText: { color: '#bbb', fontWeight: '600' },
  toggleTextActive: { color: '#111' },
  actionsRow: { flexDirection: 'row', width: 140, marginTop: 10, columnGap: 8 },
  actionButton: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  actionText: { fontSize: 12, fontWeight: '700', color: '#0f172a' },
  watchButton: { backgroundColor: '#00ffb2' },
  favActive: { backgroundColor: '#ffd166' },
  favInactive: { backgroundColor: '#e2e8f0' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#666', fontSize: 14 },
  customCard: {
    width: 140,
    borderRadius: 16,
    padding: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  customPosterShell: {
    width: 140,
    height: 210,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  customPoster: { width: '100%', height: '100%' },
  customPosterPlaceholder: {
    borderWidth: 1,
    borderColor: '#1f2937',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  customTitle: { color: '#0f172a', fontWeight: '700', textAlign: 'center' },
  customMeta: { color: '#475569', marginTop: 4, fontSize: 12, textAlign: 'center' },
  customActors: { color: '#64748b', marginTop: 6, fontSize: 11, textAlign: 'center' },
  customBadge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  customBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});

export default SearchScreen;
