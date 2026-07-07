import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Alert } from 'react-native';
import { useRegistration } from '../../context/RegistrationContext';
import ProgressBar from '../components/Shared/ProgressBar';

const motherTongues = [
  'Konkani', 'Konyak', 'Korku', 'Koya', 'Kui', 'Kumaoni', 'Kurukh', 'Kutchi',
  'Lotha', 'Maithili', 'Malayalam', 'Malto', 'Manipuri', 'Mao', 'Marwari',
  'Meitei', 'Mishing', 'Mizo', 'Munda', 'Mundari', 'Nepali', 'Nishi', 'Oriya',
  'Phom', 'Punjabi', 'Rabha', 'Santali', 'Saurashtra', 'Savara', 'Sema',
  'Sindhi', 'Tangkhul', 'Thado', 'Tibetan', 'Tulu', 'Urdu', 'Other',
];

const otherLanguages = [
  'Hindi', 'English', 'Tamil', 'Telugu', 'Bengali', 'Kannada', 'Gujarati', 'Marathi',
  'Assamese', 'Bodo', 'Kashmiri', 'Dogri', 'Sanskrit', 'Ladakhi', 'Others'
];

export default function LanguageSelection() {
  const router = useRouter();
  const { patch } = useRegistration();
  const [selectedMotherTongue, setSelectedMotherTongue] = useState('');
  const [selectedOtherLanguages, setSelectedOtherLanguages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'mother' | 'other'>('mother');

  const toggleOtherLanguage = (language: string) => {
    setSelectedOtherLanguages(prev =>
      prev.includes(language)
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  const renderChips = (list: string[], selected: string | string[], isMultiple = false) => (
    list.map((lang, idx) => {
      const isSelected = isMultiple
        ? (selected as string[]).includes(lang)
        : selected === lang;

      return (
        <TouchableOpacity
          key={idx}
          onPress={() =>
            isMultiple
              ? toggleOtherLanguage(lang)
              : setSelectedMotherTongue(lang)
          }
          style={[
            styles.chip,
            isSelected && styles.selectedChip
          ]}
        >
          <Text style={[
            styles.chipText,
            isSelected && styles.selectedChipText
          ]}>
            {lang}
          </Text>
        </TouchableOpacity>
      );
    })
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.progressBar} /> */}
      <ProgressBar />

      <Text style={styles.heading}>What languages do{'\n'}you speak?</Text>

      <View style={styles.infoBox}>
        <AntDesign name="infocirlceo" size={16} color="#555" />
        <Text style={styles.infoText}>
          Select your mother tongue (mandatory)
        </Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          onPress={() => setActiveTab('mother')}
          style={[styles.tabButton, activeTab === 'mother' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'mother' && styles.activeTabText]}>Mother tongue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('other')}
          style={[styles.tabButton, activeTab === 'other' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'other' && styles.activeTabText]}>Other languages</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.chipContainer}>
        {activeTab === 'mother'
          ? renderChips(motherTongues, selectedMotherTongue)
          : renderChips(otherLanguages, selectedOtherLanguages, true)}
      </ScrollView>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => {
          if (!selectedMotherTongue) {
            Alert.alert('Mother tongue required', 'Please select your mother tongue.');
            return;
          }
          patch({
            mother_tongue: selectedMotherTongue,
            other_languages: selectedOtherLanguages,
          });
          router.push('/(intro)/HabitSelectionScreen');
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
    padding: 24,
    backgroundColor: '#fff',
    paddingTop:90

  },
  progressBar: {
    height: 4,
    backgroundColor: '#111',
    width: '40%',
    borderRadius: 4,
    marginBottom: 16,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: '#f3f3f3',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    color: '#555',
    fontSize: 13,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#8d2561',
  },
  tabText: {
    color: '#888',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '700',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 100,
  },
  chip: {
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedChip: {
    backgroundColor: '#111',
  },
  chipText: {
    color: '#333',
    fontSize: 14,
  },
  selectedChipText: {
    color: '#fff',
    fontWeight: '600',
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
