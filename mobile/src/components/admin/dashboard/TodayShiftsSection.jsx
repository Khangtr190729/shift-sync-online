import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import ApplePressable from '../../ApplePressable';

const TodayShiftsSectionComponent = ({ todayShifts = [], onGoToSchedule }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>CÁC CA LÀM HÔM NAY TẠI QUÁN</Text>
      </View>

      {todayShifts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="cafe-outline" size={32} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Hôm nay không có ca làm việc</Text>
          <Text style={styles.emptyDesc}>
            Vào mục Xếp ca để xem và phân công nhân viên cho các ngày trong tuần.
          </Text>
        </View>
      ) : (
        todayShifts.map((shift, idx) => {
          const shiftName = shift.shiftName || shift.shift?.name || 'Ca làm';
          const startTime = shift.startTime || shift.shift?.startTime || '';
          const endTime = shift.endTime || shift.shift?.endTime || '';
          const assignedCount = shift.assignedEmployees?.length || shift.assignments?.length || 0;

          return (
            <ApplePressable
              key={shift._id || idx}
              style={styles.shiftCard}
              onPress={onGoToSchedule}
              activeScale={0.97}
            >
              <View style={styles.shiftLeft}>
                <View style={styles.shiftIconBox}>
                  <Ionicons name="time" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.shiftName}>{shiftName}</Text>
                  <Text style={styles.shiftTime}>
                    {startTime} — {endTime}
                  </Text>
                </View>
              </View>

              <View style={styles.assignedBadge}>
                <Ionicons name="people" size={13} color={colors.primaryDark} />
                <Text style={styles.assignedCountText}>
                  {assignedCount} người
                </Text>
              </View>
            </ApplePressable>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  shiftLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shiftIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  shiftTime: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  assignedCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});

export const TodayShiftsSection = React.memo(TodayShiftsSectionComponent);
export default TodayShiftsSection;
