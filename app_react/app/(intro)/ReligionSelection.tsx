import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRegistration } from '../../context/RegistrationContext';
import ProgressBar from '../components/Shared/ProgressBar';

const religionOptions = [
  'Hindu', 'Spiritual', 'Muslim',
  'Christian', 'Atheist', 'Agnostic',
  'Buddhist', 'Jewish', 'Parsi', 'Sikh',
  'Jain', 'Bahai', 'Other',
];

export default function ReligionSelection() {
  const router = useRouter();
  const { patch } = useRegistration();
  const [selectedReligion, setSelectedReligion] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.progressBar} /> */}
      <ProgressBar />

      <Text style={styles.heading}>What religion do{'\n'}you follow?</Text>
      <Text style={styles.subheading}>
        Select the option that resonates with you.
      </Text>

      <View style={styles.optionsWrapper}>
        {religionOptions.map((religion, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              selectedReligion === religion && styles.selectedButton,
            ]}
            onPress={() => setSelectedReligion(religion)}
          >
            <Text
              style={[
                styles.optionText,
                selectedReligion === religion && styles.selectedText,
              ]}
            >
              {religion}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.noteBox}>
        <AntDesign name="infocirlceo" size={16} color="#555" />
        <Text style={styles.noteText}>
          You can always edit this in your profile.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => {
          patch({ religion: selectedReligion || undefined });
          router.push('/(intro)/LanguageSelection');
        }}
      >
        <AntDesign name="arrowright" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop:90

  },
  progressBar: {
    height: 4,
    backgroundColor: '#111',
    width: '35%',
    borderRadius: 4,
    marginVertical: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  optionsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f6f6f6',
  },
  selectedButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  optionText: {
    color: '#444',
    fontSize: 14,
  },
  selectedText: {
    color: '#fff',
    fontWeight: '600',
  },
  noteBox: {
    flexDirection: 'row',
    backgroundColor: '#f6f6f6',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#444',
  },
  nextButton: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    backgroundColor: '#8d2561',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
