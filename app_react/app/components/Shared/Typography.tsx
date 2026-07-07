import Colors from '@/data/Colors';
import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';


interface TypographyProps extends TextProps {
  variant?: 'title' | 'subtitle' | 'body' | 'caption' | 'button' | 'stat' | 'statLabel' | 'action';
  children: React.ReactNode;
}

export default function Typography({ variant = 'body', style, children, ...props }: TypographyProps) {
  return (
    <Text style={[styles[variant], style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: Colors.text,
  },
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text,
  },
  caption: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.darkGray,
  },
  button: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.white,
  },
  stat: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: Colors.primary,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.darkGray,
  },
  action: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: Colors.white,
  },
});