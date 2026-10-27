import { Tabs } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../src/theme';
import { Icon, type IconName } from '../../src/components/ui';

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={[styles.icon, focused && styles.active]}>
      <Icon name={name} size={21} color={focused ? colors.accent : colors.muted} />
    </View>
  );
}
export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= 1000;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarPosition: wide ? 'left' : 'bottom',
        tabBarLabelPosition: wide ? 'beside-icon' : 'below-icon',
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarActiveBackgroundColor: wide ? colors.surface : 'transparent',
        tabBarHideOnKeyboard: true,
        tabBarStyle: wide
          ? {
              width: 216,
              minWidth: 216,
              maxWidth: 216,
              backgroundColor: colors.background,
              borderRightWidth: 1,
              borderRightColor: colors.border,
              paddingTop: 40,
              paddingHorizontal: 16,
            }
          : {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              height: 72 + Math.max(insets.bottom, 8),
              paddingBottom: Math.max(insets.bottom, 8),
              paddingTop: 8,
            },
        tabBarItemStyle: wide
          ? { height: 56, marginBottom: 8, borderRadius: 12 }
          : { paddingBottom: 2 },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: wide ? 14 : 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'compass' : 'compass-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => <TabIcon name="search-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="favourites"
        options={{
          title: 'Favourites',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'bookmark' : 'bookmark-outline'} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
const styles = StyleSheet.create({
  icon: { width: 54, height: 29, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  active: { backgroundColor: '#2C3821' },
});
