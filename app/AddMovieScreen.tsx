import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';
import auth from './auth';
import { addUserMovie } from './userMoviesStore';
import { BACKEND_API_URL } from '../constants/api';

const fieldSpacing = 14;

const AddMovieScreen: React.FC<any> = ({ navigation }) => {
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [posterUri, setPosterUri] = useState<string | null>(null);
  const [trailer, setTrailer] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [actors, setActors] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const hydrate = useCallback(async () => {
    setCheckingAuth(true);
    const current = await auth.getUser();
    setUser(current);
    setCheckingAuth(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      hydrate();
    }, [hydrate])
  );

  const pickPoster = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permission to upload posters.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) {
      setPosterUri(result.assets[0]?.uri || null);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPosterUri(null);
    setTrailer('');
    setGenre('');
    setYear('');
    setActors('');
  };

  const handleSubmit = async () => {
    if (!user?.email) {
      setStatus({ type: 'info', message: 'Please sign in to submit your movie.' });
      navigation.navigate('Login');
      return;
    }
    if (!title.trim() || !description.trim()) {
      setStatus({ type: 'error', message: 'Title and description are required.' });
      return;
    }
    setSaving(true);
    try {
      const actorsList = actors.split(',').map((a) => a.trim()).filter(Boolean);
      const payload = {
        userId: user.id || user.email,
        title,
        description,
        posterUri,
        trailerUrl: trailer,
        genre,
        year,
        actors: actorsList,
      };

      try {
        await axios.post(`${BACKEND_API_URL}/users/movies`, payload);
      } catch (networkError) {
        console.warn('backend save failed, falling back to local', networkError);
        await addUserMovie(user.email, {
          title,
          description,
          posterUri,
          trailerUrl: trailer,
          genre,
          year,
          actors: actorsList,
        });
      }

      setStatus({ type: 'success', message: 'Movie added successfully! It now appears in Search.' });
      resetForm();
    } catch (e) {
      console.warn('add movie failed', e);
      setStatus({ type: 'error', message: 'Unable to save your movie. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(null), 4500);
    return () => clearTimeout(timer);
  }, [status]);

  if (checkingAuth) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Your Movie</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.gateWrap}>
          <Ionicons name="lock-closed" size={32} color="#f97316" />
          <Text style={styles.gateTitle}>Sign in to upload</Text>
          <Text style={styles.gateSubtitle}>
            You need a Bhutan Movie account before sharing posters, trailers, and cast info.
          </Text>
          <TouchableOpacity
            style={styles.gateButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.gateButtonText}>Login / Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Your Movie</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {status ? (
          <View
            style={[
              styles.statusBanner,
              status.type === 'success'
                ? styles.statusSuccess
                : status.type === 'error'
                ? styles.statusError
                : styles.statusInfo,
            ]}
          >
            <Text style={styles.statusText}>{status.message}</Text>
          </View>
        ) : null}
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Movie title</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Enter movie title" style={styles.input} placeholderTextColor="#94a3b8" />

          <Text style={[styles.label, { marginTop: fieldSpacing }]}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add a short synopsis"
            style={[styles.input, styles.multiline]}
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
          />

          <Text style={[styles.label, { marginTop: fieldSpacing }]}>Poster image</Text>
          <TouchableOpacity style={styles.posterPicker} onPress={pickPoster} activeOpacity={0.85}>
            {posterUri ? (
              <Image source={{ uri: posterUri }} style={styles.posterPreview} />
            ) : (
              <View style={styles.posterPlaceholder}>
                <Ionicons name="image" size={26} color="#64748b" />
                <Text style={styles.posterText}>Upload poster</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={[styles.label, { marginTop: fieldSpacing }]}>YouTube trailer link</Text>
          <TextInput value={trailer} onChangeText={setTrailer} placeholder="https://youtube.com/watch?v=..." style={styles.input} placeholderTextColor="#94a3b8" autoCapitalize="none" />

          <Text style={[styles.label, { marginTop: fieldSpacing }]}>Genre</Text>
          <TextInput value={genre} onChangeText={setGenre} placeholder="Drama, Comedy, etc" style={styles.input} placeholderTextColor="#94a3b8" />

          <Text style={[styles.label, { marginTop: fieldSpacing }]}>Year</Text>
          <TextInput value={year} onChangeText={setYear} placeholder="2025" style={styles.input} placeholderTextColor="#94a3b8" keyboardType="number-pad" />

          <Text style={[styles.label, { marginTop: fieldSpacing }]}>Actors (comma separated)</Text>
          <TextInput value={actors} onChangeText={setActors} placeholder="Actor 1, Actor 2" style={styles.input} placeholderTextColor="#94a3b8" />

          <TouchableOpacity style={[styles.submitButton, saving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={saving} activeOpacity={0.85}>
            <Text style={styles.submitText}>{saving ? 'Saving…' : 'Submit movie'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default AddMovieScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#020617' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
    paddingTop: 48,
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
  form: { padding: 16, paddingBottom: 80 },
  label: { color: '#cbd5f5', fontWeight: '700', marginBottom: 6 },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
  },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  posterPicker: { marginTop: 4 },
  posterPreview: { width: '100%', height: 200, borderRadius: 16 },
  posterPlaceholder: { width: '100%', height: 200, borderRadius: 16, borderWidth: 1, borderColor: '#1f2937', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  posterText: { color: '#94a3b8', marginTop: 8 },
  statusBanner: { marginHorizontal: 16, marginTop: 8, borderRadius: 12, padding: 12 },
  statusText: { color: '#0f172a', fontWeight: '700', textAlign: 'center' },
  statusSuccess: { backgroundColor: '#bbf7d0' },
  statusError: { backgroundColor: '#fecaca' },
  statusInfo: { backgroundColor: '#bfdbfe' },
  submitButton: { backgroundColor: '#f97316', paddingVertical: 14, borderRadius: 16, marginTop: 24, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  gateWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, rowGap: 12 },
  gateTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  gateSubtitle: { color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
  gateButton: { backgroundColor: '#2563eb', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999 },
  gateButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
