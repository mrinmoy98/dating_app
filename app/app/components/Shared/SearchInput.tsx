import Colors from '@/data/Colors';
import { EvilIcons, Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';

interface SearchInputProps extends TextInputProps {
  onClear?: () => void;
}

export default function SearchInput({ 
  value, 
  onChangeText,
  onClear,
  placeholder,
  ...props 
}: SearchInputProps) {
  const handleClear = () => {
    if (onChangeText) {
      onChangeText('');
    }
    if (onClear) {
      onClear();
    }
  };

  return (
    <View style={styles.container}>
      {/* <Search size={18} color={Colors.gray} style={styles.searchIcon} /> */}
      <EvilIcons name="search" size={18} color={Colors.gray} style={styles.searchIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder || "Search..."}
        placeholderTextColor={Colors.gray}
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
      {value && value.length > 0 && (
        <Pressable onPress={handleClear} style={styles.clearButton}>
          {/* <X size={16} color={Colors.gray} /> */}
          <Feather name="x" size={16} color={Colors.gray} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 50,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.text,
  },
  clearButton: {
    padding: 4,
  },
});