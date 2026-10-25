import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import AdminShiftSlotCard from './AdminShiftSlotCard';

export const AdminDayShiftsList = ({
  shiftsForDay = [],
  selectedDate,
  isPublished = false,
  getAssignmentConflict,
  onAssignEmployee,
  onRemoveEmployee,
  onEvaluateEmployee,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>
        DANH SÁCH CA NGÀY {selectedDate}
      </Text>

      {shiftsForDay.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="calendar-outline" size={32} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Chưa có ca làm nào trong ngày này</Text>
          <Text style={styles.emptyDesc}>
            Vào mục "Ca làm" để tạo các khung giờ làm việc cho quán.
          </Text>
        </View>
      ) : (
        shiftsForDay.map((shift, idx) => (
          <AdminShiftSlotCard
            key={shift.shiftId || idx}
            shiftItem={shift}
            isPublished={isPublished}
            getAssignmentConflict={getAssignmentConflict}
            onAssignEmployee={onAssignEmployee}
            onRemoveEmployee={onRemoveEmployee}
            onEvaluateEmployee={onEvaluateEmployee}
          />
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
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
  },
});

export default AdminDayShiftsList;
