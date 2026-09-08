import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import Icon from 'react-native-vector-icons/Feather';

export const CalendarScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>Performance History</Text>
        
        {/* Mock Calendar Grid */}
        <View style={styles.calendarCard}>
          <Text style={styles.monthTitle}>September 2026</Text>
          <View style={styles.grid}>
            {Array.from({length: 30}).map((_, i) => {
              let bg = colors.surfaceContainer;
              if (i < 10) bg = '#4e3b8c'; // Green-ish replacement for mock (using secondary container)
              if (i === 10 || i === 12) bg = colors.tertiary; 
              if (i === 11) bg = colors.errorContainer; 
              
              return (
                <View key={i} style={[styles.dayCell, { backgroundColor: bg }]}>
                  <Text style={styles.dayText}>{i + 1}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Selected Day Detail */}
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailDate}>Sept 8, 2026</Text>
            <Icon name="zap" size={20} color={colors.tertiary} />
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Reviewed</Text>
            <Text style={styles.statValue}>84 / 120</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Accuracy</Text>
            <Text style={styles.statValue}>92%</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16 },
  header: { fontSize: 28, fontWeight: 'bold', color: colors.onSurface, marginBottom: 24, marginTop: 16 },
  calendarCard: { backgroundColor: colors.surfaceContainerLow, borderRadius: 16, padding: 16, marginBottom: 24 },
  monthTitle: { fontSize: 18, fontWeight: '600', color: colors.onSurface, marginBottom: 16, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 8 },
  dayCell: { width: '12%', aspectRatio: 1, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  dayText: { color: colors.onSurface, fontSize: 12 },
  detailCard: { backgroundColor: colors.surfaceContainer, borderRadius: 16, padding: 20 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  detailDate: { fontSize: 18, fontWeight: 'bold', color: colors.onSurface },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  statLabel: { color: colors.onSurfaceVariant, fontSize: 16 },
  statValue: { color: colors.primary, fontSize: 16, fontWeight: 'bold' }
});
