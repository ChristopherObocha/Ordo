import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf="house.fill" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="schedule">
        <Icon sf="calendar.badge.exclamationmark" drawable="custom_calendar_badge_exclamationmark_drawable" />
        <Label>My Schedule</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="availability">
        <Icon sf="calendar" drawable="custom_calendar_drawable" />
        <Label>Availability</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="clergy">
        <Icon sf="person.fill" drawable="custom_person_drawable" />
        <Label>Clergy</Label>
      </NativeTabs.Trigger>
    </NativeTabs>  
  );
}
