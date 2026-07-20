import Colors from '@/data/Colors';
import { AntDesign, EvilIcons, Feather, FontAwesome } from '@expo/vector-icons';
// import { Heart, MessageCircle, X } from 'lucide-react-native';
import React from 'react';
import {
    Dimensions,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import ActionButton from './Shared/ActionButton';
import Typography from './Shared/Typography';


const { width } = Dimensions.get('window');

interface ProfileDetailsProps {
  profile: any;
  visible: boolean;
  onClose: () => void;
  /** Swipe-left equivalent — skip this person. */
  onPass?: () => void;
  /** Swipe-right equivalent — like (goes to the Likes list). */
  onLike?: () => void;
  /** Follow / unfollow this person. */
  onFollow?: () => void;
}

export default function ProfileDetails({
  profile,
  visible,
  onClose,
  onPass,
  onLike,
  onFollow,
}: ProfileDetailsProps) {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  
  const images = [
    { url: profile.photoUrl },
    { url: 'https://images.pexels.com/photos/7403187/pexels-photo-7403187.jpeg' },
    { url: 'https://images.pexels.com/photos/3768267/pexels-photo-3768267.jpeg' },
  ];

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable style={styles.closeButton} onPress={onClose}>
          {/* <X size={24} color="white" /> */}
          <Feather name="x" size={24} color="white" />
        </Pressable>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Photo Gallery */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: images[currentImageIndex].url }} style={styles.image} />
            
            <View style={styles.imageDots}>
              {images.map((_, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.dot,
                    currentImageIndex === index && styles.activeDot,
                  ]}
                  onPress={() => setCurrentImageIndex(index)}
                />
              ))}
            </View>
          </View>
          
          {/* Profile Info */}
          <View style={styles.profileInfo}>
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
                  {/* <Briefcase size={18} color={Colors.primary} style={styles.icon} /> */}
                <Feather name="briefcase" size={18} color={Colors.primary} style={styles.icon}/>

                  <Typography style={styles.detailText}>{profile.occupation}</Typography>
                </View>
              )}
              
              {profile.education && (
                <View style={styles.detailRow}>
                  {/* <GraduationCap size={18} color={Colors.primary} style={styles.icon} /> */}
                <FontAwesome name="graduation-cap" size={18} color={Colors.primary} style={styles.icon} />

                  <Typography style={styles.detailText}>{profile.education}</Typography>
                </View>
              )}
              
              {profile.location && (
                <View style={styles.detailRow}>
                  {/* <MapPin size={18} color={Colors.primary} style={styles.icon} /> */}
                <EvilIcons name="location" size={18} color={Colors.primary} style={styles.icon} />

                  <Typography style={styles.detailText}>
                    {profile.location}
                    {profile.distance != null ? ` (${profile.distance} km away)` : ""}
                  </Typography>
                </View>
              )}
            </View>
          </View>
          
          {/* About */}
          <View style={styles.section}>
            <Typography variant="subtitle" style={styles.sectionTitle}>About</Typography>
            <Typography style={styles.aboutText}>{profile.bio}</Typography>
          </View>
          
          {/* Interests */}
          <View style={styles.section}>
            <Typography variant="subtitle" style={styles.sectionTitle}>Interests</Typography>
            <View style={styles.interestsContainer}>
              {profile.interests && profile.interests.map((interest:any, index:any) => (
                <View key={index} style={styles.interestBadge}>
                  <Typography style={styles.interestText}>{interest}</Typography>
                </View>
              ))}
            </View>
          </View>
          
          {/* Extra Space at Bottom */}
          <View style={{ height: 100 }} />
        </ScrollView>
        
        {/* Action Buttons — pass, follow, like */}
        <View style={styles.actions}>
          <ActionButton
            icon={<Feather name="x" size={24} color="white" />}
            color={Colors.error}
            onPress={() => {
              onPass?.();
              onClose();
            }}
          />
          <ActionButton
            icon={
              <Feather name={profile.is_following ? "user-check" : "user-plus"} size={22} color="white" />
            }
            color={Colors.secondary}
            size="medium"
            onPress={() => onFollow?.()}
          />
          <ActionButton
            icon={<Feather name="heart" size={24} color="white" />}
            color={Colors.primary}
            onPress={() => {
              onLike?.();
              onClose();
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    height: 500,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageDots: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  profileInfo: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
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
    marginTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 12,
  },
  detailText: {
    fontSize: 16,
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  aboutText: {
    lineHeight: 24,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  interestBadge: {
    backgroundColor: Colors.lightPrimary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: Colors.primary,
  },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
  },
});