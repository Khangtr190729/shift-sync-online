import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import { formatVND } from '../../../utils/formatters';

export const ShiftEmployeeChip = ({
  assign,
  shiftItem,
  conflict,
  isPublished,
  onEvaluateEmployee,
  onRemoveEmployee,
}) => {
  const empName = assign.userId?.fullName || assign.userName || assign.fullName || 'Nhân viên';
  const empId = assign.userId?._id || assign.userId || assign.id;
  const isMissed = assign.attendanceStatus === 'MISSED';
  const isPartial = assign.attendanceStatus === 'PARTIAL';

  return (
    <TouchableOpacity
      style={[
        styles.employeeChip,
        isMissed && styles.chipMissed,
        isPartial && styles.chipPartial,
        conflict && (conflict.isCrossStore ? styles.chipCrossConflict : styles.chipLocalConflict),
      ]}
      onPress={() => onEvaluateEmployee && onEvaluateEmployee(shiftItem, assign)}
      activeOpacity={0.8}
    >
      <View style={styles.chipContent}>
        <Ionicons
          name={
            isMissed
              ? 'close-circle'
              : isPartial
              ? 'alert-circle'
              : 'person-circle'
          }
          size={16}
          color={
            isMissed
              ? colors.danger
              : isPartial
              ? '#D97706'
              : colors.primary
          }
        />
        <Text style={[styles.employeeChipName, isMissed && styles.nameMissed]}>
          {empName}
        </Text>

        {/* Conflict indicator tag */}
        {conflict && (
          <View
            style={[
              styles.conflictTag,
              conflict.isCrossStore ? styles.crossConflictTag : styles.localConflictTag,
            ]}
          >
            <Ionicons
              name={conflict.isCrossStore ? 'business' : 'alert-circle'}
              size={10}
              color={conflict.isCrossStore ? '#DC2626' : '#D97706'}
            />
            <Text
              style={[
                styles.conflictTagText,
                conflict.isCrossStore ? styles.crossConflictTagText : styles.localConflictTagText,
              ]}
              numberOfLines={1}
            >
              {conflict.isCrossStore ? `Trùng ${conflict.storeName}` : 'Trùng ca'}
            </Text>
          </View>
        )}

        {/* Status badges */}
        {isMissed && (
          <View style={styles.missedTag}>
            <Text style={styles.missedTagText}>Vắng (-100%)</Text>
          </View>
        )}
        {isPartial && (
          <View style={styles.partialTag}>
            <Text style={styles.partialTagText}>
              -{formatVND(assign.deductedPay || 0)}
            </Text>
          </View>
        )}
      </View>

      {/* Actions inside chip */}
      <View style={styles.chipActions}>
        {onEvaluateEmployee && (
          <TouchableOpacity
            onPress={() => onEvaluateEmployee(shiftItem, assign)}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            style={styles.actionBtn}
            title="Đánh giá ca"
          >
            <Ionicons
              name="create-outline"
              size={15}
              color={isPartial ? '#D97706' : isMissed ? colors.danger : colors.primary}
            />
          </TouchableOpacity>
        )}

        {!isPublished && (
          <TouchableOpacity
            onPress={() => onRemoveEmployee && onRemoveEmployee(shiftItem, empId)}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 6 }}
            style={styles.actionBtn}
            title="Xóa khỏi ca"
          >
            <Ionicons name="close-circle" size={16} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  employeeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 8,
  },
  chipMissed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  chipPartial: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  chipCrossConflict: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
    borderWidth: 1.5,
  },
  chipLocalConflict: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FBBF24',
    borderWidth: 1.5,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  employeeChipName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  nameMissed: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  conflictTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 0.8,
  },
  crossConflictTag: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  crossConflictTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
  },
  localConflictTag: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  localConflictTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
  },
  missedTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  missedTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.danger,
  },
  partialTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  partialTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
  },
  chipActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 4,
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
  },
  actionBtn: {
    padding: 2,
  },
});

export default ShiftEmployeeChip;
