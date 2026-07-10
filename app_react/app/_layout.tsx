import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { RegistrationProvider, useRegistration } from "../context/RegistrationContext";

/**
 * Auth-aware navigator. `Stack.Protected` removes the screens whose guard is
 * false from the navigator entirely — so once the user is logged in, the auth
 * and onboarding screens are gone from the back stack (pressing back exits the
 * app instead of returning to login/register), and vice-versa.
 */
function RootNavigator() {
  const { authToken, isBootstrapping } = useRegistration();

  // While we restore the saved session, show a splash so we never flash the
  // login screen to an already-logged-in user.
  if (isBootstrapping) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#F43F5E" />
      </View>
    );
  }

  const isLoggedIn = !!authToken;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Entry point — redirects to the right group based on the token. */}
      <Stack.Screen name="index" />

      {/* ---- Logged-out: landing + auth + onboarding ---- */}
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="landing" />
        <Stack.Screen name="(auth)/PasswordLoginScreen" />
        <Stack.Screen name="(auth)/PhoneScreen" />
        <Stack.Screen name="(auth)/OtpScreen" />
        <Stack.Screen name="(auth)/EmailScreen" />
        <Stack.Screen name="(auth)/EmailOtpScreen" />
        <Stack.Screen name="(intro)/QuickIntroScreen" />
        <Stack.Screen name="(intro)/AgeConfirmationModal" />
        <Stack.Screen name="(intro)/HeightSelector" />
        <Stack.Screen name="(intro)/RelationshipStatus" />
        <Stack.Screen name="(intro)/ReligionSelection" />
        <Stack.Screen name="(intro)/LanguageSelection" />
        <Stack.Screen name="(intro)/HabitSelectionScreen" />
        <Stack.Screen name="(intro)/RelationshipGoalsScreen" />
        <Stack.Screen name="(intro)/VideoProfileScreen" />
        <Stack.Screen name="(intro)/FaceRevealScreen" />
      </Stack.Protected>

      {/* ---- Logged-in: the app ---- */}
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(profile)/EditProfile" options={{ presentation: "modal" }} />
        <Stack.Screen name="(profile)/Preferences" options={{ presentation: "modal" }} />
        <Stack.Screen name="(profile)/SetPassword" options={{ presentation: "modal" }} />
        <Stack.Screen name="conversation/[id]" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <RegistrationProvider>
      <RootNavigator />
    </RegistrationProvider>
  );
}