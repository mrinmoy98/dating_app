import React from "react";
import { Keyboard, Platform, TouchableWithoutFeedback } from "react-native";

/**
 * Tap-outside-to-dismiss-keyboard wrapper.
 *
 * On WEB a full-screen TouchableWithoutFeedback swallows pointer events, so
 * buttons/inputs inside it stop responding to clicks. There is no soft keyboard
 * on web anyway, so we render the children directly there.
 */
export default function DismissKeyboard({ children }: { children: React.ReactNode }) {
  if (Platform.OS === "web") return <>{children}</>;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {children}
    </TouchableWithoutFeedback>
  );
}
