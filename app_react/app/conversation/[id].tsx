import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/data/Colors";
import { mockConversations, mockMessages } from "@/utils/mockData";
import { AntDesign, Entypo, Feather, Ionicons } from "@expo/vector-icons";
import ChatBubble from "../components/ChatBubble";
import Typography from "../components/Shared/Typography";
import {
  KeyboardProvider,
  KeyboardStickyView,
} from "react-native-keyboard-controller";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams();
  const conversationId = Array.isArray(id) ? id[0] : id;
  const insets = useSafeAreaInsets();

  const conversation = mockConversations.find(
    (c) => c.id.toString() === conversationId
  );
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const flatListRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: false });
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  const handleSend = () => {
    if (newMessage.trim() === "") return;

    const message = {
      id: String(messages.length + 1),
      conversationId,
      senderId: "currentUser",
      text: newMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, message]);
    setNewMessage("");

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatBubble
      message={item}
      isCurrentUser={item.senderId === "currentUser"}
    />
  );

  if (!conversation) {
    return (
      <SafeAreaView style={styles.container}>

        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <AntDesign name="arrow-left" size={24} color={Colors.text} />
          </Pressable>
          <Typography variant="title">Chat</Typography>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.notFoundContainer}>
          <Typography>Conversation not found</Typography>
        </View>
      </SafeAreaView >
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar
        translucent={false}
        backgroundColor="#fff"
        barStyle="dark-content"
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <AntDesign name="arrow-left" size={24} color={Colors.text} />
        </Pressable>

        <Pressable style={styles.profileInfo}>
          <Image
            source={{ uri: conversation.user.photoUrl }}
            style={styles.profileImage}
          />

          <View>
            <Typography variant="subtitle">
              {conversation.user.firstName} {conversation.user.lastName}
            </Typography>

            <Typography style={styles.lastSeen}>
              {conversation.isOnline ? "Online" : "Last seen today"}
            </Typography>
          </View>
        </Pressable>

        <View style={styles.placeholder} />
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          style={{ flex: 1 }}
          data={messages.filter(
            (m) => m.conversationId === conversationId
          )}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 16,
            flexGrow: 1,
          }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({
              animated: true,
            })
          }
        />

        {/* Bottom */}
        <View style={styles.bottom}>
          <TouchableOpacity style={styles.icon}>
            <Feather name="image" size={23} color="#ff4d73" />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            value={newMessage}
            onChangeText={setNewMessage}
          />

          <TouchableOpacity
            onPress={handleSend}
            disabled={!newMessage.trim()}
            style={[
              styles.sendButton,
              {
                opacity: newMessage.trim() ? 1 : 0.5,
              },
            ]}
          >
            <Ionicons
              name="paper-plane"
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    height: 72,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ECECEC",
    zIndex: 10,
    elevation: 2,
  },

  bottom: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ECECEC",
    backgroundColor: "#fff",
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginHorizontal: 14,
  },

  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
  },

  online: {
    color: "#8A8A8A",
    marginTop: 2,
    fontSize: 15,
  },

  list: {
    padding: 16,
    paddingBottom: 24,
  },

  messageContainer: {
    marginBottom: 14,
  },

  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
  },

  leftBubble: {
    backgroundColor: "#F2F2F2",
    borderTopLeftRadius: 12,
  },

  rightBubble: {
    backgroundColor: "#FF4D73",
    borderTopRightRadius: 12,
  },

  message: {
    fontSize: 18,
    lineHeight: 26,
  },

  time: {
    marginTop: 6,
    color: "#9E9E9E",
    fontSize: 13,
    marginHorizontal: 6,
  },

  /* bottom: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderColor: "#ECECEC",
    backgroundColor: "#fff",
  }, */

  icon: {
    width: 42,
    alignItems: "center",
  },

  input: {
    flex: 1,
    height: 48,
    backgroundColor: "#F5F5F5",
    borderRadius: 28,
    paddingHorizontal: 18,
    fontSize: 17,
  },

  sendButton: {
    // width: 50,
    // height: 50,
    // borderRadius: 25,
    // backgroundColor: "#FF7D9B",
    // justifyContent: "center",
    // alignItems: "center",
    // marginLeft: 12,

    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    backgroundColor: Colors.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  }, placeholder: {
    width: 40,
  }, notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  messagesList: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  profileInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  lastSeen: {
    fontSize: 12,
    color: Colors.darkGray,
  },
});