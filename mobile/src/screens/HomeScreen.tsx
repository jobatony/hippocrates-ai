import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import Icon from 'react-native-vector-icons/Feather';

export const HomeScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, John ??</Text>
          <Text style={styles.dateText}>Monday, September 8</Text>
        </View>

        {/* Daily Progress Card */}
        <View style={styles.card}>
          <View style={styles.ringContainer}>
            {/* Mocking circular progress visually with borders */}
            <View style={styles.ringOuter}>
              <View style={styles.ringInner}>
                <Text style={styles.ringTextMain}>84 / 120</Text>
                <Text style={styles.ringTextSub}>reviewed today</Text>
              </View>
            </View>
          </View>
          <View style={styles.progressRow}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '70%' }]} />
            </View>
            <Text style={styles.progressLabel}>Today's Progress</Text>
          </View>
        </View>

        {/* Streak Section */}
        <View style={styles.streakRow}>
          <Icon name="zap" size={32} color={colors.tertiary} />
          <View style={styles.streakTextCol}>
            <Text style={styles.streakCount}>12 <Text style={styles.streakLabel}>Day Streak</Text></Text>
            <Text style={styles.streakNote}>Review 100+ questions to keep your streak</Text>
          </View>
        </View>

        {/* Last Few Days */}
        <View style={styles.historyRow}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, idx) => {
            const isCompleted = idx < 3;
            const isMissed = idx === 3;
            return (
              <View key={idx} style={styles.historyItem}>
                <View style={[styles.historyCircle, isCompleted ? styles.completedCircle : isMissed ? styles.missedCircle : {}]}>
                  {isCompleted && <Icon name="check" size={14} color={colors.primary} />}
                </View>
                <Text style={styles.historyDay}>{day}</Text>
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={() => navigation.navigate('QuizTab')}>
          <Text style={styles.startBtnText}>Continue (32 of 120)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16 },
  header: { marginBottom: 24, marginTop: 16 },
  greeting: { fontSize: 32, fontWeight: 'bold', color: colors.onSurface, marginBottom: 4 },
  dateText: { fontSize: 16, color: colors.onSurfaceVariant },
  card: { backgroundColor: colors.surfaceContainer, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24 },
  ringContainer: { marginBottom: 24 },
  ringOuter: { width: 200, height: 200, borderRadius: 100, borderWidth: 12, borderColor: colors.primaryContainer, borderTopColor: colors.surfaceContainerHighest, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-45deg' }] },
  ringInner: { width: 176, height: 176, borderRadius: 88, backgroundColor: colors.surfaceContainer, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '45deg' }] },
  ringTextMain: { fontSize: 32, fontWeight: 'bold', color: colors.primary, marginBottom: 4 },
  ringTextSub: { fontSize: 14, color: colors.onSurfaceVariant },
  progressRow: { width: '100%', alignItems: 'center' },
  progressBarBg: { height: 6, backgroundColor: colors.surfaceContainerHighest, width: '100%', borderRadius: 3, marginBottom: 8 },
  progressBarFill: { height: '100%', backgroundColor: colors.primaryContainer, borderRadius: 3 },
  progressLabel: { fontSize: 12, color: colors.onSurfaceVariant },
  streakRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerLow, padding: 16, borderRadius: 12, marginBottom: 24 },
  streakTextCol: { marginLeft: 16 },
  streakCount: { fontSize: 24, fontWeight: 'bold', color: colors.tertiary },
  streakLabel: { fontSize: 16, fontWeight: 'normal', color: colors.onSurfaceVariant },
  streakNote: { fontSize: 12, color: colors.outline, marginTop: 4 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, paddingHorizontal: 16 },
  historyItem: { alignItems: 'center' },
  historyCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceContainerHighest, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  completedCircle: { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.primaryContainer },
  missedCircle: { backgroundColor: colors.surfaceContainerHighest, opacity: 0.5 },
  historyDay: { fontSize: 12, color: colors.outline },
  startBtn: { backgroundColor: colors.primaryContainer, padding: 18, borderRadius: 12, alignItems: 'center' },
  startBtnText: { color: '#fcf6ff', fontSize: 18, fontWeight: 'bold' }
});
