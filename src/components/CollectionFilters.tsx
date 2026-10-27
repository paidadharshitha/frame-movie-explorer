import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { colors, fonts } from '../theme';
import { AppText, Icon } from './ui';
import type { MovieFilters } from '../lib/discovery';

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && { opacity: 0.7 },
      ]}
    >
      {selected && <Icon name="checkmark" color={colors.accent} size={16} />}
      <AppText style={[styles.chipText, selected && { color: colors.accent }]}>{label}</AppText>
    </Pressable>
  );
}

export function CollectionFilters({
  genres,
  filters,
  onChange,
  hideWatched,
  onHideWatchedChange,
}: {
  genres: string[];
  filters: MovieFilters;
  onChange: (filters: MovieFilters) => void;
  hideWatched: boolean;
  onHideWatchedChange: (value: boolean) => void;
}) {
  const options =
    filters.genre && !genres.includes(filters.genre) ? [...genres, filters.genre] : genres;
  return (
    <View style={styles.panel}>
      <AppText style={styles.label}>What are you in the mood for?</AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        <FilterChip
          label="All genres"
          selected={filters.genre === null}
          onPress={() => onChange({ ...filters, genre: null })}
        />
        {options.map((genre) => (
          <FilterChip
            key={genre}
            label={genre}
            selected={filters.genre === genre}
            onPress={() => onChange({ ...filters, genre: filters.genre === genre ? null : genre })}
          />
        ))}
      </ScrollView>
      <View style={styles.options}>
        <FilterChip
          label="Rated 8+"
          selected={filters.minimumRating === 8}
          onPress={() =>
            onChange({ ...filters, minimumRating: filters.minimumRating === 8 ? null : 8 })
          }
        />
        <FilterChip
          label="Hide watched"
          selected={hideWatched}
          onPress={() => onHideWatchedChange(!hideWatched)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { paddingTop: 8, paddingBottom: 18, gap: 12 },
  label: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  row: { gap: 8, paddingRight: 24 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selected: { backgroundColor: '#26331C', borderColor: '#5A7139' },
  chipText: { fontFamily: fonts.medium, fontSize: 12, color: colors.text },
});
