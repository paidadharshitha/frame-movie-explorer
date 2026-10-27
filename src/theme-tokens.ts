export type ThemeColors = {
  background: string;
  surface: string;
  raised: string;
  text: string;
  muted: string;
  subtle: string;
  border: string;
  accent: string;
  onAccent: string;
  error: string;
  warning: string;
  selection: string;
  selectionBorder: string;
};

export const darkColors: ThemeColors = {
  background: '#111512',
  surface: '#1B211C',
  raised: '#242C25',
  text: '#F5F3E9',
  muted: '#A6B0A4',
  subtle: '#899685',
  border: '#333D33',
  accent: '#D5ED86',
  onAccent: '#18220C',
  error: '#FFB4A6',
  warning: '#EBC888',
  selection: '#26331C',
  selectionBorder: '#5A7139',
};

export const lightColors: ThemeColors = {
  background: '#F6F4EC',
  surface: '#ECEFE3',
  raised: '#E3E8D9',
  text: '#182217',
  muted: '#53614F',
  subtle: '#56664F',
  border: '#CED5C5',
  accent: '#365A20',
  onAccent: '#FFFFFF',
  error: '#A32C24',
  warning: '#7A5614',
  selection: '#DFEACD',
  selectionBorder: '#789163',
};

export const fonts = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
  display: 'InstrumentSerif_400Regular',
};
export const layout = { maxWidth: 1180, gutter: 24, radius: 12 };
