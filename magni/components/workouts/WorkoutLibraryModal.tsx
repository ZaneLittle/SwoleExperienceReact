import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { WorkoutDay } from '../../lib/models/WorkoutDay'
import { BankedWorkout } from '../../lib/models/BankedWorkout'
import { useThemeColors } from '../../hooks/useThemeColors'
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '../../lib/constants/ui'

export type WorkoutLibrarySource = 'all' | 'active' | 'bank'

export interface ActiveLibraryEntry {
  kind: 'active';
  key: string;
  workout: WorkoutDay;
}

export interface BankedLibraryEntry {
  kind: 'banked';
  key: string;
  workout: BankedWorkout;
}

export type WorkoutLibraryEntry = ActiveLibraryEntry | BankedLibraryEntry

interface WorkoutLibraryModalProps {
  activeWorkouts: WorkoutDay[];
  bankedWorkouts: BankedWorkout[];
  onSelectActive: (workout: WorkoutDay) => void;
  onSelectBanked: (workout: BankedWorkout) => void;
  onClose: () => void;
  onDeleteBanked?: (workout: BankedWorkout) => void;
  initialSource?: WorkoutLibrarySource;
}

const FILTER_OPTIONS: { id: WorkoutLibrarySource; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Program' },
  { id: 'bank', label: 'Bank' },
]

const formatBankedAt = (iso: string): string => {
  const ts = Date.parse(iso)
  if (!Number.isFinite(ts)) return ''
  const date = new Date(ts)
  return date.toLocaleDateString()
}

export const WorkoutLibraryModal: React.FC<WorkoutLibraryModalProps> = ({
  activeWorkouts,
  bankedWorkouts,
  onSelectActive,
  onSelectBanked,
  onClose,
  onDeleteBanked,
  initialSource = 'all',
}) => {
  const colors = useThemeColors()
  const [search, setSearch] = useState('')
  const [source, setSource] = useState<WorkoutLibrarySource>(initialSource)

  const entries = useMemo<WorkoutLibraryEntry[]>(() => {
    const query = search.trim().toLowerCase()
    const matches = (name: string) => query === '' || name.toLowerCase().includes(query)

    const activeEntries: WorkoutLibraryEntry[] = activeWorkouts
      .filter(w => matches(w.name))
      .map(w => ({ kind: 'active', key: `active-${w.id}`, workout: w }))

    const bankedEntries: WorkoutLibraryEntry[] = bankedWorkouts
      .filter(w => matches(w.name))
      .map(w => ({ kind: 'banked', key: `banked-${w.id}`, workout: w }))

    if (source === 'active') return activeEntries
    if (source === 'bank') return bankedEntries
    return [...activeEntries, ...bankedEntries]
  }, [activeWorkouts, bankedWorkouts, search, source])

  const renderEmpty = () => {
    let message = 'No workouts found'
    if (source === 'bank') message = 'Your workout bank is empty'
    if (source === 'active') message = 'No existing workouts available'
    if (search.trim() !== '') message = `No workouts match "${search.trim()}"`

    return (
      <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
        {message}
      </Text>
    )
  }

  const renderItem = (entry: WorkoutLibraryEntry) => {
    const workout = entry.workout
    const subtitleParts = [
      `${workout.weight} lb`,
      `${workout.sets} sets`,
      `${workout.reps} reps`,
    ]
    const isBanked = entry.kind === 'banked'

    return (
      <View
        key={entry.key}
        style={[
          styles.item,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={styles.itemBody}
          onPress={() =>
            isBanked
              ? onSelectBanked(entry.workout)
              : onSelectActive(entry.workout)
          }
          accessibilityLabel={`Add ${workout.name} from ${isBanked ? 'bank' : 'program'}`}
          accessibilityRole="button"
        >
          <Text style={[styles.itemName, { color: colors.text.primary }]}>
            {workout.name}
          </Text>
          <Text style={[styles.itemDetails, { color: colors.text.secondary }]}>
            {subtitleParts.join(' • ')}
          </Text>
          {isBanked && (
            <Text style={[styles.itemMeta, { color: colors.text.tertiary }]}>
              Saved {formatBankedAt(entry.workout.bankedAt)}
            </Text>
          )}
        </TouchableOpacity>
        <View
          style={[
            styles.badgeColumn,
            { paddingRight: isBanked ? SPACING.xs : SPACING.lg },
          ]}
        >
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isBanked ? colors.warning : colors.primary,
              },
            ]}
          >
            <Text style={styles.badgeText}>
              {isBanked ? 'Bank' : 'Program'}
            </Text>
          </View>
        </View>
        {isBanked && onDeleteBanked && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDeleteBanked(entry.workout)}
            accessibilityLabel={`Remove ${workout.name} from bank`}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.deleteText, { color: colors.error }]}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <View style={styles.overlay}>
      <View style={[styles.modal, { backgroundColor: colors.surface }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Workout Library
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close workout library"
            accessibilityRole="button"
          >
            <Text style={[styles.closeText, { color: colors.text.secondary }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controls}>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: colors.background,
                color: colors.text.primary,
                borderColor: colors.border,
              },
            ]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name"
            placeholderTextColor={colors.text.tertiary}
            accessibilityLabel="Search workouts"
          />

          <View style={styles.filterRow}>
            {FILTER_OPTIONS.map(option => {
              const isSelected = source === option.id
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setSource(option.id)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : colors.background,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  accessibilityLabel={`Filter by ${option.label}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: isSelected ? '#fff' : colors.text.primary },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {entries.length === 0 ? renderEmpty() : entries.map(renderItem)}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modal: {
    borderRadius: BORDER_RADIUS.lg,
    width: '100%',
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  closeText: {
    fontSize: TYPOGRAPHY.sizes.lg,
  },
  controls: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  list: {
    paddingHorizontal: SPACING.md,
  },
  listContent: {
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  itemBody: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  badgeColumn: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  itemName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.xs,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  itemDetails: {
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  itemMeta: {
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: SPACING.xs,
  },
  deleteButton: {
    alignSelf: 'stretch',
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.md,
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  },
})
