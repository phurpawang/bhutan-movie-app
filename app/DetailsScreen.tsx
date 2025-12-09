import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Image,
  ImageBackground,
  StyleSheet,
  FlatList,
} from 'react-native';
import axios from 'axios';
import YoutubePlayer from 'react-native-youtube-iframe';
import auth from './auth';
import profileStore from './profileStore';
import { BASE_URL, API_KEY, IMAGE_URL } from '../constants/api';
import { MovieDetail, UserMovie } from './types';
import Ionicons from '@expo/vector-icons/Ionicons';

const extractYouTubeId = (url?: string | null) => {
  if (!url) return null;
  const trimmed = url.trim();
  const directMatch = trimmed.match(/^[A-Za-z0-9_-]{11}$/);
  if (directMatch) return directMatch[0];
  const regex = /(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/;
  const match = trimmed.match(regex);
  return match && match[1] ? match[1] : null;
};

const { width } = Dimensions.get('window');

type DetailsRouteParams = {
  movieId?: number;
  userMovie?: UserMovie;
  playTrailerKey?: string;
  returnAction?: any;
  autoFavorite?: boolean;
};

const DetailsScreen: React.FC<{ route: { params: DetailsRouteParams }, navigation: any }> = ({ route, navigation }) => {
  const { movieId, userMovie } = route.params || {};
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [playing, setPlaying] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState<string | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const isUserMovie = Boolean(userMovie);

  const persistDownload = useCallback(async () => {
    if (!movie || isUserMovie) return false;
    const user = await auth.getUser();
    if (!user) return false;
    await profileStore.addDownload(user.email, {
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
    });
    setIsDownloaded(true);
    return true;
  }, [isUserMovie, movie]);

  const fetchDetails = useCallback(async () => {
    if (!movieId) return;
    try {
      const res = await axios.get(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=videos`);
      setMovie(res.data);
    } catch (e) {
      console.warn('fetch movie failed', e);
    }
  }, [movieId]);

  useEffect(() => {
    if (userMovie) {
      const trailerKey = extractYouTubeId(userMovie.trailerUrl);
      setSelectedTrailer(trailerKey);
      setPlaying(false);
      setMovie({
        id: userMovie.createdAt || Date.now(),
        title: userMovie.title,
        overview: userMovie.description,
        poster_path: userMovie.posterUri || '',
        backdrop_path: userMovie.posterUri || undefined,
        vote_average: 0,
        release_date: userMovie.year,
      } as MovieDetail);
      return;
    }
    setSelectedTrailer(null);
    setPlaying(false);
    fetchDetails();
  }, [fetchDetails, userMovie]);

  useEffect(() => {
    if (isUserMovie) return;
    // If we returned from Login with an instruction to play a trailer, do it
    const params = route.params || {};
    const playKey = params.playTrailerKey || params.returnAction?.playTrailerKey;
    if (playKey) {
      setSelectedTrailer(playKey);
      setPlaying(true);
    }

    // autoFavorite support: if Login returned with a favorite action, perform it
    (async () => {
      try {
        if (params.autoFavorite || params.returnAction?.type === 'favorite') {
          if (movie) await saveFavorite();
        }
        // auto-download after login
        if (params.returnAction?.type === 'download') {
          if (movie) await persistDownload();
        }
      } catch (e) {
        console.warn('auto action failed', e);
      }
    })();
  }, [isUserMovie, movie, persistDownload, route.params]);

  useEffect(() => {
    if (isUserMovie) {
      setIsFavorite(false);
      setIsDownloaded(false);
      return;
    }
    (async () => {
      try {
        const user = await auth.getUser();
        if (!user) {
          setIsFavorite(false);
        } else {
          const favs = await (await import('./profileStore')).getFavorites(user.email);
          const exists = favs.find((f: any) => (typeof f === 'number' ? f === movieId : f.id === movieId));
          setIsFavorite(Boolean(exists));
          const downloads = await profileStore.getDownloads(user.email);
          const downloaded = downloads.find((item: any) => item?.id === movieId);
          setIsDownloaded(Boolean(downloaded));
        }
      } catch (e) {
        console.warn('check favorite failed', e);
      }
    })();
  }, [isUserMovie, movieId]);

  const saveFavorite = async () => {
    if (!movie || isUserMovie) return;
    const user = await auth.getUser();
    if (!user) {
      const targetId = movieId ?? movie.id;
      if (!targetId) return;
      navigation.navigate('Login', { returnAction: { type: 'favorite', movieId: targetId, movie } });
      return;
    }
    try {
      await (await import('./profileStore')).addFavorite(user.email, movie);
      setIsFavorite(true);
    } catch (e) {
      console.warn('save favorite failed', e);
    }
  };

  const removeFavorite = async () => {
    if (isUserMovie) return;
    const user = await auth.getUser();
    if (!user) {
      const targetId = movieId ?? movie?.id;
      if (!targetId) return;
      navigation.navigate('Login', { returnScreen: 'Details', params: { movieId: targetId } });
      return;
    }
    try {
      await (await import('./profileStore')).removeFavorite(user.email, movie.id);
      setIsFavorite(false);
    } catch (e) {
      console.warn('remove favorite failed', e);
    }
  };

  const toggleFavorite = async () => {
    if (isUserMovie) return;
    if (isFavorite) await removeFavorite();
    else await saveFavorite();
  };

  const handleDownloadPress = async () => {
    if (!movie || isUserMovie) return;
    const logged = await auth.isLoggedIn();
    if (!logged) {
      const targetId = movieId ?? movie.id;
      if (!targetId) return;
      navigation.navigate('Login', { returnAction: { type: 'download', movieId: targetId, movie } });
      return;
    }
    try {
      setDownloadBusy(true);
      const success = await persistDownload();
      if (!success) {
        console.warn('Download skipped: missing user context');
      }
    } catch (e) {
      console.warn('download failed', e);
    } finally {
      setDownloadBusy(false);
    }
  };

  const handlePlayerStateChange = useCallback((state: string) => {
    if (state === 'playing') {
      setPlaying(true);
    }
    if (state === 'paused' || state === 'ended') {
      setPlaying(false);
    }
  }, []);

  const bannerUri = movie
    ? isUserMovie
      ? movie.poster_path || null
      : movie.backdrop_path || movie.poster_path
        ? IMAGE_URL + (movie.backdrop_path || movie.poster_path)
        : null
    : null;
  const posterSource = movie?.poster_path
    ? isUserMovie
      ? { uri: movie.poster_path }
      : { uri: IMAGE_URL + movie.poster_path }
    : null;
  const releaseYear = isUserMovie ? userMovie?.year || 'Year TBD' : movie?.release_date?.slice(0, 4);
  const overviewText = movie?.overview || 'No synopsis provided for this title.';

  if (!movie) return <Text>Loading...</Text>;

  const trailers = !isUserMovie ? movie.videos?.results.filter((v: any) => v.site === 'YouTube') || [] : [];

  const videoHeight = width * 0.56;

  return (
    <ScrollView style={{ flex: 1 }}>
      {/* Banner area or video player */}
      <View style={[styles.videoShell, { height: videoHeight }] }>
        {selectedTrailer ? (
          <View style={styles.videoPlayer}>
            <YoutubePlayer
              height={videoHeight}
              play={playing}
              videoId={selectedTrailer}
              onChangeState={handlePlayerStateChange}
            />
          </View>
        ) : bannerUri ? (
          <ImageBackground
            source={{ uri: bannerUri }}
            style={styles.bannerImage}
            imageStyle={styles.bannerImageInner}
          >
            {!isUserMovie && (
              <View style={styles.bannerActions}>
                <TouchableOpacity onPress={toggleFavorite} style={styles.heartButton}>
                  <Text style={{ fontSize: 18 }}>{isFavorite ? '❤' : '♡'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={handleDownloadPress}
                  activeOpacity={0.85}
                  disabled={downloadBusy}
                >
                  <View style={[styles.downloadIcon, isDownloaded && styles.downloadIconActive]}>
                    <Ionicons
                      name={isDownloaded ? 'checkmark-done' : 'download-outline'}
                      color={isDownloaded ? '#0f172a' : '#fff'}
                      size={22}
                    />
                  </View>
                  <Text style={[styles.downloadLabel, isDownloaded && styles.downloadLabelActive]}>
                    {isDownloaded ? 'Downloaded' : downloadBusy ? 'Downloading…' : 'Download'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ImageBackground>
        ) : (
          <View style={[styles.bannerImage, styles.bannerFallback]}>
            <Ionicons name="image-outline" size={28} color="#94a3b8" />
            <Text style={styles.bannerFallbackText}>No poster yet</Text>
          </View>
        )}
      </View>

      <View style={styles.container}>
        <View style={styles.row}>
          {posterSource ? (
            <Image source={posterSource} style={styles.poster} />
          ) : (
            <View style={[styles.poster, styles.posterPlaceholder]}>
              <Ionicons name="image-outline" size={20} color="#94a3b8" />
            </View>
          )}
          <View style={{ marginLeft: 12, justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}>
              {isUserMovie ? (
                <View style={styles.fanBadge}>
                  <Text style={styles.fanBadgeText}>Fan Upload</Text>
                </View>
              ) : (
                <Text style={styles.rating}>⭐ {movie.vote_average?.toFixed(1)}</Text>
              )}
              {releaseYear ? <Text style={styles.year}>{releaseYear}</Text> : null}
            </View>
            <Text style={{ marginTop: 8, color: '#999', maxWidth: width - 200 }}>
              {isUserMovie ? 'Uploaded on Bhutan Movie App' : (movie as any).tagline ?? ''}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Overview</Text>
        <Text style={styles.overview}>{overviewText}</Text>

        {isUserMovie && (
          <View style={styles.fanMetaCard}>
            <Text style={styles.fanMetaLine}>{userMovie?.genre || 'Genre TBD'} • {releaseYear}</Text>
            {userMovie?.actors?.length ? (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Cast</Text>
                <Text style={styles.fanActors}>{userMovie.actors.join(', ')}</Text>
              </>
            ) : null}
            {!selectedTrailer && (
              <View style={styles.fanMetaNote}>
                <Ionicons name="alert-circle" size={16} color="#ea580c" />
                <Text style={styles.fanMetaNoteText}>Add a trailer link to stream this upload inside the app.</Text>
              </View>
            )}
          </View>
        )}

        {!isUserMovie && trailers.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Trailers</Text>
            <FlatList
              data={trailers}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(t: any, idx: number) => `tr-${t.id || t.key}-${idx}`}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={styles.trailerItem}
                  onPress={async () => {
                        const logged = await auth.isLoggedIn();
                        if (!logged) {
                          navigation.navigate('Login', { returnAction: { type: 'playTrailer', movieId, playTrailerKey: item.key } });
                          return;
                        }
                        setSelectedTrailer(item.key);
                        setPlaying(true);
                        // record watch history
                        try {
                          const user = await auth.getUser();
                          if (user) await profileStore.addHistory(user.email, { id: movie.id, title: movie.title, poster_path: movie.poster_path, trailerKey: item.key });
                        } catch (e) {
                          console.warn('record history failed', e);
                        }
                  }}
                >
                  <Image source={{ uri: `https://img.youtube.com/vi/${item.key}/mqdefault.jpg` }} style={styles.trailerThumb} />
                  <Text style={styles.trailerLabel}>Trailer {index + 1}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        <View style={{ height: 50 }} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 12 },
  videoShell: { marginHorizontal: 12, marginTop: 12, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' },
  videoPlayer: { flex: 1, width: '100%', overflow: 'hidden', borderRadius: 16 },
  bannerImage: { flex: 1 },
  bannerImageInner: { borderRadius: 16 },
  bannerActions: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 12,
    flexDirection: 'row',
  },
  heartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  downloadButton: {
    alignItems: 'center',
  },
  downloadIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadIconActive: {
    backgroundColor: '#a7f3d0',
  },
  downloadLabel: {
    marginTop: 6,
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  downloadLabelActive: {
    color: '#a7f3d0',
  },
  row: { flexDirection: 'row', marginTop: -40, paddingHorizontal: 12 },
  poster: { width: 100, height: 150, borderRadius: 8, backgroundColor: '#222' },
  posterPlaceholder: { justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#475569', borderStyle: 'dashed' },
  rating: { fontSize: 18, fontWeight: '700', marginRight: 12 },
  year: { color: '#999' },
  sectionTitle: { marginTop: 16, fontWeight: '700', fontSize: 16 },
  overview: { marginTop: 8, color: '#444', lineHeight: 20 },
  trailerItem: { marginRight: 12, width: 140 },
  trailerThumb: { width: 140, height: 80, borderRadius: 8, backgroundColor: '#000' },
  trailerLabel: { marginTop: 6, fontSize: 12, color: '#333' },
  fanBadge: { backgroundColor: '#0f172a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  fanBadgeText: { color: '#e2e8f0', fontWeight: '700', fontSize: 12 },
  fanMetaCard: { marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: '#f1f5f9' },
  fanMetaLine: { color: '#475569', fontWeight: '600' },
  fanActors: { marginTop: 8, color: '#1e293b', lineHeight: 20 },
  fanMetaNote: { flexDirection: 'row', alignItems: 'center', columnGap: 6, marginTop: 16, backgroundColor: '#fff7ed', padding: 10, borderRadius: 10 },
  fanMetaNoteText: { color: '#9a3412', flex: 1, fontSize: 13 },
  bannerFallback: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617', borderRadius: 16 },
  bannerFallbackText: { color: '#94a3b8', marginTop: 6, fontSize: 12 },
});

export default DetailsScreen;
