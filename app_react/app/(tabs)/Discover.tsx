import Colors from "@/data/Colors";
import { mockProfiles } from "@/utils/mockData";
import { AntDesign, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Dimensions, PanResponder, Pressable, StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationContext";
import { api } from "../../lib/api";
import { useAppDispatch } from "../../store/hooks";
import { addMatch } from "../../store/slices/matchSlice";
import ProfileCard from "../components/ProfileCard";
import ProfileDetails from "../components/ProfileDetails";
import ActionButton from "../components/Shared/ActionButton";
import Typography from "../components/Shared/Typography";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
export default function Discover() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { authToken } = useRegistration();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  // Real candidates from the backend when logged in; mock data for dev preview.
  const [profiles, setProfiles] = useState<any[]>(mockProfiles);
  const [loading, setLoading] = useState(false);

  const loadDiscover = React.useCallback(() => {
    if (!authToken) return;
    setLoading(true);
    api
      .discover(authToken)
      .then((cards) => {
        setProfiles(cards);
        setCurrentIndex(0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authToken]);

  useEffect(() => {
    loadDiscover();
  }, [loadDiscover]);

  const position = useRef(new Animated.ValueXY()).current;

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH * 1.5, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => handleSwipeComplete("left"));
  };

  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH * 1.5, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => handleSwipeComplete("right"));
  };

  const handleSwipeComplete = (direction: any) => {
    const profile = profiles[currentIndex];
    position.setValue({ x: 0, y: 0 });
    setCurrentIndex((prevIndex) => prevIndex + 1);

    // Record the swipe on the backend (only for real candidates, not mock data).
    const isRealId = /^[a-f0-9]{24}$/i.test(String(profile?.id ?? ""));
    if (authToken && isRealId) {
      const action = direction === "right" ? "like" : "pass";
      api
        .swipe(profile.id, action, authToken)
        .then((res) => {
          if (res.matched && res.match) {
            dispatch(addMatch(res.match));
            Alert.alert("It's a match! 💕", `You and ${res.match.firstName ?? "someone"} liked each other.`);
          }
        })
        .catch(() => {});
    }
  };

   const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

    const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const nextCardOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [1, 0.5, 1],
    extrapolate: 'clamp',
  });

  const nextCardScale = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [1, 0.9, 1],
    extrapolate: 'clamp',
  });

   const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

    const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 4,
      useNativeDriver: false,
    }).start();
  };

  /** Follow the person shown in the details modal (mutual follow unlocks chat/call). */
  const followProfile = async (profile: any) => {
    if (!authToken || !profile?.id) return;
    try {
      const res = await api.follow(profile.id, authToken);
      setSelectedProfile((p: any) =>
        p && p.id === profile.id ? { ...p, is_following: true, is_friend: res?.is_friend } : p,
      );
      Alert.alert(
        res?.is_friend ? "You're now friends! 🎉" : "Followed ✅",
        res?.is_friend
          ? "You follow each other — chat & video call are unlocked."
          : `You are now following ${profile.firstName ?? "them"}.`,
      );
    } catch (e: any) {
      Alert.alert("Could not follow", e?.message ?? "Please try again.");
    }
  };

   const handleProfilePress = (profile:any) => {
    setSelectedProfile(profile);
  };

  const renderProfiles = () => {
    if (loading) {
      return (
        <View style={styles.endOfProfiles}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Typography style={styles.tryAgainText}>Finding people for you…</Typography>
        </View>
      );
    }

    if (currentIndex >= profiles.length) {
      return (
        <View style={styles.endOfProfiles}>
          <Typography variant="title" style={styles.endOfProfilesText}>
            No more profiles to show!
          </Typography>
          <Typography style={styles.tryAgainText}>
            Check back soon or adjust your preferences
          </Typography>
          <Pressable style={styles.prefBtn} onPress={() => router.push('/(profile)/Preferences')}>
            <Feather name="sliders" size={16} color="#fff" />
            <Typography style={styles.prefBtnText}>Adjust Preferences</Typography>
          </Pressable>
        </View>
      );
    }

    return profiles
      .slice(currentIndex, currentIndex + 2)
      .reverse()
      .map((profile, index) => {
        const isCurrentProfile =
          index ===
          profiles.slice(currentIndex, currentIndex + 2).length - 1;
        const animatedCardStyle = isCurrentProfile
          ? {
              transform: [
                { translateX: position.x },
                { translateY: position.y },
                { rotate },
              ],
              zIndex: 1,
            }
          : {
              opacity: nextCardOpacity,
              transform: [{ scale: nextCardScale }],
              zIndex: 0,
            };

        if (isCurrentProfile) {
          return (
            <Animated.View
              key={profile.id}
              style={[styles.animatedCard, animatedCardStyle]}
              {...panResponder.panHandlers}
            >
              <ProfileCard
                profile={profile}
                onPress={() => handleProfilePress(profile)}
              />
              <Animated.View
                style={[styles.likeIcon, { opacity: likeOpacity }]}
              >
                <Typography variant="action" style={styles.likeText}>
                  LIKE
                </Typography>
              </Animated.View>
              <Animated.View
                style={[styles.nopeIcon, { opacity: nopeOpacity }]}
              >
                <Typography variant="action" style={styles.nopeText}>
                  NOPE
                </Typography>
              </Animated.View>
            </Animated.View>
          );
        } else {
          return (
            <Animated.View
              key={profile.id}
              style={[styles.animatedCard, animatedCardStyle]}
            >
              <ProfileCard profile={profile} />
            </Animated.View>
          );
        }
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent={false}
        backgroundColor="#fff"
        barStyle="dark-content"
      />
      <View style={styles.header}>
        <Typography variant="title">Discover</Typography>
      </View>

      <View style={styles.cardContainer}>{renderProfiles()}</View>

      <View style={styles.actions}>
        <ActionButton
          icon={<Feather name="x" size={24} color="white" />}
          color={Colors.error}
          onPress={swipeLeft}
        />
        <ActionButton
          icon={<AntDesign name="star" size={24} color="white" />}
          color={Colors.secondary}
          size="medium"
          onPress={() => {}}
        />
        <ActionButton
          icon={<AntDesign name="heart" size={24} color="white" />}
          color={Colors.primary}
          onPress={swipeRight}
        />
      </View>

      {selectedProfile && (
        <ProfileDetails
          profile={selectedProfile}
          visible={!!selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onPass={swipeLeft}
          onLike={swipeRight}
          onFollow={() => followProfile(selectedProfile)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#f5f5f5",
    backgroundColor: "#fff",
  },
  header: {
    padding: 16,
    alignItems: "center",
  },
  cardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  animatedCard: {
    width: SCREEN_WIDTH * 0.9,
    height: "75%",
    position: "absolute",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    marginBottom: 8,
  },
  likeIcon: {
    position: "absolute",
    top: 50,
    right: 40,
    transform: [{ rotate: "20deg" }],
    padding: 10,
    borderWidth: 4,
    borderRadius: 10,
    borderColor: Colors.primary,
  },
  likeText: {
    color: Colors.primary,
    fontWeight: "bold",
    fontSize: 32,
  },
  nopeIcon: {
    position: "absolute",
    top: 50,
    left: 40,
    transform: [{ rotate: "-20deg" }],
    padding: 10,
    borderWidth: 4,
    borderRadius: 10,
    borderColor: Colors.error,
  },
  nopeText: {
    color: Colors.error,
    fontWeight: "bold",
    fontSize: 32,
  },
  endOfProfiles: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  endOfProfilesText: {
    marginBottom: 8,
  },
  tryAgainText: {
    color: Colors.GRAY,
    textAlign: "center",
    marginTop: 8,
  },
  prefBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  prefBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
});
