import React, { useState } from 'react';
import { View, TextInput, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import MovieCard from '../components/MovieCard';
import { TMDB_API_KEY, BASE_URL } from '../constants/api';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async (text) => {
    setQuery(text);
    if (!text) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(text)}`);
      const json = await res.json();
      setResults(json.results || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchBox}>
        <TextInput value={query} onChangeText={search} placeholder="Search movies..." style={styles.input} returnKeyType="search" />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#FF8A00" />
      ) : (
        <FlatList data={results} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => <MovieCard movie={item} onPress={() => navigation.navigate('Details', { id: item.id })} />} contentContainerStyle={{ padding: 12 }} showsVerticalScrollIndicator={false} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: { padding: 12, backgroundColor: '#fff8f0' },
  input: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: '#f0c090' },
});
