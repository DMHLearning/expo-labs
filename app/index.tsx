import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Alert, View, Text } from 'react-native';
import MapView, { Marker as MapMarker, LongPressEvent, Circle } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { DatabaseContext } from './context/DatabaseContext';
import { Marker } from './types';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

const PROXIMITY_THRESHOLD = 100;

function calculateDistance(coord1: { latitude: number; longitude: number }, coord2: { latitude: number; longitude: number }): number {
  const R = 6371e3;
  const phi1 = coord1.latitude * Math.PI / 180;
  const phi2 = coord2.latitude * Math.PI / 180;
  const delta_phi = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const delta_lambda = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  const a = Math.sin(delta_phi / 2) * Math.sin(delta_phi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(delta_lambda / 2) * Math.sin(delta_lambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function Index() {
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [notificationsPermissionDenied, setNotificationsPermissionDenied] = useState(false);

  const { getMarkers, addMarker, notificationManager, isLoading, error } = useContext(DatabaseContext)!;
  const router = useRouter();
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const markersRef = useRef<Marker[]>(markers);
  useEffect(() => {
    markersRef.current = markers;
  }, [markers]);

  const loadMarkers = useCallback(async () => {
    try {
      const loadedMarkers = await getMarkers();
      setMarkers(loadedMarkers);
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось загрузить маркеры.');
    }
  }, [getMarkers]);

  useFocusEffect(
    useCallback(() => {
      if (!isLoading) loadMarkers();
    }, [isLoading, loadMarkers])
  );

  useEffect(() => {
    const setupLocationAndNotifications = async () => {
      try {
        const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        if (locStatus !== 'granted') {
          if (!locationPermissionDenied) {
            Alert.alert('Предупреждение', 'Доступ к местоположению не предоставлен. Приложение работает с ограниченным функционалом.');
            setLocationPermissionDenied(true);
          }
          return;
        }
        const { status: notifStatus } = await Notifications.requestPermissionsAsync();
        if (notifStatus !== 'granted') {
          if (!notificationsPermissionDenied) {
            Alert.alert('Предупреждение', 'Доступ к уведомлениям не предоставлен. Приложение работает с ограниченным функционалом.');
            setNotificationsPermissionDenied(true);
          }
          return;
        }

        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 5,
          },
          (location) => {
            const coords = location.coords;
            setCurrentLocation(coords);

            markersRef.current.forEach((marker) => {
              const dist = calculateDistance(coords, marker);
              const isNear = dist < PROXIMITY_THRESHOLD;
              const wasNotified = notificationManager.activeNotifications.has(marker.id);
              if (isNear && !wasNotified) {
                notificationManager.showNotification(marker);
              } else if (!isNear && wasNotified) {
                notificationManager.removeNotification(marker.id);
              }
            });
          }
        );
      } catch (err: any) {
        Alert.alert('Ошибка', `Проблема с геолокацией: ${err.message}`);
      }
    };

    if (!isLoading) {
      setupLocationAndNotifications();
    }

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, [isLoading, notificationManager]);

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
    router.push({ pathname: '/markers/[id]', params: { id: marker.id } });
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
      {markers.map((marker) => (
        <Circle
          key={`${marker.id}-circle`}
          center={{ latitude: marker.latitude, longitude: marker.longitude }}
          radius={PROXIMITY_THRESHOLD}
          fillColor="rgba(255, 0, 0, 0.2)"
          strokeColor="red"
          strokeWidth={1}
        />
      ))}
      {currentLocation && (
        <MapMarker
          coordinate={currentLocation}
          pinColor="blue"
        />
      )}
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
