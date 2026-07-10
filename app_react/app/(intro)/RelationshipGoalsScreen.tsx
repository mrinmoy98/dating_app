// App.js or RelationshipGoalsScreen.js

import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRegistration } from '../../context/RegistrationContext';
import IntroNav from '../components/Shared/IntroNav';
import ProgressBar from '../components/Shared/ProgressBar';

const options = [
  'Settle down',
  'Long-term relationship',
  'Long-term relationship, open to settling down',
  'Figuring out my relationship goals',
  'Prefer not to say',
];

export default function RelationshipGoalsScreen() {
  const router = useRouter();
  const { patch } = useRegistration();
  const [selected, setSelected] = useState('');

  return (
    <View style={styles.container}>
        <ProgressBar />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>What are your relationship goals?</Text>
        <Text style={styles.subtitle}>
          It’s your journey, choose the option that feels right for you.
        </Text>

        {options.map((option, index) => {
          const isSelected = selected === option;
          const isLast = index === options.length - 1;

          return (
            <TouchableOpacity
              key={option}
              onPress={() => setSelected(option)}
              style={[
                styles.optionButton,
                isSelected && (isLast ? styles.selectedLast : styles.selectedOption),
                isLast && styles.lastOption,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.selectedText,
                  isLast && styles.lastOptionText,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <IntroNav
        onNext={() => {
          patch({ relationship_goal: selected || undefined });
          router.push('/(intro)/VideoProfileScreen');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 90,
    paddingBottom: 80,

  },
  scrollContainer: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  subtitle: {
    fontSize: 15,
    color: '#777',
    marginBottom: 30,
  },
  optionButton: {
    backgroundColor: '#f2f2f2',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  selectedOption: {
    backgroundColor: '#d0bdf4',
  },
  selectedLast: {
    backgroundColor: '#000',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  optionText: {
    fontSize: 16,
    color: '#000',
  },
  lastOption: {
    backgroundColor: '#000',
  },
  lastOptionText: {
    color: '#fff',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    backgroundColor: '#8e276d', // dark pink
    borderRadius: 30,
    padding: 18,
    elevation: 5,
  },
});
