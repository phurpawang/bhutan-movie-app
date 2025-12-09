import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import MovieCard from '../components/MovieCard';
import useWatchlist from '../hooks/useWatchlist';
import { TMDB_API_KEY, BASE_URL } from '../constants/api';

export default function ProfileScreen({ navigation }) {
  const { watchlist } = useWatchlist();
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    const fetchWatchlistMovies = async () => {
      try {
        const requests = watchlist.map((id) =>
          fetch(`${BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}`).then((r) => r.json())
        );
        const results = await Promise.all(requests);
        setMovies(results);
      } catch (e) {
        console.warn('fetch watchlist movies', e);
      }
    };
    fetchWatchlistMovies();
  }, [watchlist]);

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.title}>My Watchlist</Text>
      {movies.length === 0 ? (
        <Text style={{ padding: 12 }}>No saved movies yet.</Text>
      ) : (
        <FlatList data={movies} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => <MovieCard movie={item} onPress={() => navigation.navigate('Details', { id: item.id })} />} contentContainerStyle={{ padding: 12 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: '#FF8A00', padding: 12 },
});
