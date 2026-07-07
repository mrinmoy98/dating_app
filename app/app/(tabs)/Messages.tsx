import { mockConversations } from "@/utils/mockData";
import { router } from "expo-router";
import React from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ChatPreview from "../components/ChatPreview";
import SearchInput from "../components/Shared/SearchInput";
import Typography from "../components/Shared/Typography";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: string;

  // id: string;
  // isOnline:boolean;
  // lastMessage:object;
  // matchedOn:string;
  // read:boolean;
  // user:object;
}

export interface Conversation {
  id: string;
  user: User;
  lastMessage: Message;
  read: boolean;
  isOnline: boolean;
  matchedOn: string;
}

export default function MessagesScreen() {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredConversations = mockConversations.filter(
    (conversation) =>
      conversation.user.firstName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      conversation.user.lastName
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const renderConversation = ({ item }: { item: Conversation }) => (
    <Pressable
    >
      <View>
        <ChatPreview
          conversation={item}
          onPress={() =>
            router.push({
              pathname: "/conversation/[id]",
              params: { id: item.id },
            })
          }
        />
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Typography variant="title">Messages</Typography>
      </View>

      <View style={styles.searchContainer}>
        <SearchInput
          placeholder="Search messages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Typography style={styles.emptyText}>No messages found</Typography>
          </View>
        }
      />
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
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  messagesList: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    color: "#888",
  },
});
