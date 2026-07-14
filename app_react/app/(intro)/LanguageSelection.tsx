import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRegistration } from '../../context/RegistrationContext';
import { MAX_LANGUAGES, useLanguages } from '../../hooks/useLanguages';
import { FieldError, FieldLabel } from '../components/Shared/FormField';
import IntroNav from '../components/Shared/IntroNav';
import ProgressBar from '../components/Shared/ProgressBar';

export default function LanguageSelection() {
  const router = useRouter();
  const { patch } = useRegistration();
  // The list is managed by the super admin (Admin panel → Languages).
  const { languages, loading } = useLanguages();

  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggle = (lang: string) => {
    setError(null);
    setSelected((prev) => {
      if (prev.includes(lang)) return prev.filter((l) => l !== lang);
      if (prev.length >= MAX_LANGUAGES) {
        setError(`You can select up to ${MAX_LANGUAGES} languages. Remove one to add another.`);
        return prev;
      }
      return [...prev, lang];
    });
  };

  const handleNext = () => {
    if (selected.length === 0) {
      setError('This field is required');
      return;
    }
    patch({
      // First pick is stored as the mother tongue; all picks go to the list.
      mother_tongue: selected[0],
      other_languages: selected,
    });
    router.push('/(intro)/HabitSelectionScreen');
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <ProgressBar />

        <Text style={styles.heading}>What languages do{'\n'}you speak?</Text>

        <View style={styles.labelRow}>
          <FieldLabel required style={styles.label}>
            Language
          </FieldLabel>
          <Text style={[styles.counter, selected.length >= MAX_LANGUAGES && styles.counterFull]}>
            {selected.length}/{MAX_LANGUAGES}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <AntDesign name="info-circle" size={16} color="#555" />
          <Text style={styles.infoText}>Select up to {MAX_LANGUAGES} languages you speak.</Text>
        </View>

        <FieldError>{error}</FieldError>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 30 }} color="#8d2561" />
        ) : (
          <ScrollView contentContainerStyle={styles.chipContainer} showsVerticalScrollIndicator={false}>
            {languages.map((lang) => {
              const isSelected = selected.includes(lang);
              return (
                <TouchableOpacity
                  key={lang}
                  onPress={() => toggle(lang)}
                  style={[styles.chip, isSelected && styles.selectedChip]}
                >
                  {isSelected && <AntDesign name="check" size={13} color="#fff" style={{ marginRight: 5 }} />}
                  <Text style={[styles.chipText, isSelected && styles.selectedChipText]}>{lang}</Text>
                </TouchableOpacity>
              );
            })}
            {languages.length === 0 && (
              <Text style={styles.empty}>No languages available. Please try again later.</Text>
            )}
          </ScrollView>
        )}

        <IntroNav onNext={handleNext} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', paddingTop: 24 },
  heading: { fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 16 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 15, color: '#111', marginBottom: 6 },
  counter: { fontSize: 13, fontWeight: '700', color: '#888' },
  counterFull: { color: '#8d2561' },
  infoBox: {
    backgroundColor: '#f3f3f3',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 6,
    gap: 8,
  },
  infoText: { color: '#555', fontSize: 13 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 14, paddingBottom: 110 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedChip: { backgroundColor: '#8d2561' },
  chipText: { color: '#333', fontSize: 14 },
  selectedChipText: { color: '#fff', fontWeight: '600' },
  empty: { color: '#888', fontSize: 14, marginTop: 20 },
});
