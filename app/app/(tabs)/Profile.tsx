import Colors from '@/data/Colors';
import { mockCurrentUser, mockUserPhotos } from '@/utils/mockData';
import { Feather, Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRegistration } from '../../context/RegistrationContext';
import { api } from '../../lib/api';
import ProfileSection from '../components/ProfileSection';
import ProfileSettingsModal from '../components/ProfileSettingsModal';
import Button from '../components/Shared/Button';
import Typography from '../components/Shared/Typography';

function ageFromDob(dob?: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user: ctxUser, authToken, reset } = useRegistration();
  const [remote, setRemote] = useState<any | null>(ctxUser);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Refresh the profile from the backend whenever we have an auth token.
  useEffect(() => {
    if (!authToken) return;
    api.me(authToken).then(setRemote).catch(() => {});
  }, [authToken]);

  const openWebBrowser = async () => {
    if (Platform.OS !== 'web') {
      await WebBrowser.openBrowserAsync('https://www.example.com/upgrade');
    } else {
      window.open('https://www.example.com/upgrade', '_blank');
    }
  };

  const handleLogout = () => {
    reset();
    router.replace('/landing');
  };

  // ---- View model: real user when available, else mock (dev preview) ----
  const backend = remote;
  const photos: string[] = backend?.photos?.length
    ? backend.photos.map((p: any) => p.url)
    : mockUserPhotos.map((p) => p.url);
  const primaryPhoto = photos[0] ?? mockCurrentUser.photoUrl;
  const firstName = backend?.first_name ?? mockCurrentUser.firstName;
  const age = ageFromDob(backend?.dob) ?? mockCurrentUser.age;
  const location = backend?.location ?? mockCurrentUser.location;
  const videoUrl: string | null = backend?.video_url ?? null;
  const bio = backend
    ? backend.relationship_goal || 'Add a bio to tell others about yourself.'
    : mockCurrentUser.bio;
  const interests: string[] = backend
    ? [backend.religion, backend.relationship_status, backend.mother_tongue, ...(backend.other_languages ?? [])].filter(
        Boolean,
      )
    : mockCurrentUser.interests;
  const stats = mockCurrentUser.stats; // matches/likes not yet implemented in the backend

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Typography variant="title">Profile</Typography>
        <Pressable style={styles.settingsButton} onPress={() => setSettingsVisible(true)}>
          <Ionicons name="settings-outline" size={24} color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image source={{ uri: primaryPhoto }} style={styles.profileImage} />
            <Pressable style={styles.editPhotoButton}>
              <Feather name="camera" size={20} color="white" />
            </Pressable>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Typography variant="title" style={styles.profileName}>
                {firstName}
                {age ? `, ${age}` : ''}
              </Typography>
            </View>
            {!!location && <Typography style={styles.profileLocation}>{location}</Typography>}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Typography variant="stat">{stats.matches}</Typography>
              <Typography variant="statLabel">Matches</Typography>
            </View>
            <View style={styles.statItem}>
              <Typography variant="stat">{stats.likes}</Typography>
              <Typography variant="statLabel">Likes</Typography>
            </View>
            <View style={styles.statItem}>
              <Typography variant="stat">{stats.profileViews}</Typography>
              <Typography variant="statLabel">Profile Views</Typography>
            </View>
          </View>
        </View>

        <View style={styles.upgradeCard}>
          <Typography style={styles.upgradeTitle}>Upgrade to Premium</Typography>
          <Typography style={styles.upgradeText}>
            Get unlimited likes, see who likes you, and more!
          </Typography>
          <Button text="Upgrade Now" onPress={openWebBrowser} />
        </View>

        {!!videoUrl && (
          <ProfileSection title="My Video">
            <Video
              source={{ uri: videoUrl }}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.COVER}
              isLooping
            />
          </ProfileSection>
        )}

        <ProfileSection title="About Me">
          <Typography style={styles.aboutText}>{bio}</Typography>
        </ProfileSection>

        <ProfileSection title="My Photos">
          <View style={styles.photoGrid}>
            {photos.map((url, index) => (
              <Pressable key={index} style={styles.photoItem}>
                <Image source={{ uri: url }} style={styles.photo} />
              </Pressable>
            ))}
            <Pressable style={[styles.photoItem, styles.addPhotoItem]}>
              <Feather name="camera" size={32} color={Colors.lightGray} />
            </Pressable>
          </View>
        </ProfileSection>

        {interests.length > 0 && (
          <ProfileSection title="My Details">
            <View style={styles.interestsContainer}>
              {interests.map((interest, index) => (
                <View key={index} style={styles.interestBadge}>
                  <Typography style={styles.interestText}>{interest}</Typography>
                </View>
              ))}
            </View>
          </ProfileSection>
        )}

        <View style={styles.footer}>
          <Button text="Logout" variant="outline" onPress={handleLogout} />
        </View>
      </ScrollView>

      <ProfileSettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  settingsButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileName: {
    marginRight: 8,
  },
  profileLocation: {
    color: Colors.darkGray,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 24,
    width: '100%',
    paddingHorizontal: 32,
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  upgradeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  upgradeTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    marginBottom: 8,
  },
  upgradeText: {
    textAlign: 'center',
    marginBottom: 16,
    color: Colors.darkGray,
  },
  video: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    backgroundColor: '#000',
  },
  aboutText: {
    lineHeight: 22,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  photoItem: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 4,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  addPhotoItem: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  interestBadge: {
    backgroundColor: Colors.lightPrimary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
  },
  interestText: {
    color: Colors.primary,
    fontSize: 14,
  },
  footer: {
    padding: 16,
    marginBottom: 16,
  },
});
