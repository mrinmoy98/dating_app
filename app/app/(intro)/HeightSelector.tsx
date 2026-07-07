import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRegistration } from '../../context/RegistrationContext';
import ProgressBar from '../components/Shared/ProgressBar';

export default function HeightSelector() {
  const router = useRouter();
  const { patch } = useRegistration();

  const heights = [
    { label: `4'10" (147 cm)` },
    { label: `4'11" (149 cm)` },
    { label: `5'0" (152 cm)` },
    { label: `5'1" (154 cm)` },
    { label: `5'2" (157 cm)` },
  ];

  const [selectedIndex, setSelectedIndex] = useState(2); // Default selected (5'0")

  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.progressBar} /> */}
      <ProgressBar />

      <Text style={styles.heading}>How tall{'\n'}are you?</Text>
      <Text style={styles.subheading}>
        This is to avoid any surprises on the first date.
      </Text>

      <FlatList
        data={heights}
        keyExtractor={(item, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => setSelectedIndex(index)}
            style={[
              styles.item,
              selectedIndex === index && styles.selectedItem,
            ]}
          >
            <Text
              style={[
                styles.itemText,
                selectedIndex === index
                  ? styles.selectedText
                  : styles.unselectedText,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.noteBox}>
        <AntDesign name="infocirlceo" size={16} color="#555" />
        <Text style={styles.noteText}>
          This will help us find potential matches who’ll appreciate you just as you are.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => {
          const label = heights[selectedIndex].label;
          const cmMatch = /\((\d+)\s*cm\)/.exec(label);
          patch({
            height_label: label,
            height_cm: cmMatch ? Number(cmMatch[1]) : undefined,
          });
          router.push('/(intro)/RelationshipStatus');
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
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    paddingTop:90
  },
//   progressBar: {
//     height: 4,
//     backgroundColor: '#111',
//     width: '20%',
//     borderRadius: 4,
//     marginVertical: 16,
//   },
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
  },
  list: {
    alignItems: 'center',
    marginBottom: 20,
  },
  item: {
    paddingVertical: 8,
  },
  itemText: {
    fontSize: 18,
    fontWeight: '500',
  },
  selectedItem: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  selectedText: {
    color: '#fff',
    fontWeight: '700',
  },
  unselectedText: {
    color: '#bbb',
  },
  noteBox: {
    backgroundColor: '#f6f6f6',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 40,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#444',
  },
  nextButton: {
    backgroundColor: '#8d2561',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignSelf: 'flex-end',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
});
