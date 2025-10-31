import React, { useContext, useCallback } from 'react';
import { View, Text, StyleSheet, Button, FlatList, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MarkersContext } from '../context/MarkersContext';

export default function MarkerDetails() {
  const params = useLocalSearchParams<{ id: string }>();
  const { id } = params;
  const router = useRouter();
  const { getMarkerById, addImageToMarker, removeImageFromMarker } = useContext(MarkersContext)!;
  
  const marker = getMarkerById(id);

  if (!marker) {
    Alert.alert('Ошибка', 'Маркер не найден. Возвращаемся на карту.');
    router.back();
    return null;
  }

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
        addImageToMarker(id, result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Проблема с выбором изображения.');
      console.error('Ошибка выбора изображения:', error);
    }
  }, [id, addImageToMarker]);

  const handleRemoveImage = useCallback((imageUri: string) => {
    Alert.alert(
      'Удаление',
      'Вы уверены, что хотите удалить это изображение?',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить', onPress: () => removeImageFromMarker(id, imageUri) },
      ]
    );
  }, [id, removeImageFromMarker]);

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Детали маркера</Text>
      <Text>Широта: {marker.latitude.toFixed(6)}</Text>
      <Text>Долгота: {marker.longitude.toFixed(6)}</Text>
      
      <Text style={styles.subtitle}>Изображения:</Text>
      <FlatList
        data={marker.images}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={styles.imageContainer}>
            <Image source={{ uri: item }} style={styles.image} />
            <Button title="Удалить" onPress={() => handleRemoveImage(item)} color="red" />
          </View>
        )}
        ListEmptyComponent={<Text>Нет изображений.</Text>}
      />
      <View style={styles.buttonContainer}>
          <Button title="Добавить изображение" onPress={handleAddImage} />
          <Button title="Назад на карту" onPress={handleBack} />
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 48
  },
});
