import Colors from "@/data/Colors";
import { AntDesign, Feather } from "@expo/vector-icons";
import React from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    View,
} from "react-native";
import Typography from "./Shared/Typography";

interface ProfileSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

type SettingItemProps = {
  icon: React.ReactNode;
  title: string;
  description?: string;
  hasToggle: boolean;
  toggleValue: boolean;
  onToggleChange: (value: boolean) => void;
  hasChevron?: boolean;
  onPress: () => void;
};

export default function ProfileSettingsModal({
  visible,
  onClose,
}: ProfileSettingsModalProps) {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [locationEnabled, setLocationEnabled] = React.useState(true);
  const [incognitoMode, setIncognitoMode] = React.useState(false);

  const SettingItem = ({
    icon,
    title,
    description,
    hasToggle,
    toggleValue,
    onToggleChange,
    hasChevron = false,
    onPress,
  }: SettingItemProps) => (
    <Pressable style={styles.settingItem} onPress={onPress}>
      <View
        style={[styles.settingIcon, { backgroundColor: Colors.lightPrimary }]}
      >
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Typography style={styles.settingTitle}>{title}</Typography>
        {description && (
          <Typography style={styles.settingDescription}>
            {description}
          </Typography>
        )}
      </View>
      {hasToggle && (
        <Switch
          value={toggleValue}
          onValueChange={onToggleChange}
          trackColor={{ false: "#D1D1D6", true: Colors.lightPrimary }}
          thumbColor={toggleValue ? Colors.primary : "#FFFFFF"}
        />
      )}
      {hasChevron && (
        <AntDesign name="right" size={20} color={Colors.primary} />
      )}
    </Pressable>
  );

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Feather name="x" size={24} color={Colors.text} />
          </Pressable>
          <Typography variant="title">Settings</Typography>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Typography variant="subtitle" style={styles.sectionTitle}>
              Account
            </Typography>

            <SettingItem
              icon={<Feather name="shield" size={20} color={Colors.primary} />}
              title="Privacy Settings"
              description="Control who can see your profile"
              hasToggle={false}
              toggleValue={false}
              onToggleChange={() => {}}
              hasChevron={true}
              onPress={() => {}}
            />

            <SettingItem
              icon={<AntDesign name="eyeo" size={20} color={Colors.primary} />}
              title="Incognito Mode"
              description="Browse profiles without being seen"
              hasToggle={true}
              toggleValue={incognitoMode}
              onToggleChange={setIncognitoMode}
              onPress={() => setIncognitoMode(!incognitoMode)}
            />
          </View>

          <View style={styles.section}>
            <Typography variant="subtitle" style={styles.sectionTitle}>
              Preferences
            </Typography>

            <SettingItem
              icon={
                <AntDesign name="filter" size={20} color={Colors.primary} />
              }
              title="Discovery Preferences"
              description="Age range, distance, and more"
              hasToggle={false}
              toggleValue={false}
              onToggleChange={() => {}}
              hasChevron={true}
              onPress={() => {}}
            />

            <SettingItem
              icon={<Feather name="map-pin" size={20} color={Colors.primary} />}
              title="Location Services"
              description="Allow access to your location"
              hasToggle={true}
              toggleValue={locationEnabled}
              onToggleChange={setLocationEnabled}
              onPress={() => setLocationEnabled(!locationEnabled)}
            />
          </View>

          <View style={styles.section}>
            <Typography variant="subtitle" style={styles.sectionTitle}>
              Notifications
            </Typography>

            <SettingItem
              icon={<Feather name="bell" size={20} color={Colors.primary} />}
              title="Push Notifications"
              description="For matches, messages, and more"
              hasToggle={true}
              toggleValue={notificationsEnabled}
              onToggleChange={setNotificationsEnabled}
              onPress={() => setNotificationsEnabled(!notificationsEnabled)}
            />

            <SettingItem
              icon={
                <Feather
                  name="message-circle"
                  size={20}
                  color={Colors.primary}
                />
              }
              title="Email Notifications"
              description="Weekly summaries and updates"
              hasToggle={true}
              toggleValue={false}
              onToggleChange={() => {}}
              onPress={() => {}}
            />
          </View>

          <View style={styles.section}>
            <Typography variant="subtitle" style={styles.sectionTitle}>
              Support
            </Typography>

            <SettingItem
              icon={<Feather name="shield" size={20} color={Colors.primary} />}
              title="Help Center"
              description="Get help with your account"
              hasToggle={false}
              toggleValue={false}
              onToggleChange={() => {}}
              hasChevron={true}
              onPress={() => {}}
            />

            <SettingItem
              icon={<Feather name="shield" size={20} color={Colors.primary} />}
              title="Privacy Policy"
              hasToggle={false}
              toggleValue={false}
              onToggleChange={() => {}}
              hasChevron={true}
              onPress={() => {}}
            />

            <SettingItem
              icon={<Feather name="shield" size={20} color={Colors.primary} />}
              title="Terms of Service"
              hasToggle={false}
              toggleValue={false}
              onToggleChange={() => {}}
              hasChevron={true}
              onPress={() => {}}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 50,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  closeButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  section: {
    backgroundColor: "white",
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.darkGray,
  },
});
