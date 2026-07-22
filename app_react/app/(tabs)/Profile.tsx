import Colors from '@/data/Colors';
import { mockCurrentUser, mockUserPhotos } from '@/utils/mockData';
import { Feather, Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRegistration } from '../../context/RegistrationContext';
import { api, type Reel } from '../../lib/api';
import { confirmAction } from '../../lib/confirm';
import { useAppDispatch } from '../../store/hooks';
import { setUser } from '../../store/slices/authSlice';
import ProfileSettingsModal from '../components/ProfileSettingsModal';
import AppHeader from '../components/Shared/AppHeader';
import Button from '../components/Shared/Button';
import PressableScale from '../components/Shared/PressableScale';
import Typography from '../components/Shared/Typography';

const GRID_GAP = 8;

type Tab = 'reels' | 'photos' | 'about';

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

/** Tappable stat tile — Reels / Followers / Following. */
function StatTile({
  icon,
  value,
  label,
  onPress,
}: {
  icon: any;
  value: number | string;
  label: string;
  onPress?: () => void;
}) {
  return (
    <PressableScale
      style={styles.stat}
      scaleTo={0.94}
      onPress={onPress}
      disabled={!onPress}
    >
      <Feather name={icon} size={15} color={Colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </PressableScale>
  );
}

/** One "label: value" row inside the About card. */
function DetailRow({ icon, label, value }: { icon: any; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Feather name={icon} size={16} color={Colors.primary} style={{ width: 22 }} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user: ctxUser, authToken, reset } = useRegistration();
  const dispatch = useAppDispatch();

  const [remote, setRemote] = useState<any | null>(ctxUser);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [myReels, setMyReels] = useState<Reel[]>([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [tab, setTab] = useState<Tab>('reels');

  const loadReels = () => {
    if (!authToken) return;
    api
      .myReels(authToken)
      .then((r) => setMyReels(r || []))
      .catch(() => { });
  };

  // My reels + follower counts.
  useEffect(() => {
    if (!authToken) return;
    loadReels();
    Promise.all([
      api.followers(authToken).catch(() => []),
      api.following(authToken).catch(() => []),
    ]).then(([f1, f2]) =>
      setCounts({ followers: f1?.length ?? 0, following: f2?.length ?? 0 }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  useEffect(() => {
    if (!authToken) return;
    api
      .me(authToken)
      .then((u) => {
        setRemote(u);
        dispatch(setUser(u));
      })
      .catch(() => { });
  }, [authToken, dispatch]);

  const openWebBrowser = async () => {
    if (Platform.OS !== 'web') {
      await WebBrowser.openBrowserAsync('https://www.example.com/upgrade');
    } else {
      window.open('https://www.example.com/upgrade', '_blank');
    }
  };

  const handleLogout = () =>
    confirmAction({
      title: 'Log out?',
      message: "You'll need to sign in again to use your account.",
      confirmLabel: 'Log out',
      successTitle: null, // we navigate away immediately
      onConfirm: () => {
        reset();
        router.replace('/landing');
      },
    });

  /** Camera icon on the avatar — pick, crop & upload a new profile photo. */
  const pickAndUploadPhoto = async () => {
    if (!authToken) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.9,
    });
    if (result.canceled) return;
    try {
      setUploadingPhoto(true);
      const urls = await api.uploadPhotos([result.assets[0].uri], authToken);
      const existing: string[] = (remote?.photos ?? []).map((p: any) => p.url);
      const updated = await api.updateProfile(
        { photos: [...urls, ...existing].slice(0, 6) },
        authToken,
      );
      setRemote(updated);
      dispatch(setUser(updated));
      Alert.alert('Photo updated ✅', 'This is now your profile picture.');
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  /** Camera icon on the banner — upload a wide cover image. */
  const pickAndUploadCover = async () => {
    if (!authToken) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.9,
    });
    if (result.canceled) return;
    try {
      setUploadingCover(true);
      const urls = await api.uploadPhotos([result.assets[0].uri], authToken);
      if (!urls.length) throw new Error('Upload failed');
      const updated = await api.updateProfile({ cover_url: urls[0] }, authToken);
      setRemote(updated);
      dispatch(setUser(updated));
      Alert.alert('Cover updated ✅', 'Your new cover photo is live.');
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Please try again.');
    } finally {
      setUploadingCover(false);
    }
  };

  const showPrev = () =>
    setViewerIndex((i) => (i == null ? i : (i - 1 + photos.length) % photos.length));
  const showNext = () => setViewerIndex((i) => (i == null ? i : (i + 1) % photos.length));

  const deleteReel = (reel: Reel) =>
    confirmAction({
      title: 'Delete this reel?',
      message: 'It will be removed from the feed and your profile.',
      successMessage: 'Your reel was deleted.',
      onConfirm: async () => {
        if (!authToken) return;
        await api.deleteReel(reel.id, authToken);
        setMyReels((prev) => prev.filter((r) => r.id !== reel.id));
      },
    });

  /** Remove one of my photos. */
  const deletePhoto = (index: number) =>
    confirmAction({
      title: 'Delete photo?',
      message: 'This photo will be removed from your profile.',
      successMessage: 'Photo deleted.',
      onConfirm: async () => {
        if (!authToken) return;
        const next = photos.filter((_, i) => i !== index);
        const updated = await api.updateProfile({ photos: next }, authToken);
        setRemote(updated);
        dispatch(setUser(updated));
        setViewerIndex(null);
      },
    });

  const backend = remote;
  const photos: string[] = backend?.photos?.length
    ? backend.photos.map((p: any) => p.url)
    : authToken
      ? []
      : mockUserPhotos.map((p) => p.url);
  const primaryPhoto: string | null = photos[0] ?? (authToken ? null : mockCurrentUser.photoUrl);
  const coverSource: string | null = backend?.cover_url ?? photos[1] ?? photos[0] ?? null;
  const firstName = backend?.first_name ?? mockCurrentUser.firstName;
  const lastName = backend?.last_name ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const age = ageFromDob(backend?.dob) ?? mockCurrentUser.age;
  const location = backend?.location ?? mockCurrentUser.location;
  const place = [backend?.address?.city, backend?.address?.state, backend?.address?.country]
    .filter(Boolean)
    .join(', ');
  const videoUrl: string | null = backend?.video_url ?? null;
  const bio = backend ? backend.bio || 'Add a bio to tell others about yourself.' : mockCurrentUser.bio;
  const languages = [backend?.mother_tongue, ...(backend?.other_languages ?? [])]
    .filter(Boolean)
    .join(', ');
  const weight = backend?.weight_kg ? `${backend.weight_kg} kg` : null;
  const interests: string[] = backend ? backend.interests ?? [] : mockCurrentUser.interests;

  return (
    <View style={styles.container}>
      <StatusBar translucent={false} backgroundColor="#fff" barStyle="dark-content" />

      <AppHeader
        title="Profile"
        onUploaded={loadReels}
        rightExtra={
          <Pressable style={styles.settingsButton} onPress={() => setSettingsVisible(true)}>
            <Ionicons name="settings-outline" size={23} color={Colors.text} />
          </Pressable>
        }
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* ---------- Cover banner ---------- */}
        <View style={styles.cover}>
          {!!coverSource && (
            <Image source={{ uri: coverSource }} style={styles.coverImg} blurRadius={10} />
          )}
          <LinearGradient
            colors={
              coverSource
                ? ['rgba(214,0,144,0.5)', 'rgba(123,47,247,0.7)']
                : [Colors.primary, '#7b2ff7']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Change cover */}
          <Pressable style={styles.coverBtn} onPress={pickAndUploadCover} disabled={uploadingCover}>
            {uploadingCover ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="image" size={13} color="#fff" />
                <Text style={styles.coverBtnText}>
                  {backend?.cover_url ? 'Change cover' : 'Add cover'}
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* ---------- Identity card ---------- */}
        <View style={styles.idCard}>
          <View style={styles.avatarWrap}>
            <Pressable onPress={() => photos.length > 0 && setViewerIndex(0)}>
              {primaryPhoto ? (
                <Image source={{ uri: primaryPhoto }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>
                    {(firstName || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              {uploadingPhoto && (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
            </Pressable>
            {/* Camera icon → new profile picture */}
            <Pressable
              style={styles.editPhotoButton}
              onPress={pickAndUploadPhoto}
              disabled={uploadingPhoto}
            >
              <Feather name="camera" size={16} color="white" />
            </Pressable>
          </View>

          <Text style={styles.name}>
            {fullName}
            {age ? `, ${age}` : ''}
          </Text>
          {!!(place || location) && (
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={13} color={Colors.darkGray} />
              <Text style={styles.locationText}>{place || location}</Text>
            </View>
          )}
          {!!backend?.occupation && <Text style={styles.occupation}>{backend.occupation}</Text>}
          <Text style={styles.bio}>{bio}</Text>

          {/* Stat tiles */}
          <View style={styles.statRow}>
            <StatTile icon="film" value={myReels.length} label="Reels" onPress={() => setTab('reels')} />
            <StatTile
              icon="users"
              value={counts.followers}
              label="Followers"
              onPress={() => router.push('/(profile)/Connections?tab=followers' as any)}
            />
            <StatTile
              icon="user-check"
              value={counts.following}
              label="Following"
              onPress={() => router.push('/(profile)/Connections?tab=following' as any)}
            />
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <PressableScale
              style={styles.editBtn}
              onPress={() => router.push('/(profile)/EditProfile')}
            >
              <Feather name="edit-2" size={15} color="#fff" />
              <Text style={styles.editBtnText}>Edit profile</Text>
            </PressableScale>
            <PressableScale
              style={styles.iconAction}
              onPress={() => router.push('/(profile)/Preferences')}
            >
              <Ionicons name="options-outline" size={19} color={Colors.primary} />
            </PressableScale>
            <PressableScale
              style={styles.iconAction}
              onPress={() => router.push('/(profile)/Likes' as any)}
            >
              <Feather name="heart" size={18} color={Colors.primary} />
            </PressableScale>
          </View>
        </View>

        {/* ---------- Segmented control ---------- */}
        <View style={styles.segment}>
          {(
            [
              { key: 'reels', label: 'Reels', icon: 'film' },
              { key: 'photos', label: 'Photos', icon: 'image' },
              { key: 'about', label: 'About', icon: 'info' },
            ] as const
          ).map((t) => (
            <PressableScale
              key={t.key}
              style={[styles.segmentBtn, tab === t.key && styles.segmentBtnActive]}
              scaleTo={0.95}
              onPress={() => setTab(t.key)}
            >
              <Feather name={t.icon} size={15} color={tab === t.key ? '#fff' : Colors.darkGray} />
              <Text style={[styles.segmentText, tab === t.key && styles.segmentTextActive]}>
                {t.label}
              </Text>
            </PressableScale>
          ))}
        </View>

        {/* ---------- Reels ---------- */}
        {tab === 'reels' &&
          (myReels.length === 0 ? (
            <View style={styles.emptyBox}>
              <Feather name="film" size={34} color={Colors.lightGray} />
              <Text style={styles.emptyText}>No reels yet</Text>
              <Text style={styles.emptySub}>Tap ＋ in the header to post one.</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {myReels.map((r) => (
                <Pressable
                  key={r.id}
                  style={styles.cell}
                  onPress={() => router.push('/(tabs)/Reels')}
                  onLongPress={() => deleteReel(r)}
                >
                  {r.thumbnail_url ? (
                    <Image source={{ uri: r.thumbnail_url }} style={styles.cellMedia} />
                  ) : (
                    <Video
                      source={{ uri: r.video_url }}
                      style={styles.cellMedia}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay={false}
                      isMuted
                    />
                  )}
                  <View style={styles.cellBadge}>
                    <Feather name="play" size={10} color="#fff" />
                    <Text style={styles.cellBadgeText}>{r.views}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ))}

        {/* ---------- Photos ---------- */}
        {tab === 'photos' && (
          <View style={styles.grid}>
            {photos.map((url, index) => (
              <Pressable key={index} style={styles.cell} onPress={() => setViewerIndex(index)}>
                <Image source={{ uri: url }} style={styles.cellMedia} />
              </Pressable>
            ))}
            <Pressable style={[styles.cell, styles.addCell]} onPress={pickAndUploadPhoto}>
              <Feather name="plus" size={26} color={Colors.primary} />
              <Text style={styles.addCellText}>Add</Text>
            </Pressable>
          </View>
        )}

        {/* ---------- About ---------- */}
        {tab === 'about' && (
          <View style={styles.aboutBody}>
            {!!videoUrl && (
              <Section title="My Video">
                <Video
                  source={{ uri: videoUrl }}
                  style={styles.video}
                  useNativeControls
                  resizeMode={ResizeMode.COVER}
                  isLooping
                />
              </Section>
            )}

            <Section title="Basics">
              <DetailRow icon="user" label="Gender" value={backend?.gender} />
              <DetailRow icon="heart" label="Status" value={backend?.relationship_status} />
              <DetailRow icon="target" label="Looking for" value={backend?.relationship_goal} />
              <DetailRow icon="trending-up" label="Height" value={backend?.height_label} />
              <DetailRow icon="activity" label="Weight" value={weight} />
              <DetailRow icon="droplet" label="Blood group" value={backend?.blood_group} />
            </Section>

            {(backend?.occupation || backend?.education) && (
              <Section title="Work & Education">
                <DetailRow icon="briefcase" label="Work" value={backend?.occupation} />
                <DetailRow icon="book-open" label="Education" value={backend?.education} />
              </Section>
            )}

            {(backend?.religion || languages || backend?.diet || backend?.smoking || backend?.drinking) && (
              <Section title="Lifestyle">
                <DetailRow icon="sunrise" label="Religion" value={backend?.religion} />
                <DetailRow icon="message-square" label="Languages" value={languages} />
                <DetailRow icon="coffee" label="Diet" value={backend?.diet} />
                <DetailRow icon="wind" label="Smoking" value={backend?.smoking} />
                <DetailRow icon="droplet" label="Drinking" value={backend?.drinking} />
              </Section>
            )}

            {interests.length > 0 && (
              <Section title="Interests">
                <View style={styles.chips}>
                  {interests.map((interest, index) => (
                    <View key={index} style={styles.chip}>
                      <Typography style={styles.chipText}>{interest}</Typography>
                    </View>
                  ))}
                </View>
              </Section>
            )}
          </View>
        )}

        {/* ---------- Account links ---------- */}
        <View style={styles.linkList}>
          <Pressable style={styles.linkRow} onPress={() => router.push('/(profile)/Connections' as any)}>
            <View style={styles.linkIcon}>
              <Feather name="users" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>My Connections</Text>
              <Text style={styles.linkSub}>People you follow & your followers</Text>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.gray} />
          </Pressable>

          <Pressable style={styles.linkRow} onPress={() => router.push('/(profile)/SetPassword')}>
            <View style={styles.linkIcon}>
              <Feather name="lock" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>
                {backend?.has_password ? 'Change Password' : 'Set Password'}
              </Text>
              <Text style={styles.linkSub}>Log in with a password instead of OTP</Text>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.gray} />
          </Pressable>
        </View>

        <View style={styles.upgradeCard}>
          <Typography style={styles.upgradeTitle}>Upgrade to Premium</Typography>
          <Typography style={styles.upgradeText}>
            Get unlimited likes, see who likes you, and more!
          </Typography>
          <Button text="Upgrade Now" onPress={openWebBrowser} />
        </View>

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
              <View style={styles.viewerActions}>
                {viewerIndex != null && !!authToken && (
                  <Pressable style={styles.viewerClose} onPress={() => deletePhoto(viewerIndex)}>
                    <Feather name="trash-2" size={22} color="#ff6b6b" />
                  </Pressable>
                )}
                <Pressable style={styles.viewerClose} onPress={() => setViewerIndex(null)}>
                  <Feather name="x" size={24} color="#fff" />
                </Pressable>
              </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f8' },
  settingsButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1 },

  // ---- cover ----
  cover: {
    height: 150,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: Colors.primary,
  },
  coverImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  coverBtn: {
    position: 'absolute',
    right: 14,
    top: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    minWidth: 96,
    justifyContent: 'center',
  },
  coverBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // ---- identity card ----
  idCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -58,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingBottom: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  avatarWrap: { marginTop: -44 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#eee',
  },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.lightPrimary },
  avatarInitial: { fontSize: 36, fontWeight: '800', color: Colors.primary },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
  },

  name: { fontSize: 20, fontWeight: '800', color: Colors.text, marginTop: 10, textAlign: 'center' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  locationText: { color: Colors.darkGray, fontSize: 13 },
  occupation: { color: Colors.text, fontSize: 13.5, marginTop: 6, fontWeight: '600' },
  bio: { color: Colors.darkGray, fontSize: 13.5, lineHeight: 20, marginTop: 8, textAlign: 'center' },

  // ---- stat tiles ----
  statRow: { flexDirection: 'row', gap: 8, marginTop: 16, alignSelf: 'stretch' },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: '#faf7fb',
    borderWidth: 1,
    borderColor: '#f0ecf3',
  },
  statValue: { fontSize: 17, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 11.5, color: Colors.darkGray },

  // ---- actions ----
  actionRow: { flexDirection: 'row', gap: 9, marginTop: 14, alignSelf: 'stretch' },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  editBtnText: { color: '#fff', fontWeight: '700', fontSize: 14.5 },
  iconAction: {
    width: 48,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ---- segmented control ----
  segment: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 5,
    borderRadius: 16,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
  },
  segmentBtnActive: { backgroundColor: Colors.primary },
  segmentText: { fontSize: 13.5, fontWeight: '600', color: Colors.darkGray },
  segmentTextActive: { color: '#fff', fontWeight: '700' },

  // ---- grids ----
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  cell: {
    width: '31.5%',
    aspectRatio: 0.74,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#ececed',
  },
  cellMedia: { width: '100%', height: '100%' },
  cellBadge: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cellBadgeText: { color: '#fff', fontSize: 10.5, fontWeight: '600' },
  addCell: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.lightPrimary,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addCellText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
  emptyBox: { alignItems: 'center', paddingVertical: 42, gap: 8 },
  emptyText: { color: Colors.gray, fontSize: 14, fontWeight: '600' },
  emptySub: { color: Colors.gray, fontSize: 12.5 },

  // ---- about ----
  aboutBody: { paddingHorizontal: 16 },
  section: { marginTop: 18 },
  sectionTitle: { fontSize: 15.5, fontWeight: '700', color: Colors.text, marginBottom: 9 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  detailLabel: { fontSize: 13.5, color: Colors.darkGray, width: 96 },
  detailValue: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: '500' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: Colors.lightPrimary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18 },
  chipText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  video: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#000' },

  // ---- account links ----
  linkList: { marginTop: 20, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  linkIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.lightPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTitle: { fontSize: 14.5, fontWeight: '600', color: Colors.text },
  linkSub: { fontSize: 12, color: Colors.darkGray, marginTop: 2 },

  upgradeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 6,
  },
  upgradeTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  upgradeText: { fontSize: 13, color: Colors.darkGray, textAlign: 'center', marginBottom: 8 },
  footer: { padding: 16, paddingBottom: 34 },

  // ---- full-screen photo viewer ----
  viewerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  viewerCounter: { color: '#fff', fontSize: 14, fontWeight: '600' },
  viewerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  viewerClose: { padding: 6 },
  viewerBody: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  viewerImage: { width: '100%', height: '80%' },
  navBtn: {
    position: 'absolute',
    top: '50%',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
