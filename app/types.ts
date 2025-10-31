import { StackScreenProps } from '@react-navigation/stack';

export interface Marker {
  id: string;
  latitude: number;
  longitude: number;
  images: string[];
}

export type RootStackParamList = {
  Index: undefined;
  MarkerDetails: { id: string };
};

export type MarkerDetailsProps = StackScreenProps<RootStackParamList, 'MarkerDetails'>;

export default MarkerDetailsProps;