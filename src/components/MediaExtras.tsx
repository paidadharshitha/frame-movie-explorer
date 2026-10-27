import { useState } from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  useMediaPeople,
  useSeasonEpisodes,
  useSeriesSeasons,
  useSimilarMedia,
} from '../hooks/useMediaExtras';
import { fonts, useTheme, useThemedStyles, type ThemeColors } from '../theme';
import type { Movie } from '../types/movie';
import { AppText, Button, Icon, InlineNotice, Rating } from './ui';
import { MovieCard } from './MovieCard';

function SectionStatus({
  loading,
  paused,
  error,
  retry,
}: {
  loading: boolean;
  paused: boolean;
  error: boolean;
  retry: () => void;
}) {
  const { colors } = useTheme();
  if (paused)
    return (
      <InlineNotice message="Waiting for a connection. This section will load when you’re back online." />
    );
  if (loading)
    return (
      <ActivityIndicator
        accessibilityLabel="Loading title information"
        color={colors.accent}
        style={{ padding: 24 }}
      />
    );
  if (error)
    return (
      <InlineNotice
        message="Couldn’t load this section. Your title is still available."
        action="Retry"
        onAction={retry}
        warning
      />
    );
  return null;
}

function People({ id }: { id: string }) {
  const query = useMediaPeople(id);
  const { colors, reduceMotion } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.content}>
      <SectionStatus
        loading={query.isPending}
        paused={query.fetchStatus === 'paused'}
        error={query.isError}
        retry={() => void query.refetch()}
      />
      {query.data && (
        <>
          {query.data.crew.length > 0 && (
            <View style={styles.crew}>
              {query.data.crew.slice(0, 8).map((person) => (
                <View key={`${person.id}-${person.role}`} style={styles.credit}>
                  <AppText style={styles.name}>{person.name}</AppText>
                  <AppText style={styles.muted}>{person.role}</AppText>
                </View>
              ))}
            </View>
          )}
          {query.data.cast.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.people}
            >
              {query.data.cast.slice(0, 20).map((person) => (
                <View key={`${person.id}-${person.role}`} style={styles.person}>
                  <View style={styles.portrait}>
                    <Icon name="person-outline" color={colors.subtle} size={28} />
                    {person.imageUrl && (
                      <Image
                        source={{ uri: person.imageUrl }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={reduceMotion ? 0 : 160}
                      />
                    )}
                  </View>
                  <AppText style={styles.name} numberOfLines={2}>
                    {person.name}
                  </AppText>
                  <AppText style={styles.muted} numberOfLines={3}>
                    {person.role}
                  </AppText>
                </View>
              ))}
            </ScrollView>
          )}
          {!query.data.cast.length && !query.data.crew.length && (
            <AppText style={styles.muted}>
              Cast and crew haven’t been listed for this title yet.
            </AppText>
          )}
        </>
      )}
    </View>
  );
}

function Similar({ id }: { id: string }) {
  const query = useSimilarMedia(id);
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.content}>
      <SectionStatus
        loading={query.isPending}
        paused={query.fetchStatus === 'paused'}
        error={query.isError}
        retry={() => void query.refetch()}
      />
      {query.data &&
        (query.data.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.similar}
          >
            {query.data.slice(0, 16).map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                width={140}
                showSave={Boolean(movie.mediaType)}
              />
            ))}
          </ScrollView>
        ) : (
          <AppText style={styles.muted}>
            No related titles available yet. Discover has more to explore.
          </AppText>
        ))}
    </View>
  );
}

function Episodes({ id, season }: { id: string; season: number }) {
  const query = useSeasonEpisodes(id, season);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const styles = useThemedStyles(createStyles);
  const allEpisodes = [
    ...new Map(
      query.data?.pages.flatMap((page) => page.episodes).map((episode) => [episode.id, episode]) ??
        [],
    ).values(),
  ];
  // Keep long-running series bounded inside the parent detail ScrollView.
  const currentPage = Math.min(page, Math.max(0, Math.ceil(allEpisodes.length / 20) - 1));
  const episodes = allEpisodes.slice(currentPage * 20, (currentPage + 1) * 20);
  const nextLoaded = allEpisodes.length > (currentPage + 1) * 20;
  const next = async () => {
    if (nextLoaded) {
      setPage(currentPage + 1);
      setExpanded(null);
      return;
    }
    const result = await query.fetchNextPage();
    if (
      !result.isError &&
      result.data &&
      result.data.pages.flatMap((item) => item.episodes).length > (currentPage + 1) * 20
    ) {
      setPage(currentPage + 1);
      setExpanded(null);
    }
  };
  return (
    <View style={styles.episodes}>
      <SectionStatus
        loading={query.isPending}
        paused={query.fetchStatus === 'paused'}
        error={query.isError}
        retry={() => void query.refetch()}
      />
      {(allEpisodes.length > 20 || query.hasNextPage) && (
        <View style={styles.episodeNavigation}>
          <Button
            secondary
            disabled={currentPage === 0}
            onPress={() => {
              setPage(currentPage - 1);
              setExpanded(null);
            }}
          >
            Previous
          </Button>
          <AppText style={styles.muted}>Page {currentPage + 1}</AppText>
          <Button
            secondary
            disabled={(!nextLoaded && !query.hasNextPage) || query.fetchStatus === 'paused'}
            loading={query.isFetchingNextPage && query.fetchStatus !== 'paused'}
            onPress={() => void next()}
          >
            Next
          </Button>
        </View>
      )}
      {episodes.map((episode) => (
        <View key={episode.id} style={styles.episode}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Episode ${episode.number}: ${episode.title}`}
            accessibilityState={{ expanded: expanded === episode.id }}
            style={styles.episodeHeader}
            onPress={() => setExpanded(expanded === episode.id ? null : episode.id)}
          >
            <AppText style={styles.episodeNumber}>
              {String(episode.number).padStart(2, '0')}
            </AppText>
            <View style={styles.episodeTitle}>
              <AppText style={styles.name}>{episode.title}</AppText>
              {episode.airDate && (
                <AppText style={styles.muted}>{episode.airDate.slice(0, 10)}</AppText>
              )}
            </View>
            <Icon name={expanded === episode.id ? 'chevron-up' : 'chevron-down'} size={18} />
          </Pressable>
          {expanded === episode.id && (
            <View style={styles.episodeBody}>
              <AppText style={styles.description}>
                {episode.overview || 'An episode overview isn’t available yet.'}
              </AppText>
              {episode.rating != null && <Rating value={episode.rating} />}
            </View>
          )}
        </View>
      ))}
      {query.data && episodes.length === 0 && (
        <AppText style={styles.muted}>Episodes haven’t been listed for this season yet.</AppText>
      )}
    </View>
  );
}

function Seasons({ movie }: { movie: Movie }) {
  const query = useSeriesSeasons(movie.id);
  const [selected, setSelected] = useState<number | null>(null);
  const styles = useThemedStyles(createStyles);
  const season =
    query.data?.find((item) => item.number === selected) ??
    query.data?.find((item) => item.number > 0) ??
    query.data?.[0];
  return (
    <View style={styles.content}>
      <SectionStatus
        loading={query.isPending}
        paused={query.fetchStatus === 'paused'}
        error={query.isError}
        retry={() => void query.refetch()}
      />
      {movie.provider === 'jikan' && (
        <AppText style={styles.muted}>
          This catalog lists each anime season as its own title.
        </AppText>
      )}
      {!!query.data?.length && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.seasonTabs}
        >
          {query.data.map((item) => (
            <Pressable
              key={item.number}
              accessibilityRole="button"
              accessibilityState={{ selected: season?.number === item.number }}
              onPress={() => setSelected(item.number)}
              style={[styles.season, season?.number === item.number && styles.selectedSeason]}
            >
              <AppText style={styles.name}>
                {item.name}
                {item.episodeCount != null ? ` · ${item.episodeCount}` : ''}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      )}
      {season ? (
        <Episodes key={`${movie.id}-${season.number}`} id={movie.id} season={season.number} />
      ) : (
        query.data && (
          <AppText style={styles.muted}>Season information isn’t available yet.</AppText>
        )
      )}
    </View>
  );
}

export function MediaExtras({ movie }: { movie: Movie }) {
  const [section, setSection] = useState('people');
  const styles = useThemedStyles(createStyles);
  const tabs = [
    { id: 'people', label: 'Cast & crew' },
    { id: 'similar', label: 'More like this' },
    ...(movie.mediaType === 'series' ? [{ id: 'episodes', label: 'Episodes' }] : []),
  ];
  return (
    <View style={styles.root}>
      <AppText accessibilityRole="header" style={styles.heading}>
        Behind the story
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {tabs.map((tab) => (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: section === tab.id }}
            onPress={() => setSection(tab.id)}
            style={[styles.tab, section === tab.id && styles.activeTab]}
          >
            <AppText style={[styles.tabText, section === tab.id && styles.activeTabText]}>
              {tab.label}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>
      {section === 'people' ? (
        <People id={movie.id} />
      ) : section === 'similar' ? (
        <Similar id={movie.id} />
      ) : (
        <Seasons movie={movie} />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { marginTop: 36 },
    heading: { fontFamily: fonts.display, fontSize: 30, marginBottom: 12 },
    tabs: { gap: 24, borderBottomWidth: 1, borderColor: colors.border },
    tab: {
      minHeight: 48,
      justifyContent: 'center',
      borderBottomWidth: 2,
      borderColor: 'transparent',
    },
    activeTab: { borderColor: colors.accent },
    tabText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted },
    activeTabText: { color: colors.text },
    content: { paddingTop: 20, gap: 16 },
    muted: { color: colors.muted, fontSize: 12, lineHeight: 19 },
    name: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 20 },
    crew: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
    credit: { maxWidth: 220 },
    people: { gap: 16, paddingBottom: 8 },
    person: { width: 108, gap: 4 },
    portrait: {
      width: 108,
      height: 136,
      backgroundColor: colors.raised,
      borderRadius: 12,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
    },
    similar: { gap: 16, paddingBottom: 8 },
    seasonTabs: { gap: 8 },
    season: {
      minHeight: 48,
      paddingHorizontal: 16,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 24,
    },
    selectedSeason: { backgroundColor: colors.raised, borderColor: colors.text },
    episodes: { gap: 4 },
    episodeNavigation: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginVertical: 12,
    },
    episode: { borderBottomWidth: 1, borderColor: colors.border },
    episodeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 16,
      minHeight: 64,
    },
    episodeTitle: { flex: 1 },
    episodeNumber: {
      color: colors.muted,
      width: 30,
      fontSize: 16,
      fontFamily: fonts.medium,
      fontVariant: ['tabular-nums'],
    },
    episodeBody: { paddingLeft: 44, paddingBottom: 20, gap: 12, alignItems: 'flex-start' },
    description: { color: colors.muted, fontSize: 14, lineHeight: 23 },
  });
