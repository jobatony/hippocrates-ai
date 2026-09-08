import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import Icon from 'react-native-vector-icons/Feather';

export const AccountScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>JD</Text>
        </View>
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.email}>john.doe@medstudent.edu</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>4,291</Text>
          <Text style={styles.statLbl}>Reviewed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>12</Text>
          <Text style={styles.statLbl}>Current Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>45</Text>
          <Text style={styles.statLbl}>Best Streak</Text>
        </View>
      </View>

      <View style={styles.menuList}>
        {['Notifications', 'Change Password', 'Help & Support'].map((item, i) => (
          <TouchableOpacity key={i} style={styles.menuItem}>
            <Text style={styles.menuText}>{item}</Text>
            <Icon name="chevron-right" size={20} color={colors.outline} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  profileSection: { alignItems: 'center', marginVertical: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surfaceContainerHighest, borderWidth: 2, borderColor: colors.primaryContainer, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  initials: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  name: { fontSize: 24, fontWeight: 'bold', color: colors.onSurface, marginBottom: 4 },
  email: { fontSize: 14, color: colors.onSurfaceVariant },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  statCard: { flex: 1, backgroundColor: colors.surfaceContainer, borderRadius: 12, padding: 16, alignItems: 'center', marginHorizontal: 4 },
  statVal: { fontSize: 18, fontWeight: 'bold', color: colors.primary, marginBottom: 4 },
  statLbl: { fontSize: 12, color: colors.outline, textAlign: 'center' },
  menuList: { backgroundColor: colors.surfaceContainerLow, borderRadius: 12, overflow: 'hidden', marginBottom: 32 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  menuText: { color: colors.onSurface, fontSize: 16 },
  logoutBtn: { backgroundColor: colors.errorContainer, padding: 16, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: colors.error, fontSize: 16, fontWeight: 'bold' }
});
