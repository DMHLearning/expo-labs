import React, { useContext, useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, FlatList, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { DatabaseContext } from '../context/DatabaseContext';
import { Marker, MarkerImage } from '../types';

export default function MarkerDetails() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const { getMarkerById, getMarkerImages, addImageToMarker, removeImageFromMarker, deleteMarker } = useContext(DatabaseContext)!;

  const [marker, setMarker] = useState<Marker | null>(null);
  const [images, setImages] = useState<MarkerImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedMarker = await getMarkerById(id);
        if (!loadedMarker) {
          Alert.alert('Ошибка', 'Маркер не найден. Возвращаемся на карту.');
          router.back();
          return;
        }
        const loadedImages = await getMarkerImages(id);
        setMarker(loadedMarker);
        setImages(loadedImages);
      } catch (err) {
        Alert.alert('Ошибка', 'Не удалось загрузить данные маркера.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, getMarkerById, getMarkerImages, router]);

  const handleAddImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Разрешение на доступ к галерее не предоставлено.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0].uri) {
        await addImageToMarker(id, result.assets[0].uri);
        const updatedImages = await getMarkerImages(id);
        setImages(updatedImages);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Проблема с выбором изображения.');
      console.error('Ошибка выбора изображения:', error);
    }
  }, [id, addImageToMarker, getMarkerImages]);

  const handleRemoveImage = useCallback((imageId: number) => {
    Alert.alert(
      'Удаление',
      'Вы уверены, что хотите удалить это изображение?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          onPress: async () => {
            try {
              await removeImageFromMarker(id, imageId);
              const updatedImages = await getMarkerImages(id);
              setImages(updatedImages);
            } catch (err) {
              Alert.alert('Ошибка', 'Не удалось удалить изображение.');
            }
          },
        },
      ]
    );
  }, [id, removeImageFromMarker, getMarkerImages]);

  const handleDeleteMarker = useCallback(() => {
    Alert.alert(
      'Удаление',
      'Вы уверены, что хотите удалить этот маркер?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          onPress: async () => {
            try {
              await deleteMarker(id);
              router.back();
            } catch (err) {
              Alert.alert('Ошибка', 'Не удалось удалить маркер.');
            }
          },
        },
      ]
    );
  }, [id, deleteMarker, router]);

  const handleBack = () => {
    router.back();
  };

  if (loading || !marker) {
    return (
      <View style={styles.container}>
        <Text>Загрузка...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Детали маркера</Text>
      <Text>Широта: {marker.latitude.toFixed(6)}</Text>
      <Text>Долгота: {marker.longitude.toFixed(6)}</Text>

      <Text style={styles.subtitle}>Изображения:</Text>
      <FlatList
        data={images}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.uri }} style={styles.image} />
            <View style={styles.imageButtonContainer}>
              <Button title="Удалить" onPress={() => handleRemoveImage(item.id)} color="red" />
            </View>
          </View>
        )}
        ListEmptyComponent={<Text>Нет изображений.</Text>}
      />
      <View style={styles.buttonContainer}>
        <Button title="Добавить изображение" onPress={handleAddImage} />
        <Button title="Назад на карту" onPress={handleBack} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Удалить маркер" onPress={handleDeleteMarker} color="red" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  imageContainer: {
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  imageButtonContainer: {
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 0,
    marginBottom: 32,
  },
});