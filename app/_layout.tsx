import { Stack } from "expo-router";
import { MarkersProvider } from "./context/MarkersContext";

export default function RootLayout() {
  return (
    <MarkersProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: "Карта" }} />
        <Stack.Screen name="markers/[id]" options={{ title: "Детали маркера" }} />
      </Stack>
    </MarkersProvider>
  );
}