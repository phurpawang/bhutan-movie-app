import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TextInput,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  ViewStyle,
} from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MovieCard from "../components/MovieCard";
import AppLogo from "../components/AppLogo";
import { API_KEY, BASE_URL, IMAGE_URL } from "../constants/api";
import { syncNewMovieNotifications, getUnreadCount } from "./notificationsStore";

const { width } = Dimensions.get("window");

const CATEGORIES = [
  "All",
  "Fantasy",
  "SCI-FI",
  "Action",
  "Drama",
  "Comedy",
  "Horror",
  "Animation",
  "Thriller",
];

const CATEGORY_GENRE_MAP: Record<string, number> = {
  Fantasy: 14,
  "SCI-FI": 878,
  Action: 28,
  Drama: 18,
  Comedy: 35,
  Horror: 27,
  Animation: 16,
  Thriller: 53,
};

export default function HomeScreen({ navigation }) {
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [unreadCount, setUnreadCount] = useState(0);

  const bannerRef = useRef<FlatList<any> | null>(null);
  const { width: screenWidth } = useWindowDimensions();

  const gridColumns = useMemo(() => {
    if (screenWidth >= 1400) return 6;
    if (screenWidth >= 1100) return 5;
    if (screenWidth >= 900) return 4;
    if (screenWidth >= 650) return 3;
    return 2;
  }, [screenWidth]);

  const columnWrapperStyle = useMemo<ViewStyle>(() => ({
    justifyContent: gridColumns > 2 ? 'flex-start' : 'space-between',
  }), [gridColumns]);

  const refreshUnreadBadge = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (e) {
      console.warn('Failed to load unread notifications', e);
    }
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);

      const tRes = await fetch(
        `${BASE_URL}/trending/movie/week?api_key=${API_KEY}`
      );
      const tJson = await tRes.json();
      setTrending(tJson?.results || []);

      const pRes = await fetch(
        `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=1`
      );
      const pJson = await pRes.json();
      setPopular(pJson?.results || []);

      // also fetch top rated
      const tRes2 = await fetch(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&page=1`);
      const tJson2 = await tRes2.json();
      setTopRated && setTopRated(tJson2?.results || []);

      const combinedPool = [
        ...(tJson?.results || []),
        ...(pJson?.results || []),
        ...(tJson2?.results || []),
      ];
      const uniqueMovies: any[] = [];
      const seenIds = new Set<number>();
      combinedPool.forEach((movie) => {
        if (movie?.id && !seenIds.has(movie.id)) {
          seenIds.add(movie.id);
          uniqueMovies.push(movie);
        }
      });
      await syncNewMovieNotifications(uniqueMovies);
      await refreshUnreadBadge();
    } catch (e) {
      console.warn("Error fetching movies:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshUnreadBadge();
    }, [refreshUnreadBadge])
  );

  const filterMovies = (list: any[] = []) => {
    if (activeCategory === "All") return list;
    const genreId = CATEGORY_GENRE_MAP[activeCategory];
    if (!genreId) return list;
    return list.filter(
      (movie) => Array.isArray(movie?.genre_ids) && movie.genre_ids.includes(genreId)
    );
  };

  const filteredTrending = useMemo(() => filterMovies(trending), [trending, activeCategory]);
  const filteredPopular = useMemo(() => filterMovies(popular), [popular, activeCategory]);
  const filteredTopRated = useMemo(() => filterMovies(topRated), [topRated, activeCategory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00FFAA" />
      </View>
    );
  }

  const renderBanner = ({ item }: any) => {
    const img = item.backdrop_path || item.poster_path;
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.bannerItem}
        onPress={() => navigation.navigate("Details", { movieId: item.id })}
      >
        <Image
          source={{ uri: IMAGE_URL + img }}
          style={styles.bannerImage}
          resizeMode="cover"
        />
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerTitle} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const itemWidth = 140;
  const itemSpacing = 16;

  return (
    <FlatList
      data={filteredPopular}
      keyExtractor={(item) => `popular-${item.id}`}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: gridColumns > 2 ? 24 : 12 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListHeaderComponent={
        <View>
          {/* Logo + Search bar */}
          <View style={styles.headerTop}>
            <View style={styles.logoRow}>
              <AppLogo size={60} tagline="Stream Bhutan & world cinema" tone="light" />
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => navigation.navigate('Notifications')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
                  size={24}
                  color="#fff"
                />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.searchRow}>
              <TextInput
                placeholder="Search movies, shows..."
                placeholderTextColor="#bbb"
                style={styles.searchInput}
                returnKeyType="search"
                onFocus={() => navigation.navigate('Search')}
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => navigation.navigate('Search')}
              >
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Carousel Banner */}
          <View style={styles.bannerWrap}>
            <FlatList
              ref={bannerRef}
              data={filteredPopular.slice(0, 6)}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(b) => `banner-${b.id}`}
              renderItem={renderBanner}
              decelerationRate="fast"
              snapToInterval={width * 0.88}
              snapToAlignment="center"
              contentContainerStyle={{ paddingHorizontal: width * 0.06 }}
            />
          </View>

          {/* Categories */}
          <View style={{ marginTop: 12 }}>
            <FlatList
              data={CATEGORIES}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(c) => `cat-${c}`}
              contentContainerStyle={{ paddingHorizontal: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setActiveCategory(item)}
                  style={[
                    styles.categoryChip,
                    activeCategory === item && styles.categoryActive,
                  ]}
                >
                  <Text
                    style={
                      activeCategory === item
                        ? styles.categoryTextActive
                        : styles.categoryText
                    }
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Trending Now */}
          <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
          <FlatList
            data={filteredTrending}
            horizontal
            keyExtractor={(i) => `trending-${i.id}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingRow}
            renderItem={({ item }) => (
              <MovieCard
                movie={item}
                onPress={() =>
                  navigation.navigate("Details", { movieId: item.id })
                }
              />
            )}
            snapToInterval={itemWidth + itemSpacing}
            decelerationRate="fast"
            snapToAlignment="start"
            style={{ paddingLeft: 12 }}
          />

          {/* Popular horizontal */}
          <Text style={styles.sectionTitle}>Popular Movies</Text>
          <FlatList
            data={filteredPopular}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(i) => `popular-h-${i.id}`}
            renderItem={({ item }) => (
              <MovieCard movie={item} onPress={() => navigation.navigate('Details', { movieId: item.id })} horizontal />
            )}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            snapToInterval={140 + 12}
            decelerationRate="fast"
          />

          {/* Top rated horizontal */}
          <Text style={styles.sectionTitle}>Top Rated Movies</Text>
          <FlatList
            data={filteredTopRated}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(i) => `top-h-${i.id}`}
            renderItem={({ item }) => (
              <MovieCard movie={item} onPress={() => navigation.navigate('Details', { movieId: item.id })} horizontal />
            )}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, paddingBottom: 12 }}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            snapToInterval={140 + 12}
            decelerationRate="fast"
          />
        </View>
      }
      renderItem={({ item }) => (
        <MovieCard
          movie={item}
          onPress={() => navigation.navigate('Details', { movieId: item.id })}
        />
      )}
      numColumns={gridColumns}
      columnWrapperStyle={columnWrapperStyle}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No movies found</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTop: { paddingHorizontal: 12, paddingVertical: 10, paddingTop: 28 },
  logoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notificationButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    paddingHorizontal: 4,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b1b1b',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    columnGap: 10,
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#fff',
    paddingHorizontal: 12,
  },
  searchButton: {
    backgroundColor: '#00FFAA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchButtonText: { color: '#111', fontWeight: '700' },
  bannerWrap: { marginTop: 10 },
  bannerItem: { width: width * 0.88, height: width * 0.5, marginRight: 12, borderRadius: 12, overflow: 'hidden' },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: { position: 'absolute', left: 12, bottom: 12 },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginLeft: 12,
  },

  trendingRow: {
    paddingHorizontal: 0,
    paddingVertical: 10,
  },

  rowBetween: {
    marginTop: 18,
    marginBottom: 4,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  viewAll: {
    color: "#00FFAA",
    fontSize: 14,
    fontWeight: "600",
  },

  emptyText: {
    textAlign: "center",
    color: "gray",
    marginTop: 20,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#2b2b2b',
    marginRight: 10,
  },
  categoryActive: { backgroundColor: '#00FFAA' },
  categoryText: { color: '#fff', fontWeight: '600' },
  categoryTextActive: { color: '#000', fontWeight: '700' },
});
