import React, { useContext, useState, useEffect } from 'react';
import { StyleSheet, Alert, View, Text } from 'react-native';
import MapView, { Marker as MapMarker, LongPressEvent } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { MarkersContext } from './context/MarkersContext';
import { Marker } from './types';

export default function Index() {
  const { markers, addMarker } = useContext(MarkersContext)!;
  const router = useRouter();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!mapLoaded) {
        setLoadingError(true);
        Alert.alert('Ошибка', 'Проблема с загрузкой карты. Проверьте интернет-соединение или API ключи.');
      }
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [mapLoaded]);

  const handleLongPress = (event: LongPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    addMarker(latitude, longitude);
  };

  const handleMarkerPress = (marker: Marker) => {
    router.push({ pathname: '/markers/[id]', params: { id: marker.id } });
  };

  const handleMapReady = () => {
    setMapLoaded(true);
  };

  if (loadingError) {
    return (
      <View style={styles.container}>
        <Text>Ошибка загрузки карты.</Text>
      </View>
    );
  }

  return (
    <MapView
      style={styles.map}
      onLongPress={handleLongPress}
      onMapReady={handleMapReady}
      initialRegion={
        {
          latitude: 34.0522,
          longitude: 118.2437,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }
      }
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