import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as SQLite from 'expo-sqlite';
import { Marker, MarkerImage } from '../types';

interface DatabaseContextType {
  addMarker: (latitude: number, longitude: number) => Promise<number>;
  deleteMarker: (id: number) => Promise<void>;
  getMarkers: () => Promise<Marker[]>;
  addImageToMarker: (markerId: number, uri: string) => Promise<void>;
  removeImageFromMarker: (markerId: number, imageId: number) => Promise<void>;
  getMarkerById: (id: number) => Promise<Marker | undefined>;
  getMarkerImages: (markerId: number) => Promise<MarkerImage[]>;
  isLoading: boolean;
  error: Error | null;
}

export const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

const DB_NAME = 'markers.db';

const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS markers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS marker_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        marker_id INTEGER NOT NULL,
        uri TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (marker_id) REFERENCES markers (id) ON DELETE CASCADE
      );
    `);
    if (__DEV__) {
      console.log('База данных инициализирована успешно.');
    }
    return db;
  } catch (error) {
    console.error('Ошибка инициализации базы данных:', error);
    throw error;
  }
};

export const DatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initDatabase()
      .then(setDb)
      .catch(setError)
      .finally(() => setIsLoading(false));

    return () => {
      if (db) {
        db.closeAsync().catch(console.error);
      }
    };
  }, []);

  const executeTransaction = useCallback(async (action: (tx: SQLite.SQLiteDatabase) => Promise<any>) => {
    if (!db) throw new Error('База данных не инициализирована');
    try {
      const result = await action(db);
      if (__DEV__) console.log('Транзакция завершена успешно.');
      return result;
    } catch (err) {
      console.error('Ошибка транзакции:', err);
      throw err;
    }
  }, [db]);

  const addMarker = useCallback(async (latitude: number, longitude: number): Promise<number> => {
    return executeTransaction(async (db) => {
      const result = await db.runAsync(
        'INSERT INTO markers (latitude, longitude) VALUES (?, ?);',
        [latitude, longitude]
      );
      return result.lastInsertRowId ?? 0;
    });
  }, [executeTransaction]);

  const deleteMarker = useCallback(async (id: number): Promise<void> => {
    await executeTransaction(async (db) => {
      await db.runAsync('DELETE FROM markers WHERE id = ?;', [id]);
    });
  }, [executeTransaction]);

  const getMarkers = useCallback(async (): Promise<Marker[]> => {
    if (!db) return [];
    return db.getAllAsync<Marker>('SELECT * FROM markers;');
  }, [db]);

  const addImageToMarker = useCallback(async (markerId: number, uri: string): Promise<void> => {
    await executeTransaction(async (db) => {
      await db.runAsync(
        'INSERT INTO marker_images (marker_id, uri) VALUES (?, ?);',
        [markerId, uri]
      );
    });
  }, [executeTransaction]);

  const removeImageFromMarker = useCallback(async (markerId: number, imageId: number): Promise<void> => {
    await executeTransaction(async (db) => {
      await db.runAsync('DELETE FROM marker_images WHERE id = ? AND marker_id = ?;', [imageId, markerId]);
    });
  }, [executeTransaction]);

  const getMarkerImages = useCallback(async (markerId: number): Promise<MarkerImage[]> => {
    if (!db) return [];
    return db.getAllAsync<MarkerImage>('SELECT * FROM marker_images WHERE marker_id = ?;', [markerId]);
  }, [db]);

  const getMarkerById = useCallback(async (id: number): Promise<Marker | undefined> => {
    if (!db) return undefined;
    const marker = await db.getFirstAsync<Marker>('SELECT * FROM markers WHERE id = ?;', [id]);
    return marker || undefined;
  }, [db]);

  if (error) {
    console.error('Глобальная ошибка БД: ', error);
  }

  return (
    <DatabaseContext.Provider
      value={{
        addMarker,
        deleteMarker,
        getMarkers,
        addImageToMarker,
        removeImageFromMarker,
        getMarkerById,
        getMarkerImages,
        isLoading,
        error,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};