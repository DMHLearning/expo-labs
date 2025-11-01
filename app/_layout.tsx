import { Stack } from 'expo-router';
import { DatabaseProvider } from './context/DatabaseContext';

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Карта' }} />
        <Stack.Screen name="markers/[id]" options={{ title: 'Детали маркера' }} />
      </Stack>
    </DatabaseProvider>
  );
}