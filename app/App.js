import { StatusBar } from 'expo-status-bar'
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text, Platform } from 'react-native'

import DiscoverScreen from './src/screens/DiscoverScreen'
import ReelsScreen from './src/screens/ReelsScreen'
import MatchesScreen from './src/screens/MatchesScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import ChatScreen from './src/screens/ChatScreen'
import CallScreen from './src/screens/CallScreen'
import MatchScreen from './src/screens/MatchScreen'
import { colors } from './src/theme'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const ICONS = { Discover: '🔥', Reels: '🎬', Matches: '❤️', Profile: '👤' }

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          left: 14, right: 14, bottom: 14, height: 62,
          borderRadius: 22, borderTopWidth: 0,
          backgroundColor: 'rgba(20,14,28,0.92)',
          borderWidth: 1, borderColor: colors.glassBrd,
          elevation: 0,
        },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{ICONS[route.name]}</Text>
        ),
      })}
    >
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Reels" component={ReelsScreen} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.bg, text: colors.ink, border: colors.glassBrd },
}

const linking = {
  prefixes: ['amour://'],
  config: {
    screens: {
      Tabs: {
        screens: { Discover: 'discover', Reels: 'reels', Matches: 'matches', Profile: 'profile' },
      },
      Chat: 'chat',
      Call: 'call',
      Match: 'match',
    },
  },
}

export default function App() {
  return (
    <NavigationContainer theme={navTheme} linking={linking}>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Call" component={CallScreen} options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="Match" component={MatchScreen} options={{ presentation: 'transparentModal', animation: 'fade' }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
