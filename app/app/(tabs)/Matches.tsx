import Colors from "@/data/Colors";
import { mockMatches } from "@/utils/mockData";
import { router } from "expo-router";
import React from "react";
import { FlatList, Image, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MatchCard from "../components/MatchCard";
import Typography from "../components/Shared/Typography";

interface MatchItem {
  id: number | string;
  photoUrl: string;
  firstName: string;
  // add other fields if needed
}
export default function MatchesScreen() {
  const renderNewMatch = ({ item }: { item: MatchItem }) => (
    <Pressable
      style={styles.newMatchItem}
      onPress={() => router.push(`/(tabs)/Messages/${item.id}` as any)}
    >
      <View style={styles.newMatchImageContainer}>
        <Image source={{ uri: item.photoUrl }} style={styles.newMatchImage} />
      </View>
      <Typography style={styles.newMatchName}>{item.firstName}</Typography>
    </Pressable>
  );

  const renderMatch = ({ item }: { item: MatchItem }) => (
    <MatchCard
      match={item}
      // onPress={() => router.push(`/messages/${item.id}`)}
      onPress={() => router.push(`/(tabs)/Messages`)}
    />
  );

  // Filter for new matches (last 24 hours)
  const newMatches = mockMatches.filter((match) => {
    const matchDate = new Date(match.matchedOn);
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return matchDate > oneDayAgo;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Typography variant="title">Matches</Typography>
      </View>

      {newMatches.length > 0 && (
        <View style={styles.newMatchesSection}>
          <Typography variant="subtitle" style={styles.sectionTitle}>
            New Matches
          </Typography>
          <FlatList
            data={newMatches}
            renderItem={renderNewMatch}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.newMatchesList}
          />
        </View>
      )}

      <View style={styles.allMatchesSection}>
        <Typography variant="subtitle" style={styles.sectionTitle}>
          All Matches
        </Typography>
        <FlatList
          data={mockMatches}
          renderItem={renderMatch}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.matchesList}
        />
      </View>
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
  newMatchesSection: {
    marginVertical: 8,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  newMatchesList: {
    paddingHorizontal: 8,
  },
  newMatchItem: {
    alignItems: "center",
    marginHorizontal: 8,
    width: 80,
  },
  newMatchImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.primary,
    overflow: "hidden",
  },
  newMatchImage: {
    width: "100%",
    height: "100%",
  },
  newMatchName: {
    marginTop: 4,
    textAlign: "center",
    fontSize: 12,
  },
  allMatchesSection: {
    flex: 1,
    marginTop: 8,
  },
  matchesList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
