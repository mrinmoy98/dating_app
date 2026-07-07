import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// import { ArrowLeft, Send, Image as ImageIcon } from 'lucide-react-native';
import Colors from "@/data/Colors";
import { mockConversations, mockMessages } from "@/utils/mockData";
import { AntDesign, Entypo, Feather } from "@expo/vector-icons";
import ChatBubble from "../components/ChatBubble";
import Typography from "../components/Shared/Typography";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams();
  console.log(id)
  const conversationId = Array.isArray(id) ? id[0] : id;

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
            {/* <ArrowLeft size={24} color={Colors.text} /> */}
            <AntDesign name="arrowleft" size={24} color={Colors.text} />
          </Pressable>
          <Typography variant="title">Chat</Typography>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.notFoundContainer}>
          <Typography>Conversation not found</Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          {/* <ArrowLeft size={24} color={Colors.text} /> */}
          <AntDesign name="arrowleft" size={24} color={Colors.text} />
        </Pressable>
        <Pressable style={styles.profileInfo} onPress={() => {}}>
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

      <FlatList
        ref={flatListRef}
        data={messages.filter((m) => m.conversationId === conversationId)}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        // onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <Pressable style={styles.attachButton}>
            {/* <ImageIcon size={24} color={Colors.primary} /> */}
            <Entypo name="image" size={24} color={Colors.primary} />
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <Pressable
            style={[
              styles.sendButton,
              { opacity: newMessage.trim() ? 1 : 0.5 },
            ]}
            onPress={handleSend}
            disabled={!newMessage.trim()}
          >
            {/* <Send size={20} color="white" /> */}
            <Feather name="send" size={20} color="white" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    backgroundColor: "white",
  },
  backButton: {
    padding: 8,
  },
  profileInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  lastSeen: {
    fontSize: 12,
    color: Colors.darkGray,
  },
  placeholder: {
    width: 40,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "white",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
