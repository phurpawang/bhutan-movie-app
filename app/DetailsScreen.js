import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { TMDB_API_KEY, BASE_URL, IMAGE_URL } from '../constants/api';
import { WebView } from 'react-native-webview';
import useWatchlist from '../hooks/useWatchlist';

const { width } = Dimensions.get('window');

export default function DetailsScreen({ route }) {
  const id = route?.params?.id;
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toggle, contains } = useWatchlist();

  useEffect(() => {
    if (!id) return;
    const fetchMovie = async () => {
      try {
        const res = await fetch(`${BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=videos`);
        const data = await res.json();
        setMovie(data);
      } catch (e) {
        console.warn('details fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchMovie();
  }, [id]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#FF8A00" />;
  if (!movie) return <Text style={{ padding: 12 }}>Movie not found.</Text>;

  const trailerKey = movie.videos?.results?.find((v) => v.site === 'YouTube')?.key;
  const embedUrl = trailerKey ? `https://www.youtube.com/embed/${trailerKey}` : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Image source={movie.poster_path ? { uri: IMAGE_URL + movie.poster_path } : undefined} style={styles.poster} resizeMode="cover" />
      <View style={styles.meta}>
        <Text style={styles.title}>{movie.title}</Text>
        <Text style={styles.sub}>⭐ {movie.vote_average} • {movie.release_date || ''}</Text>

        <TouchableOpacity onPress={() => toggle(movie.id)} style={[styles.watchlistBtn, contains(movie.id) ? styles.watchlistActive : styles.watchlistIdle]}>
          <Text style={styles.watchlistText}>{contains(movie.id) ? 'Remove from Watchlist' : 'Add to Watchlist'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Overview</Text>
      <Text style={styles.overview}>{movie.overview}</Text>

      <Text style={styles.sectionTitle}>Trailer</Text>
      {embedUrl ? (
        <View style={{ width: '100%', height: (width * 9) / 16 }}>
          <WebView source={{ uri: embedUrl }} style={{ flex: 1 }} />
        </View>
      ) : (
        <Text style={{ color: '#666', marginHorizontal: 12 }}>Trailer not available.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  poster: { width: '100%', height: 420 },
  meta: { padding: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#FF8A00' },
  sub: { color: '#666', marginTop: 6 },
  sectionTitle: { marginTop: 12, marginHorizontal: 12, fontSize: 18, fontWeight: '700', color: '#333' },
  overview: { marginHorizontal: 12, marginTop: 6, lineHeight: 20, color: '#333' },
  watchlistBtn: { marginTop: 10, padding: 10, borderRadius: 10, alignItems: 'center' },
  watchlistIdle: { backgroundColor: '#FF8A00' },
  watchlistActive: { backgroundColor: '#777' },
  watchlistText: { color: '#fff', fontWeight: '700' },
});
