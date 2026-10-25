import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import ShiftEmployeeChip from './ShiftEmployeeChip';

export const AdminShiftSlotCard = ({
  shiftItem,
  onAssignEmployee,
  onRemoveEmployee,
  onEvaluateEmployee,
  getAssignmentConflict,
  isPublished = false,
}) => {
  const shiftName = shiftItem.shiftName || shiftItem.shift?.name || 'Ca làm';
  const startTime = shiftItem.startTime || shiftItem.shift?.startTime || '';
  const endTime = shiftItem.endTime || shiftItem.shift?.endTime || '';
  const duration = shiftItem.durationHours || shiftItem.shift?.durationHours || shiftItem.hours || 0;
  const peakLevel = shiftItem.peakLevel || shiftItem.shift?.peakLevel || 1;
  const assignments = shiftItem.assignments || [];

  const getPeakStars = () => {
    switch (peakLevel) {
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
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.shiftName}>{shiftName}</Text>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={13} color={colors.primary} />
            <Text style={styles.timeText}>
              {startTime} — {endTime} ({duration}h)
            </Text>
          </View>
        </View>

        <View style={styles.peakBadge}>
          <Text style={styles.peakText}>{getPeakStars()}</Text>
        </View>
      </View>

      {/* Assigned Employees List */}
      <View style={styles.employeesSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.assignedTitle}>
            Nhân viên phân công ({assignments.length}):
          </Text>
          {isPublished && (
            <Text style={styles.hintEvaluationText}>
              Chạm vào nhân viên để đánh giá chuyên cần
            </Text>
          )}
        </View>

        <View style={styles.chipsWrap}>
          {assignments.map((assign, idx) => {
            const empId = assign.userId?._id || assign.userId || assign.id;
            const conflict = getAssignmentConflict ? getAssignmentConflict(assign) : null;

            return (
              <ShiftEmployeeChip
                key={empId || idx}
                assign={assign}
                shiftItem={shiftItem}
                conflict={conflict}
                isPublished={isPublished}
                onEvaluateEmployee={onEvaluateEmployee}
                onRemoveEmployee={onRemoveEmployee}
              />
            );
          })}

          {!isPublished && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => onAssignEmployee && onAssignEmployee(shiftItem)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={15} color={colors.primary} />
              <Text style={styles.addBtnText}>Thêm nhân viên</Text>
            </TouchableOpacity>
          )}
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flex: 1,
  },
  shiftName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  timeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  peakBadge: {
    backgroundColor: '#FFF7ED',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  peakText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  employeesSection: {
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignedTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  hintEvaluationText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default AdminShiftSlotCard;
