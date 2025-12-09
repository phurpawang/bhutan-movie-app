import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { IMAGE_URL } from '../constants/api';
import { Movie } from '../app/types';

interface Props {
  movie: Movie;
  onPress?: () => void;
  renderActions?: React.ReactNode;
  horizontal?: boolean; // compact horizontal card for carousels
}

const MovieCard: React.FC<Props> = ({ movie, onPress, renderActions, horizontal }) => {
  const resolvePosterUri = (path?: string) => {
    if (!path) return null;
    if (/^(https?:|file:|data:)/i.test(path)) return path;
    return IMAGE_URL + path;
  };

  const posterUri = resolvePosterUri(movie.poster_path);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <LinearGradient
        colors={['#ff7e5f', '#feb47b']}
        style={styles.gradient}
      >
        {posterUri ? (
          <Image
            source={{ uri: posterUri }}
            style={horizontal ? styles.imageHorizontal : styles.image}
          />
        ) : (
          <View style={[horizontal ? styles.imageHorizontal : styles.image, styles.imagePlaceholder]} />
        )}
      </LinearGradient>
      <Text style={horizontal ? styles.titleHorizontal : styles.title} numberOfLines={2}>{movie.title}</Text>
      {horizontal && movie.release_date && (
        <Text style={styles.yearText}>{movie.release_date.slice(0,4)}</Text>
      )}
      {renderActions}
    </TouchableOpacity>
  );
};

export default MovieCard;

const styles = StyleSheet.create({
  card: { marginBottom: 20, alignItems: 'center', marginHorizontal: 6 },
  gradient: {
    borderRadius: 12,
    overflow: 'hidden',
    width: 140,
    height: 210,
    marginBottom: 8,
  },
  image: { width: '100%', height: '100%', borderRadius: 12 },
  imageHorizontal: { width: '100%', height: '100%', borderRadius: 8 },
  imagePlaceholder: { backgroundColor: '#0f172a' },
  title: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', width: 140 },
  titleHorizontal: { fontSize: 13, fontWeight: '700', textAlign: 'center', width: 120 },
  yearText: { fontSize: 12, color: '#999', marginTop: 4 },
});
