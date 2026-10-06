import { useColorScheme } from 'react-native';

const light = {
  background: '#F6F8F7',
  card: '#FFFFFF',
  text: '#16231F',
  muted: '#5E6B67',
  border: '#DDE4E1',
  primary: '#2E7D6B',
  primaryText: '#FFFFFF',
  danger: '#B3261E',
  chip: '#E6F1EE',
};

const dark: typeof light = {
  background: '#0F1513',
  card: '#18201D',
  text: '#E6EEEB',
  muted: '#9AA8A3',
  border: '#2A3531',
  primary: '#5CC2A6',
  primaryText: '#0F1513',
  danger: '#F2B8B5',
  chip: '#21302B',
};

export type Colors = typeof light;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}

export const memberColors = ['#2E7D6B', '#C2185B', '#1565C0', '#EF6C00', '#6A1B9A', '#00838F', '#8D6E63'];
