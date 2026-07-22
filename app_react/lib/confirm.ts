import { Alert, Platform } from "react-native";

/** react-native-web has no Alert dialog, so fall back to the browser's own. */
function nativeConfirm(title: string, message: string, confirmLabel: string): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      { text: confirmLabel, style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

function notify(title: string, message?: string) {
  if (Platform.OS === "web") window.alert(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
}

interface ConfirmOptions {
  /** Question shown in bold, e.g. "Delete this reel?" */
  title: string;
  /** Extra line explaining what happens. */
  message?: string;
  /** Label of the destructive button. Defaults to "Delete". */
  confirmLabel?: string;
  /** Shown after the action finishes. Pass null to stay silent. */
  successTitle?: string | null;
  successMessage?: string;
  /** The actual work. Throw to surface an error popup. */
  onConfirm: () => void | Promise<void>;
}

/**
 * Standard flow for every remove / delete style action across the app:
 * confirmation popup → OK → run it → "done" popup (or an error popup).
 *
 * Used by unfollow, remove follower, delete reel, delete photo, delete
 * notification, etc. so they all behave the same way.
 */
export async function confirmAction({
  title,
  message = "",
  confirmLabel = "Delete",
  successTitle = "Done",
  successMessage,
  onConfirm,
}: ConfirmOptions): Promise<boolean> {
  const ok = await nativeConfirm(title, message, confirmLabel);
  if (!ok) return false;

  try {
    await onConfirm();
    if (successTitle) notify(successTitle, successMessage);
    return true;
  } catch (e: any) {
    notify("Something went wrong", e?.message ?? "Please try again.");
    return false;
  }
}
