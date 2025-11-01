export interface Marker {
  id: string;
  latitude: number;
  longitude: number;
  created_at?: string;
  images?: string[];
}

export interface MarkerImage {
  id: number;
  marker_id: number;
  uri: string;
  created_at?: string;
}

export type RootStackParamList = {
  Index: undefined;
  MarkerDetails: { id: string };
};