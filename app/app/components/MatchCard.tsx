import Colors from '@/data/Colors';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Typography from './Shared/Typography';


interface MatchCardProps {
  match: any;
  onPress: () => void;
}

export default function MatchCard({ match, onPress }: MatchCardProps) {
  // Calculate time ago string
  const getTimeAgo = (dateString:any) => {
    const now = new Date();
    const matchDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - matchDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  };

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: match.photoUrl }} style={styles.image} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Typography variant="subtitle" style={styles.name}>
            {match.firstName}, {match.age}
          </Typography>
          {match.verified && (
            <View style={styles.verifiedBadge}>
              <Typography style={styles.verifiedText}>✓</Typography>
            </View>
          )}
        </View>
        
        <Typography style={styles.location}>{match.location}</Typography>
        
        <View style={styles.interestsContainer}>
          {match.interests && match.interests.slice(0, 2).map((interest:any, index:any) => (
            <View key={index} style={styles.interestBadge}>
              <Typography style={styles.interestText}>{interest}</Typography>
            </View>
          ))}
          {match.interests && match.interests.length > 2 && (
            <Typography style={styles.moreInterests}>+{match.interests.length - 2} more</Typography>
          )}
        </View>
      </View>
      
      <View style={styles.timeContainer}>
        <Typography style={styles.timeAgo}>{getTimeAgo(match.matchedOn)}</Typography>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  imageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    marginRight: 16,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    marginRight: 4,
  },
  verifiedBadge: {
    backgroundColor: Colors.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  location: {
    fontSize: 14,
    color: Colors.darkGray,
    marginTop: 2,
    marginBottom: 6,
  },
  interestsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interestBadge: {
    backgroundColor: Colors.lightPrimary,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 6,
  },
  interestText: {
    color: Colors.primary,
    fontSize: 12,
  },
  moreInterests: {
    fontSize: 12,
    color: Colors.darkGray,
  },
  timeContainer: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
  timeAgo: {
    fontSize: 12,
    color: Colors.gray,
  },
});