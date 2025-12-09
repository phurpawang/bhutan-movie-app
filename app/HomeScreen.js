import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import MovieCard from '../components/MovieCard';
import { TMDB_API_KEY, BASE_URL } from '../constants/api';

export default function HomeScreen({ navigation }) {
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const tRes = await fetch(`${BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}`);
      const tJson = await tRes.json();
      setTrending(tJson.results || []);

      const pRes = await fetch(`${BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=1`);
      const pJson = await pRes.json();
      setPopular(pJson.results || []);
    } catch (e) {
      console.warn('Failed to fetch movies', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#FF8A00" />;

  return (
    <FlatList
      data={popular}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={
        <View>
          <Text style={styles.sectionTitle}>Trending</Text>
          <FlatList
            data={trending}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <MovieCard movie={item} large onPress={() => navigation.navigate('Details', { id: item.id })} />}
            contentContainerStyle={{ paddingHorizontal: 12 }}
          />
          <Text style={styles.sectionTitle}>Popular</Text>
        </View>
      }
      renderItem={({ item }) => <MovieCard movie={item} onPress={() => navigation.navigate('Details', { id: item.id })} />}
      contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 8 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#FF8A00', marginLeft: 12, marginTop: 12 },
});
