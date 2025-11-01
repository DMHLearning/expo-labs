import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Marker } from '../types';

interface MarkersContextType {
  markers: Marker[];
  addMarker: (latitude: number, longitude: number) => void;
  addImageToMarker: (markerId: string, imageUri: string) => void;
  removeImageFromMarker: (markerId: string, imageUri: string) => void;
  getMarkerById: (id: string) => Marker | undefined;
}

export const MarkersContext = createContext<MarkersContextType | undefined>(undefined);

const STORAGE_KEY = '@markers';

export const MarkersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [markers, setMarkers] = useState<Marker[]>([]);

  useEffect(() => {
    const loadMarkers = async () => {
      try {
        const storedMarkers = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedMarkers) {
          setMarkers(JSON.parse(storedMarkers));
        }
      } catch (error) {
        console.error('Ошибка загрузки маркеров:', error);
      }
    };
    loadMarkers();
  }, []);

  useEffect(() => {
    const saveMarkers = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(markers));
      } catch (error) {
        console.error('Ошибка сохранения маркеров:', error);
      }
    };
    if (markers.length > 0) {
      saveMarkers();
    }
  }, [markers]);

  const addMarker = useCallback((latitude: number, longitude: number) => {
    const newMarker: Marker = {
      id: Date.now().toString(),
      latitude,
      longitude,
      images: [],
    };
    setMarkers((prev) => [...prev, newMarker]);
  }, []);

  const addImageToMarker = useCallback((markerId: string, imageUri: string) => {
    setMarkers((prev) =>
      prev.map((marker) =>
        marker.id === markerId ? { ...marker, images: [...(marker.images || []), imageUri] } : marker
      )
    );
  }, []);

  const removeImageFromMarker = useCallback((markerId: string, imageUri: string) => {
    setMarkers((prev) =>
      prev.map((marker) =>
        marker.id === markerId
          ? { ...marker, images: (marker.images || []).filter((uri) => uri !== imageUri) }
          : marker
      )
    );
  }, []);

  const getMarkerById = useCallback((id: string) => markers.find((m) => m.id === id), [markers]);

  return (
    <MarkersContext.Provider
      value={{ markers, addMarker, addImageToMarker, removeImageFromMarker, getMarkerById }}
    >
      {children}
    </MarkersContext.Provider>
  );
};

export default MarkersContext;