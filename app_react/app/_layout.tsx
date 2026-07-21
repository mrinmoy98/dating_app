import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Platform, StatusBar, View } from "react-native";
import { Provider } from "react-redux";
import { getSocket } from "../lib/socket";
import { store } from "../store";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { bootstrapSession } from "../store/slices/authSlice";
import { SafeAreaProvider } from "react-native-safe-area-context";

/**
 * React Native Web needs html/body/#root to fill the viewport, otherwise
 * flex:1 screens collapse and absolutely-positioned buttons end up outside the
 * clickable area (taps/clicks silently do nothing).
 */
if (Platform.OS === "web" && typeof document !== "undefined") {
  const id = "rnw-base-style";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      html, body, #root { height: 100%; width: 100%; margin: 0; padding: 0; }
      #root { display: flex; flex-direction: column; }
      input, textarea { outline: none; }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Auth-aware navigator. `Stack.Protected` removes the screens whose guard is
 * false from the navigator entirely — so once the user is logged in, the auth
 * and onboarding screens are gone from the back stack (pressing back exits the
 * app instead of returning to login/register), and vice-versa.
 */
function RootNavigator() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { authToken, isBootstrapping } = useAppSelector((s) => s.auth);

  // Restore any saved session once on launch.
  useEffect(() => {
    dispatch(bootstrapSession());
  }, [dispatch]);

  // Ring incoming calls from anywhere in the app (app-wide listener).
  useEffect(() => {
    if (!authToken) return;
    const socket = getSocket(authToken);
    const onRing = ({ callId, from }: any) => {
      router.push({
        pathname: "/call/[id]",
        params: {
          id: from?.id,
          name: from?.firstName ?? "Caller",
          photo: from?.photoUrl ?? "",
          callId,
          incoming: "1",
        },
      } as any);
    };
    socket.on("call_ring", onRing);
    return () => {
      socket.off("call_ring", onRing);
    };
  }, [authToken, router]);

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
        <Stack.Screen name="(profile)/Connections" options={{ presentation: "modal" }} />
        <Stack.Screen name="(profile)/Notifications" options={{ presentation: "modal" }} />
        <Stack.Screen name="(profile)/Likes" options={{ presentation: "modal" }} />
        <Stack.Screen name="user/[id]" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="call/[id]" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="conversation/[id]" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar
          translucent={false}
          backgroundColor="#fff"
          barStyle="dark-content"
        />
        <RootNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}
