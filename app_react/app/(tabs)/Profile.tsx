import Colors from '@/data/Colors';
import { mockCurrentUser, mockUserPhotos } from '@/utils/mockData';
import { Feather, Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const [viewerIndex, setViewerIndex] = useState<number | null>(null); // null = viewer closed

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

  const showPrev = () =>
    setViewerIndex((i) => (i == null ? i : (i - 1 + photos.length) % photos.length));
  const showNext = () =>
    setViewerIndex((i) => (i == null ? i : (i + 1) % photos.length));

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
    ? backend.bio || 'Add a bio to tell others about yourself.'
    : mockCurrentUser.bio;
  const interests: string[] = backend
    ? [
        ...(backend.interests ?? []),
        backend.religion,
        backend.relationship_status,
        ...(backend.other_languages ?? []),
      ].filter(Boolean)
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
            <Pressable onPress={() => photos.length > 0 && setViewerIndex(0)}>
              <Image source={{ uri: primaryPhoto }} style={styles.profileImage} />
            </Pressable>
            <Pressable
              style={styles.editPhotoButton}
              onPress={() => router.push('/(profile)/EditProfile')}
            >
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

            <Pressable
              style={styles.editProfileButton}
              onPress={() => router.push('/(profile)/EditProfile')}
            >
              <Feather name="edit-2" size={16} color={Colors.primary} />
              <Typography style={styles.editProfileText}>Edit Profile</Typography>
            </Pressable>
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

        <Pressable style={styles.prefCard} onPress={() => router.push('/(profile)/Preferences')}>
          <View style={styles.prefIcon}>
            <Ionicons name="options-outline" size={22} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Typography style={styles.prefTitle}>Dating Preferences</Typography>
            <Typography style={styles.prefSub}>Set who you want to meet & find matches</Typography>
          </View>
          <Feather name="chevron-right" size={22} color={Colors.gray} />
        </Pressable>

        <Pressable style={styles.prefCard} onPress={() => router.push('/(profile)/SetPassword')}>
          <View style={styles.prefIcon}>
            <Feather name="lock" size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Typography style={styles.prefTitle}>{backend?.has_password ? 'Change Password' : 'Set Password'}</Typography>
            <Typography style={styles.prefSub}>Log in with a password instead of OTP</Typography>
          </View>
          <Feather name="chevron-right" size={22} color={Colors.gray} />
        </Pressable>

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
              <Pressable key={index} style={styles.photoItem} onPress={() => setViewerIndex(index)}>
                <Image source={{ uri: url }} style={styles.photo} />
              </Pressable>
            ))}
            <Pressable
              style={[styles.photoItem, styles.addPhotoItem]}
              onPress={() => router.push('/(profile)/EditProfile')}
            >
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

      {/* Full-screen photo viewer */}
      <Modal
        visible={viewerIndex != null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerIndex(null)}
      >
        <View style={styles.viewerBackdrop}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.viewerHeader}>
              <Text style={styles.viewerCounter}>
                {viewerIndex != null ? `${viewerIndex + 1} / ${photos.length}` : ''}
              </Text>
              <Pressable style={styles.viewerClose} onPress={() => setViewerIndex(null)}>
                <Feather name="x" size={24} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.viewerBody}>
              {photos.length > 1 && (
                <Pressable style={[styles.navBtn, { left: 8 }]} onPress={showPrev}>
                  <Feather name="chevron-left" size={28} color="#fff" />
                </Pressable>
              )}
              {viewerIndex != null && (
                <Image
                  source={{ uri: photos[viewerIndex] }}
                  style={styles.viewerImage}
                  resizeMode="contain"
                />
              )}
              {photos.length > 1 && (
                <Pressable style={[styles.navBtn, { right: 8 }]} onPress={showNext}>
                  <Feather name="chevron-right" size={28} color="#fff" />
                </Pressable>
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
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
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  editProfileText: {
    color: Colors.primary,
    fontFamily: 'Inter-SemiBold',
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
  prefCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  prefIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.lightPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  prefSub: {
    fontSize: 12.5,
    color: Colors.darkGray,
    marginTop: 2,
  },
  // ---- full-screen photo viewer ----
  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  viewerCounter: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  viewerClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
