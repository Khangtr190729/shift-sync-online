import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import ApplePressable from '../ApplePressable';

export const NextShiftCard = ({ nextShift, onOpenDetail }) => {
  if (!nextShift) return null;

  const shiftName = nextShift.shift?.name || nextShift.shiftName || 'Ca làm việc';
  const startTime = nextShift.shift?.startTime || nextShift.startTime || '';
  const endTime = nextShift.shift?.endTime || nextShift.endTime || '';
  const duration = nextShift.shift?.durationHours || nextShift.hours || 0;

  return (
    <View style={styles.nextShiftCard}>
      <View style={styles.nextShiftHeader}>
        <View style={styles.nextShiftBadge}>
          <Text style={styles.nextShiftBadgeText}>CA LÀM TIẾP THEO</Text>
        </View>
        <Text style={styles.nextShiftDate}>{nextShift.date}</Text>
      </View>

      <View style={styles.nextShiftContent}>
        <View style={styles.nextShiftInfo}>
          <Text style={styles.nextShiftName}>{shiftName}</Text>
          <View style={styles.nextShiftTimeRow}>
            <Ionicons name="time-outline" size={14} color={colors.primary} />
            <Text style={styles.nextShiftTimeText}>
              {startTime} — {endTime} ({duration}h)
            </Text>
          </View>
        </View>

        <ApplePressable
          style={styles.detailButton}
          onPress={() => onOpenDetail(nextShift)}
          activeScale={0.92}
        >
          <Text style={styles.detailButtonText}>Chi tiết</Text>
        </ApplePressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  nextShiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  nextShiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nextShiftBadge: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  nextShiftBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  nextShiftDate: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  nextShiftContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextShiftInfo: {
    flex: 1,
  },
  nextShiftName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  nextShiftTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nextShiftTimeText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  detailButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  detailButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default NextShiftCard;
