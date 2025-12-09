import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IMAGE_URL } from '../constants/api';

const { width } = Dimensions.get('window');

export default function MovieCard({ movie, large, onPress }) {
  const cardWidth = large ? Math.min(width * 0.74, 360) : Math.min(width * 0.44, 180);
  return (
    <TouchableOpacity activeOpacity={0.9} style={[styles.container, { width: cardWidth }]} onPress={onPress}>
      <LinearGradient colors={['#FFD89B', '#FF8A00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.gradient, large ? styles.gradientLarge : styles.gradientSmall]}>
        <Image source={movie.poster_path ? { uri: IMAGE_URL + movie.poster_path } : undefined} style={[styles.image, large ? styles.imageLarge : styles.imageSmall]} resizeMode="cover" />
      </LinearGradient>
      <View style={styles.info}>
        <Text numberOfLines={2} style={[styles.title, large ? styles.titleLarge : null]}>{movie.title}</Text>
        <Text style={styles.vote}>⭐ {movie.vote_average?.toFixed(1)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 10, marginHorizontal: 8, alignItems: 'center' },
  gradient: { borderRadius: 14, overflow: 'hidden', backgroundColor: '#fff' },
  gradientLarge: { padding: 6 },
  gradientSmall: { padding: 4 },
  image: { borderRadius: 10, backgroundColor: '#eee' },
  imageLarge: { width: '100%', height: 260 },
  imageSmall: { width: '100%', height: 210 },
  info: { width: '100%', paddingTop: 8, alignItems: 'center' },
  title: { fontSize: 14, fontWeight: '700', textAlign: 'center', color: '#2b2b2b' },
  titleLarge: { fontSize: 16 },
  vote: { marginTop: 4, color: '#6b6b6b' },
});
