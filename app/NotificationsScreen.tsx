import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppNotification, getNotifications, markAllRead, clearNotifications } from './notificationsStore';
import { IMAGE_URL } from '../constants/api';

const timeAgo = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const NotificationsScreen: React.FC<any> = ({ navigation }) => {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    const list = await getNotifications();
    setItems(list);
  }, []);

  const hydrate = useCallback(async () => {
    await markAllRead();
    await loadNotifications();
  }, [loadNotifications]);

  useFocusEffect(
    useCallback(() => {
      hydrate();
    }, [hydrate])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  const clearAll = useCallback(async () => {
    await clearNotifications();
    setItems([]);
  }, []);

  const renderItem = ({ item }: { item: AppNotification }) => {
    const poster = item.poster_path ? `${IMAGE_URL}${item.poster_path}` : undefined;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => item.movieId && navigation.navigate('Details', { movieId: item.movieId })}
      >
        {poster ? (
          <Image source={{ uri: poster }} style={styles.poster} />
        ) : (
          <View style={[styles.poster, styles.posterPlaceholder]}>
            <Ionicons name="play" size={20} color="#fff" />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMessage}>{item.message}</Text>
          <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.clearButton} onPress={clearAll} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40, flexGrow: items.length ? 0 : 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyWrap}>
            <Ionicons name="notifications-off" size={40} color="#94a3b8" />
            <Text style={styles.emptyText}>You're all caught up! New movie alerts will appear here.</Text>
          </View>
        )}
      />
    </View>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    backgroundColor: '#020617',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1d4ed8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  clearText: { color: '#fff', fontWeight: '700', marginLeft: 6 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 16,
    padding: 12,
    columnGap: 12,
  },
  poster: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#1f2937' },
  posterPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  cardTitle: { color: '#fff', fontWeight: '700' },
  cardMessage: { color: '#cbd5f5', marginTop: 6 },
  cardTime: { color: '#94a3b8', marginTop: 8, fontSize: 12 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { color: '#94a3b8', textAlign: 'center', marginTop: 12, lineHeight: 20 },
});
