import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, Text, Image, TouchableOpacity, StyleSheet, Dimensions, GestureResponderEvent } from 'react-native';
import auth from './auth';
import { Movie, UserMovie } from './types';
import { useFocusEffect } from '@react-navigation/native';
import { IMAGE_URL } from '../constants/api';
import profileStore from './profileStore';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getUnreadCount } from './notificationsStore';
import { listUserMovies, removeUserMovie } from './userMoviesStore';

const WINDOW_WIDTH = Dimensions.get('window').width;

const resolvePosterUri = (path?: string | null) => {
  if (!path) return null;
  if (/^(https?:|file:|data:)/i.test(path)) return path;
  return IMAGE_URL + path;
};

type StatusBanner = { type: 'success' | 'info'; message: string } | null;

const ProfileScreen: React.FC<any> = ({ navigation }) => {
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [activeTab, setActiveTab] = useState<'favorites' | 'history' | 'downloads'>('favorites');
  const [history, setHistory] = useState<any[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [status, setStatus] = useState<StatusBanner>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userMovies, setUserMovies] = useState<UserMovie[]>([]);

  // load favorites for a specific user
  const loadFavoritesForUser = useCallback(async (userId?: string) => {
    try {
      if (!userId) return setFavorites([]);
      const arr = await profileStore.getFavorites(userId);
      // dedupe
      const map: Record<string, Movie> = {};
      for (const m of arr) {
        if (m && m.id != null) map[String(m.id)] = m;
      }
      setFavorites(Object.values(map));
    } catch (e) {
      console.warn('load favorites failed', e);
      setFavorites([]);
    }
  }, []);

  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(timer);
  }, [status]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        const u = await auth.getUser();
        if (mounted) setUser(u);
      })();
      return () => { mounted = false; };
    }, [])
  );

  const loadHistory = useCallback(async (userId?: string) => {
    try {
      if (!userId) return setHistory([]);
      const arr = await profileStore.getHistory(userId);
      setHistory(arr || []);
    } catch (e) {
      console.warn('load history failed', e);
      setHistory([]);
    }
  }, []);

  const loadDownloads = useCallback(async (userId?: string) => {
    try {
      if (!userId) return setDownloads([]);
      const arr = await profileStore.getDownloads(userId);
      setDownloads(arr || []);
    } catch (e) {
      console.warn('load downloads failed', e);
      setDownloads([]);
    }
  }, []);

  const refreshUnreadBadge = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (e) {
      console.warn('load unread count failed', e);
      setUnreadCount(0);
    }
  }, []);

  const handleRemoveFavorite = useCallback(async (movieId: number | string) => {
    if (!user) {
      setStatus({ type: 'info', message: 'Sign in to manage favorites.' });
      return;
    }
    try {
      const next = await profileStore.removeFavorite(user.email, movieId);
      if (Array.isArray(next)) {
        setFavorites(next.filter((m: any) => m && m.id != null));
        setStatus({ type: 'success', message: 'Removed from favorites.' });
      }
    } catch (e) {
      console.warn('remove favorite failed', e);
    }
  }, [user]);

  const handleRemoveDownload = useCallback(async (movieId: number) => {
    if (!user) {
      setStatus({ type: 'info', message: 'Sign in to manage downloads.' });
      return;
    }
    try {
      const next = await profileStore.removeDownload(user.email, movieId);
      if (Array.isArray(next)) {
        setDownloads(next);
        setStatus({ type: 'success', message: 'Removed from downloads.' });
      }
    } catch (e) {
      console.warn('remove download failed', e);
    }
  }, [user]);

  const handleRemoveUpload = useCallback(async (movieId: string) => {
    if (!user?.email) {
      setStatus({ type: 'info', message: 'Sign in to manage uploads.' });
      navigation.navigate('Login');
      return;
    }
    try {
      const next = await removeUserMovie(user.email, movieId);
      setUserMovies(next);
      setStatus({ type: 'success', message: 'Upload removed successfully.' });
    } catch (e) {
      console.warn('remove upload failed', e);
      setStatus({ type: 'info', message: 'Unable to remove upload right now.' });
    }
  }, [navigation, user]);

  const renderLibraryItem = useCallback((item: any, mode: 'favorites' | 'downloads') => {
    const removeAction = mode === 'favorites' ? handleRemoveFavorite : handleRemoveDownload;
    const chipStyle = mode === 'favorites' ? styles.removeChipFav : styles.removeChipDownload;
    const isFanFavorite = mode === 'favorites' && Boolean(item?.isFanUpload);
    const posterUri = isFanFavorite
      ? resolvePosterUri(item?.poster_path || item?.userMoviePayload?.posterUri)
      : resolvePosterUri(item?.poster_path);
    const handleCardPress = () => {
      if (isFanFavorite) {
        const payload: UserMovie = item.userMoviePayload || {
          id: String(item.id).replace('fan-', '') || String(item.id),
          ownerId: item.userMoviePayload?.ownerId || user?.email || 'fan',
          title: item.title,
          description: item.overview,
          posterUri: item.poster_path,
          trailerUrl: item.userMoviePayload?.trailerUrl,
          genre: item.userMoviePayload?.genre,
          year: item.userMoviePayload?.year,
          actors: item.userMoviePayload?.actors,
          createdAt: item.userMoviePayload?.createdAt || Date.now(),
        };
        navigation.navigate('Details', { userMovie: payload });
        return;
      }
      navigation.navigate('Details', { movieId: item.id });
    };
    return (
      <View style={styles.favThumbWrap}>
        <TouchableOpacity
          style={[styles.removeChipBase, chipStyle]}
          onPress={() => removeAction(item.id)}
          activeOpacity={0.85}
        >
          <Ionicons name="close" size={14} color="#fff" />
          <Text style={styles.removeChipText}>{mode === 'favorites' ? 'Favorite' : 'Download'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCardPress} style={styles.thumbPressArea}>
          {posterUri ? (
            <Image source={{ uri: posterUri }} style={styles.favThumb} />
          ) : (
            <View style={[styles.favThumb, styles.favThumbPlaceholder]}>
              <Ionicons name="image-outline" size={16} color="#94a3b8" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }, [handleRemoveDownload, handleRemoveFavorite, navigation, user]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        const u = await auth.getUser();
        if (!mounted) return;
        setUser(u);
        if (u) {
          await loadFavoritesForUser(u.email);
          await loadHistory(u.email);
          await loadDownloads(u.email);
          const uploads = await listUserMovies(u.email);
          setUserMovies(uploads);
        } else {
          setFavorites([]);
          setHistory([]);
          setDownloads([]);
          setUserMovies([]);
        }
        await refreshUnreadBadge();
      })();
      return () => { mounted = false; };
    }, [loadFavoritesForUser, loadHistory, loadDownloads, refreshUnreadBadge])
  );

  // Use a single FlatList as the root to avoid nesting VirtualizedLists inside a ScrollView
  return (
    <FlatList
      key={activeTab} // force remount when switching tabs (numColumns changes)
      data={activeTab === 'favorites' ? favorites : activeTab === 'history' ? history : downloads}
      keyExtractor={(item) => {
        if (activeTab === 'history') return `hist-${item.id}-${item.watchedAt || ''}`;
        if (activeTab === 'downloads') return `dl-${item.id}`;
        return `fav-${item.id}`;
      }}
      numColumns={activeTab === 'favorites' || activeTab === 'downloads' ? 3 : 1}
      columnWrapperStyle={activeTab === 'favorites' || activeTab === 'downloads' ? { justifyContent: 'space-between', paddingHorizontal: 12 } : undefined}
      contentContainerStyle={{ paddingBottom: 40 }}
      ListHeaderComponent={
        <>
          <View style={styles.headerWrap}>
            <View style={styles.headerTopRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle} activeOpacity={0.85}>
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>

              <View style={styles.headerActionsRow}>
                <TouchableOpacity
                  style={styles.notificationCircle}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('Notifications')}
                >
                  <Ionicons
                    name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
                    size={20}
                    color="#fff"
                  />
                  {unreadCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={async () => {
                    if (user) {
                      await auth.logout();
                      setUser(null);
                      setFavorites([]);
                      setHistory([]);
                      setDownloads([]);
                      setUserMovies([]);
                      setStatus({ type: 'success', message: 'Logged out successfully.' });
                      return;
                    }
                    setStatus({ type: 'info', message: 'Redirecting to login…' });
                    navigation.navigate('Login');
                  }}
                  style={[styles.authButton, user ? styles.logoutButton : styles.loginButton]}
                >
                  <Text style={styles.authButtonText}>{user ? 'Logout' : 'Login'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {status ? (
              <View style={[styles.statusBanner, status.type === 'success' ? styles.statusSuccess : styles.statusInfo]}>
                <Text style={styles.statusText}>{status.message}</Text>
              </View>
            ) : null}

            <View style={styles.profileCard}>
              <View style={styles.avatarWrap}>
                {user?.name || user?.email ? (
                  // show initials when no avatar
                  <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#ddd' }]}> 
                    <Text style={{ fontSize: 22, fontWeight: '700' }}>{(user?.name ? user.name.split(' ').map((s: string) => s[0]).join('').slice(0,2) : (user?.email ? user.email[0].toUpperCase() : '?'))}</Text>
                  </View>
                ) : (
                  <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#ddd' }]}>
                    <Text style={{ fontSize: 22, fontWeight: '700' }}>U</Text>
                  </View>
                )}
              </View>
              <Text style={styles.name}>{user?.name || 'Your Name'}</Text>
              <Text style={styles.contact}>{user?.email || 'You have not signed in'}</Text>

              <View style={styles.subscriptionCard}>
                <Text style={styles.subTitle}>1 Year of Unlimited Moviez</Text>
                <Text style={styles.subPrice}>Nu 50.00 / 1 Year</Text>
                <Text style={styles.subStatus}>Expired on 10/02/2030</Text>
              </View>

              <View style={styles.creatorCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.creatorTitle}>Showcase your movie</Text>
                  <Text style={styles.creatorSubtitle}>Upload posters, trailers, and full casts just like YouTube creators.</Text>
                </View>
                <TouchableOpacity
                  style={styles.creatorButton}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (!user) {
                      setStatus({ type: 'info', message: 'Sign in to publish your own movies.' });
                      navigation.navigate('Login');
                      return;
                    }
                    (async () => {
                      if (user?.email) {
                        const uploads = await listUserMovies(user.email);
                        setUserMovies(uploads);
                      }
                    })();
                    navigation.navigate('AddMovie');
                  }}
                >
                  <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {userMovies.length ? (
            <View style={styles.uploadsSection}>
              <Text style={styles.uploadsHeader}>Your uploads</Text>
              {userMovies.map((movie) => (
                <TouchableOpacity
                  key={movie.id}
                  style={styles.uploadRow}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('Details', { userMovie: movie })}
                >
                  {movie.posterUri ? (
                    <Image source={{ uri: movie.posterUri }} style={styles.uploadPoster} />
                  ) : (
                    <View style={[styles.uploadPoster, styles.uploadPosterPlaceholder]}>
                      <Ionicons name="image-outline" size={20} color="#94a3b8" />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.uploadTitle}>{movie.title}</Text>
                    <Text style={styles.uploadMeta}>{movie.genre || 'Genre not set'} • {movie.year || 'Year TBD'}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.uploadDeleteChip}
                    activeOpacity={0.8}
                    onPress={(event: GestureResponderEvent) => {
                      event.stopPropagation();
                      handleRemoveUpload(movie.id);
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#fff" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <View style={styles.tabRow}>
            <TouchableOpacity onPress={() => setActiveTab('history')} style={[styles.tab, activeTab === 'history' && styles.tabActive]}>
              <Text style={activeTab === 'history' ? styles.tabTextActive : styles.tabText}>Watch History</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('downloads')} style={[styles.tab, activeTab === 'downloads' && styles.tabActive]}>
              <Text style={activeTab === 'downloads' ? styles.tabTextActive : styles.tabText}>Downloaded</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('favorites')} style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}>
              <Text style={activeTab === 'favorites' ? styles.tabTextActive : styles.tabText}>Favorites</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{activeTab === 'favorites' ? 'My Favorites' : activeTab === 'history' ? 'Watch History' : 'Downloaded Movies'}</Text>
              {activeTab === 'history' && (
                <TouchableOpacity onPress={async () => {
                  if (!user) return alert('Sign in to clear history');
                  await profileStore.clearHistory(user.email);
                  setHistory([]);
                }} style={[styles.clearButton, styles.clearHistoryButton]}>
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                  <Text style={styles.clearText}>Clear History</Text>
                </TouchableOpacity>
              )}
              {activeTab === 'downloads' && (
                <TouchableOpacity onPress={async () => {
                  if (!user) return alert('Sign in to remove downloads');
                  await profileStore.clearDownloads(user.email);
                  setDownloads([]);
                }} style={[styles.clearButton, styles.clearDownloadsButton]}>
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                  <Text style={styles.clearText}>Remove Downloads</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </>
      }
      renderItem={({ item }) => {
        if (activeTab === 'history') {
          return (
            <TouchableOpacity onPress={() => navigation.navigate('Details', { movieId: item.id })} style={{ flexDirection: 'row', padding: 12, alignItems: 'center' }}>
              <Image source={{ uri: IMAGE_URL + item.poster_path }} style={{ width: 72, height: 108, borderRadius: 8, marginRight: 12 }} />
              <View>
                <Text style={{ fontWeight: '700' }}>{item.title}</Text>
                <Text style={{ color: '#666', marginTop: 6 }}>{new Date(item.watchedAt).toLocaleString()}</Text>
              </View>
            </TouchableOpacity>
          );
        }
        // favorites or downloads grid (no offline badge in profile)
        return renderLibraryItem(item, activeTab);
      }}
      ListEmptyComponent={<Text style={[styles.empty, { marginLeft: 12 }]}>{activeTab === 'favorites' ? 'No favorites yet' : activeTab === 'history' ? 'No watch history' : 'No downloaded movies'}</Text>}
    />
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7f5f2' },
  headerWrap: { padding: 16, paddingBottom: 8, paddingTop: 28 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  headerActionsRow: { flexDirection: 'row', alignItems: 'center', columnGap: 10 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fdba74',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  notificationCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#4338ca',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  authButton: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, minWidth: WINDOW_WIDTH * 0.28, alignItems: 'center' },
  loginButton: { backgroundColor: '#ff7e5f' },
  logoutButton: { backgroundColor: '#00c6a2' },
  authButtonText: { color: '#fff', fontWeight: '700' },
  profileCard: { alignItems: 'center', marginTop: 6 },
  avatarWrap: { marginTop: 8, marginBottom: 8 },
  avatar: { width: WINDOW_WIDTH * 0.22, height: WINDOW_WIDTH * 0.22, borderRadius: (WINDOW_WIDTH * 0.22) / 2, borderWidth: 3, borderColor: '#fff' },
  name: { fontSize: 20, fontWeight: '700', marginTop: 6 },
  contact: { color: '#666', marginTop: 6 },
  subscriptionCard: { backgroundColor: '#fff', padding: 12, marginTop: 12, borderRadius: 12, alignItems: 'center', width: '92%' },
  subTitle: { fontWeight: '700' },
  subPrice: { color: '#333', marginTop: 6 },
  subStatus: { color: '#d00', marginTop: 6, fontSize: 12 },
  creatorCard: { flexDirection: 'row', backgroundColor: '#111827', padding: 14, borderRadius: 16, marginTop: 16, width: '92%', columnGap: 12 },
  creatorTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  creatorSubtitle: { color: '#94a3b8', marginTop: 6 },
  creatorButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  uploadsSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  uploadsHeader: { fontWeight: '700', fontSize: 16, marginBottom: 10 },
  uploadRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, columnGap: 12 },
  uploadPoster: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#ddd' },
  uploadPosterPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
  uploadTitle: { fontWeight: '700', color: '#111' },
  uploadMeta: { color: '#666', marginTop: 4 },
  uploadDeleteChip: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 12, justifyContent: 'space-around' },
  tab: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20, backgroundColor: '#eee' },
  tabActive: { backgroundColor: '#6f42c1' },
  tabText: { color: '#333', fontWeight: '700' },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  sectionWrap: { paddingHorizontal: 12, marginTop: 16, marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  clearButton: { marginTop: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' },
  clearHistoryButton: { backgroundColor: '#f97316' },
  clearDownloadsButton: { backgroundColor: '#ef4444' },
  clearText: { color: '#fff', fontWeight: '700', fontSize: 13, marginLeft: 6 },
  empty: { color: '#666', marginTop: 12 },
  favThumbWrap: { width: (WINDOW_WIDTH - 64) / 3, height: ((WINDOW_WIDTH - 64) / 3) * 1.5, marginBottom: 14, position: 'relative' },
  thumbPressArea: { width: '100%', height: '100%' },
  favThumb: { width: '100%', height: '100%', borderRadius: 12, backgroundColor: '#ddd' },
  favThumbPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  removeChipBase: { position: 'absolute', top: 6, right: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' },
  removeChipFav: { backgroundColor: '#eab308' },
  removeChipDownload: { backgroundColor: '#f43f5e' },
  removeChipText: { color: '#fff', fontSize: 10, fontWeight: '700', marginLeft: 4 },
  statusBanner: { marginTop: 14, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  statusSuccess: { backgroundColor: '#e6fffa' },
  statusInfo: { backgroundColor: '#eef2ff' },
  statusText: { textAlign: 'center', fontWeight: '600', color: '#1a1a1a' },
});
