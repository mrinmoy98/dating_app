import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useRegistration } from '../../context/RegistrationContext';
import { api } from '../../lib/api';
import DismissKeyboard from '../components/Shared/DismissKeyboard';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EmailOtpScreen() {
  const router = useRouter();
  const { email, registrationToken, setRegistrationToken } = useRegistration();
  const [timer, setTimer] = useState(60);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleContinue = async () => {
    if (otp.length !== 4 || !registrationToken) return;
    try {
      setLoading(true);
      const res = await api.verifyEmailOtp(email, otp, registrationToken);
      // Save the upgraded token (now carries the verified email) and continue.
      setRegistrationToken(res.registrationToken);
      router.push('/(intro)/QuickIntroScreen');
    } catch (e: any) {
      Alert.alert('Verification failed', e?.message ?? 'Incorrect code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!registrationToken) return;
    try {
      const res = await api.sendEmailOtp(email, registrationToken);
      setTimer(60);
      setOtp('');
      if (res.devCode) Alert.alert('Email code (dev mode)', `Your code is ${res.devCode}`);
    } catch (e: any) {
      Alert.alert('Could not resend', e?.message ?? 'Please try again.');
    }
  };

  const isComplete = otp.length === 4;

  return (
    <DismissKeyboard>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.container}>
          <Text style={styles.header}>Verify your email</Text>
          <View style={styles.row}>
            <Text style={styles.emailText}>{email || '—'}</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()}>
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
        </TouchableOpacity> */}
          <View style={styles.otpWrapper}>
            <TextInput
              ref={inputRef}
              value={otp}
              onChangeText={(text) =>
                setOtp(text.replace(/[^0-9]/g, "").slice(0, 4))
              }
              keyboardType="number-pad"
              maxLength={4}
              autoFocus
              style={styles.hiddenInput}
              caretHidden
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
            />

            <TouchableOpacity
              activeOpacity={1}
              style={styles.otpContainer}
              onPress={() => inputRef.current?.focus()}
            >
              {[0, 1, 2, 3].map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.otpBox,
                    otp.length === index && styles.otpBoxActive,
                  ]}
                >
                  <Text style={styles.otpChar}>
                    {otp[index] ?? ""}
                  </Text>
                </View>
              ))}
            </TouchableOpacity>
          </View>

          <Text style={styles.timerText}>
            {timer > 0 ? (timer < 10 ? `00:0${timer}` : `00:${timer}`) : ''}
          </Text>

          {timer === 0 && (
            <TouchableOpacity onPress={handleResend} style={styles.resendBtn}>
              <Text style={styles.resendText}>Resend code</Text>
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
              <Text style={{ color: isComplete ? '#fff' : '#999', fontWeight: '600' }}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </DismissKeyboard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  header: { fontSize: 26, fontWeight: '700', marginTop: 40, color: '#111' },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 40, gap: 10 },
  emailText: { fontSize: 16, color: '#000', fontWeight: '600' },
  editText: { fontSize: 16, color: '#8d2561', fontWeight: '500' },
  // otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 10, marginBottom: 20 },
  // otpBox: { borderBottomWidth: 2, borderColor: '#ccc', width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  // otpBoxActive: { borderColor: '#8d2561' },
  // otpChar: { fontSize: 20, fontWeight: '600' },
  // hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  timerText: { textAlign: 'center', fontSize: 16, color: '#111', marginBottom: 16 },
  resendBtn: { alignItems: 'center', marginBottom: 24 },
  resendText: { color: '#8d2561', fontWeight: '600', fontSize: 15 },
  continueButton: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  otpWrapper: {
    position: "relative",
    marginBottom: 20,
  },

  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  hiddenInput: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.01,
    zIndex: 1,
  },

  otpBox: {
    width: 55,
    height: 55,
    borderBottomWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },

  otpBoxActive: {
    borderColor: "#8d2561",
  },
  otpChar: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111",
  },
});
