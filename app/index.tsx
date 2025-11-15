import React, { useContext, useState, useEffect } from 'react';
import { StyleSheet, Alert, View, Text } from 'react-native';
import MapView, { Marker as MapMarker, LongPressEvent } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { DatabaseContext } from './context/DatabaseContext';
import { Marker } from './types';

export default function Index() {
  const { getMarkers, addMarker, isLoading, error } = useContext(DatabaseContext)!;
  const router = useRouter();
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(false);

  useEffect(() => {
    const loadMarkers = async () => {
      try {
        const loadedMarkers = await getMarkers();
        setMarkers(loadedMarkers);
      } catch (err) {
        Alert.alert('Ошибка', 'Не удалось загрузить маркеры.');
      }
    };
    if (!isLoading) loadMarkers();
  }, [isLoading, getMarkers]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!mapLoaded) {
        setLoadingError(true);
        Alert.alert('Ошибка', 'Проблема с загрузкой карты. Проверьте интернет-соединение или API ключи.');
      }
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [mapLoaded]);

  const handleLongPress = async (event: LongPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    try {
      const newId = await addMarker(latitude, longitude);
      setMarkers((prev) => [...prev, { id: newId.toString(), latitude, longitude }]);
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось добавить маркер.');
    }
  };

  const handleMarkerPress = (marker: Marker) => {
    router.push({ pathname: '/markers/[id]', params: { id: marker.id.toString() } });
  };

  const handleMapReady = () => {
    setMapLoaded(true);
  };

  if (loadingError || error) {
    return (
      <View style={styles.container}>
        <Text>Ошибка загрузки: {error?.message || 'Карта не загрузилась.'}</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Загрузка базы данных...</Text>
      </View>
    );
  }

  return (
    <MapView
      style={styles.map}
      onLongPress={handleLongPress}
      onMapReady={handleMapReady}
      initialRegion={{
        latitude: 34.0522,
        longitude: -122.2437,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    >
      {markers.map((marker) => (
        <MapMarker
          key={marker.id}
          coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
          onPress={() => handleMarkerPress(marker)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});