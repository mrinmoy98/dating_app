import Colors from '@/data/Colors';
import { EvilIcons, Feather, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// import { GraduationCap, MapPin } from 'lucide-react-native';
import React from 'react';
import { Dimensions, Image, Pressable, StyleSheet, View } from 'react-native';
import Typography from './Shared/Typography';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;

interface ProfileCardProps {
  profile: any;
  onPress?: () => void;
}

export default function ProfileCard({ profile, onPress }: ProfileCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image source={{ uri: profile.photoUrl }} style={styles.image} />
      
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.gradient}
      >
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Typography variant="title" style={styles.name}>
              {profile.firstName}, {profile.age}
            </Typography>
            {profile.verified && (
              <View style={styles.verifiedBadge}>
                <Typography style={styles.verifiedText}>✓</Typography>
              </View>
            )}
          </View>

          <View style={styles.detailsContainer}>
            {profile.occupation && (
              <View style={styles.detailRow}>
                {/* <Briefcase size={14} color="white" style={styles.icon} /> */}
                <Feather name="briefcase" size={14} color="white" style={styles.icon}/>

                <Typography style={styles.detailText}>{profile.occupation}</Typography>
              </View>
            )}
            
            {profile.education && (
              <View style={styles.detailRow}>
                {/* <GraduationCap size={14} color="white" style={styles.icon} /> */}
                <FontAwesome name="graduation-cap" size={14} color="white" style={styles.icon} />
                <Typography style={styles.detailText}>{profile.education}</Typography>
              </View>
            )}
            
            {profile.location && (
              <View style={styles.detailRow}>
                {/* <MapPin size={14} color="white" style={styles.icon} /> */}
                <EvilIcons name="location" size={14} color="white" style={styles.icon} />
                <Typography style={styles.detailText}>{profile.location}</Typography>
              </View>
            )}
          </View>

          <View style={styles.interestsContainer}>
            {profile.interests && profile.interests.slice(0, 3).map((interest:any, index:any) => (
              <View key={index} style={styles.interestBadge}>
                <Typography style={styles.interestText}>{interest}</Typography>
              </View>
            ))}
            {profile.interests && profile.interests.length > 3 && (
              <View style={styles.moreInterestsBadge}>
                <Typography style={styles.moreInterestsText}>+{profile.interests.length - 3}</Typography>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      {profile.distance && (
        <View style={styles.distanceBadge}>
          {/* <MapPin size={12} color={Colors.primary} style={{ marginRight: 4 }} /> */}
                <EvilIcons name="location" size={12} color={Colors.primary} style={{ marginRight: 4 }} />

          <Typography style={styles.distanceText}>{profile.distance} miles away</Typography>
        </View>
      )}

      <View style={styles.tapForMoreContainer}>
        <Typography style={styles.tapForMore}>Tap for more info</Typography>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    padding: 16,
    justifyContent: 'flex-end',
  },
  info: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    color: 'white',
    marginRight: 8,
  },
  verifiedBadge: {
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 6,
  },
  detailText: {
    color: 'white',
    fontSize: 14,
  },
  interestsContainer: {
    flexDirection: 'row',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  interestBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 50,
    marginRight: 8,
  },
  interestText: {
    color: 'white',
    fontSize: 12,
  },
  moreInterestsBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 50,
  },
  moreInterestsText: {
    color: 'white',
    fontSize: 12,
  },
  distanceBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
    color: Colors.text,
  },
  tapForMoreContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 50,
  },
  tapForMore: {
    color: 'white',
    fontSize: 12,
  },
});