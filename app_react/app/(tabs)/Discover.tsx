import Colors from "@/data/Colors";
import { mockProfiles } from "@/utils/mockData";
import { AntDesign, Feather } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { Animated, Dimensions, PanResponder, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfileCard from "../components/ProfileCard";
import ProfileDetails from "../components/ProfileDetails";
import ActionButton from "../components/Shared/ActionButton";
import Typography from "../components/Shared/Typography";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
export default function Discover() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState(null);

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
    position.setValue({ x: 0, y: 0 });
    setCurrentIndex((prevIndex) => prevIndex + 1);
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

   const handleProfilePress = (profile:any) => {
    setSelectedProfile(profile);
  };

  const renderProfiles = () => {
    if (currentIndex >= mockProfiles.length) {
      return (
        <View style={styles.endOfProfiles}>
          <Typography variant="title" style={styles.endOfProfilesText}>
            No more profiles to show!
          </Typography>
          <Typography style={styles.tryAgainText}>
            Check back soon or adjust your preferences
          </Typography>
        </View>
      );
    }

    return mockProfiles
      .slice(currentIndex, currentIndex + 2)
      .reverse()
      .map((profile, index) => {
        const isCurrentProfile =
          index ===
          mockProfiles.slice(currentIndex, currentIndex + 2).length - 1;
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
          icon={<AntDesign name="staro" size={24} color="white" />}
          color={Colors.secondary}
          size="medium"
          onPress={() => {}}
        />
        <ActionButton
          icon={<AntDesign name="hearto" size={24} color="white" />}
          color={Colors.primary}
          onPress={swipeRight}
        />
      </View>

      {selectedProfile && (
        <ProfileDetails
          profile={selectedProfile}
          visible={!!selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  },
});
