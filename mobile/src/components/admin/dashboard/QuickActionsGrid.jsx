import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import ApplePressable from '../../ApplePressable';

export const QuickActionsGrid = ({
  onGoToSchedule,
  onGoToMembers,
  onGoToShifts,
  onPublishSchedule,
  publishing = false,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>THAO TÁC NHANH</Text>

      <View style={styles.actionsRow}>
        <ApplePressable
          style={styles.actionBtn}
          onPress={onGoToSchedule}
          activeScale={0.92}
        >
          <View style={styles.btnInner}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="sparkles" size={20} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Xếp lịch ca</Text>
          </View>
        </ApplePressable>

        <ApplePressable
          style={styles.actionBtn}
          onPress={onGoToMembers}
          activeScale={0.92}
        >
          <View style={styles.btnInner}>
            <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="person-add" size={20} color="#2563EB" />
            </View>
            <Text style={styles.actionLabel}>Mời nhân viên</Text>
          </View>
        </ApplePressable>

        <ApplePressable
          style={styles.actionBtn}
          onPress={onGoToShifts}
          activeScale={0.92}
        >
          <View style={styles.btnInner}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time" size={20} color="#D97706" />
            </View>
            <Text style={styles.actionLabel}>Quản lý ca</Text>
          </View>
        </ApplePressable>

        <ApplePressable
          style={styles.actionBtn}
          onPress={onPublishSchedule}
          disabled={publishing}
          activeScale={0.92}
        >
          <View style={styles.btnInner}>
            <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="paper-plane" size={20} color={colors.success} />
            </View>
            <Text style={styles.actionLabel}>
              {publishing ? 'Đang gửi...' : 'Xuất bản'}
            </Text>
          </View>
        </ApplePressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  actionBtn: {
    alignItems: 'center',
    flex: 1,
  },
  btnInner: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
});

export default QuickActionsGrid;
