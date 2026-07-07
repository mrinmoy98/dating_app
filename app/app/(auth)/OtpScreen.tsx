import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useRegistration } from '../../context/RegistrationContext';
import { api } from '../../lib/api';

export default function OtpScreen() {
  const router = useRouter();
  const { phone, setRegistrationToken, setAuth } = useRegistration();
  const [timer, setTimer] = useState(60);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleContinue = async () => {
    if (otp.length !== 4) return;
    try {
      setLoading(true);
      const res = await api.verifyOtp(phone, otp);
      if (res.isNewUser) {
        // New user → keep the registration token and verify email next.
        setRegistrationToken(res.registrationToken ?? null);
        router.push('/(auth)/EmailScreen');
      } else {
        // Returning user → logged straight in.
        setAuth(res.token as string, res.user);
        router.replace('/(tabs)/Discover');
      }
    } catch (e: any) {
      Alert.alert('Verification failed', e?.message ?? 'Incorrect OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const res = await api.sendOtp(phone);
      setTimer(60);
      setOtp('');
      if (res.devCode) Alert.alert('OTP (dev mode)', `Your code is ${res.devCode}`);
    } catch (e: any) {
      Alert.alert('Could not resend OTP', e?.message ?? 'Please try again.');
    }
  };

  const isComplete = otp.length === 4;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Sent you an{'\n'}OTP!</Text>
      <View style={styles.phoneRow}>
        <Text style={styles.phoneText}>{phone || '+91 —'}</Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/PhoneScreen')}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Tapping the boxes focuses the hidden input that actually captures the OTP. */}
      <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()}>
        <View style={styles.otpContainer}>
          {[0, 1, 2, 3].map((_, index) => (
            <View
              key={index}
              style={[styles.otpBox, otp.length === index && styles.otpBoxActive]}
            >
              <Text style={styles.otpChar}>{otp[index] || ''}</Text>
            </View>
          ))}
        </View>
        <TextInput
          ref={inputRef}
          value={otp}
          onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 4))}
          keyboardType="number-pad"
          maxLength={4}
          autoFocus
          style={styles.hiddenInput}
        />
      </TouchableOpacity>

      <Text style={styles.timerText}>
        {timer > 0 ? (timer < 10 ? `00:0${timer}` : `00:${timer}`) : ''}
      </Text>

      {timer === 0 && (
        <TouchableOpacity onPress={handleResend} style={styles.resendBtn}>
          <Text style={styles.resendText}>Resend OTP</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={handleContinue}
        disabled={!isComplete || loading}
        style={[styles.continueButton, { backgroundColor: isComplete ? '#8d2561' : '#eee' }]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: isComplete ? '#fff' : '#999', fontWeight: '600' }}>
            Continue
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
  },
  header: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: 30,
    color: '#111',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 40,
  },
  phoneText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
  editText: {
    fontSize: 16,
    color: '#8d2561',
    marginLeft: 10,
    fontWeight: '500',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 10,
    marginBottom: 20,
  },
  otpBox: {
    borderBottomWidth: 2,
    borderColor: '#ccc',
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: '#8d2561',
  },
  otpChar: {
    fontSize: 20,
    fontWeight: '600',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },
  timerText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#111',
    marginBottom: 16,
  },
  resendBtn: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    color: '#8d2561',
    fontWeight: '600',
    fontSize: 15,
  },
  continueButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
});
