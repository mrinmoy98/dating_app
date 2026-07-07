import Colors from '@/data/Colors';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Typography from './Shared/Typography';

interface ChatPreviewProps {
  conversation: any;
  onPress?: () => void;
}

export default function ChatPreview({ conversation, onPress }: ChatPreviewProps) {
  console.log(conversation)
  // Format timestamp to show either time or date
  const formatTimestamp = (timestamp:any) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    
    // If the message is from today, show time
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } 
    
    // If the message is from this week, show day name
    const dayDiff = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    if (dayDiff < 7) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: conversation.user.photoUrl }} style={styles.avatar} />
        {conversation.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Typography variant="subtitle" style={styles.name}>
            {conversation.user.firstName}
          </Typography>
          <Typography style={styles.timestamp}>
            {formatTimestamp(conversation.lastMessage.timestamp)}
          </Typography>
        </View>
        
        <View style={styles.messageRow}>
          <Typography 
            style={[
              styles.message, 
              !conversation.read && styles.unreadMessage
            ]}
            numberOfLines={1}
          >
            {conversation.lastMessage.senderId === 'currentUser' ? 'You: ' : ''}
            {conversation.lastMessage.text}
          </Typography>
          
          {!conversation.read && <View style={styles.unreadIndicator} />}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: 'white',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.gray,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: Colors.darkGray,
  },
  unreadMessage: {
    color: Colors.text,
    fontFamily: 'Inter-SemiBold',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 8,
  },
});