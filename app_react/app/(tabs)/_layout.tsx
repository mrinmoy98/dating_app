import type {
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
} from "@react-navigation/material-top-tabs";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import type { ParamListBase, TabNavigationState } from "@react-navigation/native";
import { withLayoutContext } from "expo-router";
import React from "react";
import AppTabBar from "../components/Shared/AppTabBar";

const { Navigator } = createMaterialTopTabNavigator();

/**
 * Instagram / Facebook style tabs: slide left-right to move to the next screen,
 * or tap the bar. Built on the top-tab navigator (the only one with a pager)
 * but drawn with our own bottom bar.
 */
const SwipeTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

export default function TabLayout() {
  return (
    <SwipeTabs
      tabBarPosition="bottom"
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: true,
        // Every page stays mounted — with lazy pages the pager refuses to
        // swipe back towards a screen that was never rendered.
        lazy: false,
      }}
    >
      {/* The swipe-card stack owns horizontal drags here, so paging is off. */}
      <SwipeTabs.Screen name="Discover" options={{ swipeEnabled: false }} />
      <SwipeTabs.Screen name="Reels" />
      <SwipeTabs.Screen name="Matches" />
      <SwipeTabs.Screen name="Messages" />
      <SwipeTabs.Screen name="Profile" />
    </SwipeTabs>
  );
}
