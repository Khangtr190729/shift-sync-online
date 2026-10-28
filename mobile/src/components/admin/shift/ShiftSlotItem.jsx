import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import ApplePressable from '../../ApplePressable';

const ShiftSlotItemComponent = ({
  shift,
  onEdit,
  onDelete,
}) => {
  const getPeakStars = () => {
    switch (shift.peakLevel) {
      case 3:
        return '⭐⭐⭐ Rất cao điểm';
      case 2:
        return '⭐⭐ Cao điểm';
      case 1:
      default:
        return '⭐ Bình thường';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.shiftLeft}>
          <View style={styles.iconBox}>
            <Ionicons name="time" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.shiftName}>{shift.name}</Text>
            <Text style={styles.shiftTime}>
              {shift.startTime} — {shift.endTime} ({shift.durationHours} tiếng)
            </Text>
          </View>
        </View>

        <View style={styles.peakBadge}>
          <Text style={styles.peakText}>{getPeakStars()}</Text>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <Text style={styles.reqEmployees}>
          Mặc định: {shift.minEmployees || 1} - {shift.maxEmployees || 3} nhân viên
        </Text>

        <View style={styles.actions}>
          <ApplePressable
            style={styles.editBtn}
            onPress={() => onEdit(shift)}
            activeScale={0.93}
          >
            <View style={styles.editBtnInner}>
              <Ionicons name="pencil" size={14} color={colors.primary} />
              <Text style={styles.editBtnText}>Chỉnh sửa</Text>
            </View>
          </ApplePressable>

          <ApplePressable
            style={styles.deleteBtn}
            onPress={() => onDelete(shift)}
            activeScale={0.92}
          >
            <Ionicons name="trash-outline" size={14} color={colors.danger} />
          </ApplePressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  shiftLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  shiftTime: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  peakBadge: {
    backgroundColor: '#FFFBEB',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  peakText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reqEmployees: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editBtn: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  editBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
});

export const ShiftSlotItem = React.memo(ShiftSlotItemComponent);
export default ShiftSlotItem;
