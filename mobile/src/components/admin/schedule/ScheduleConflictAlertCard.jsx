import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const ScheduleConflictAlertCard = ({ conflicts = [] }) => {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="warning" size={18} color="#DC2626" />
        <Text style={styles.title}>
          Phát hiện {conflicts.length} xung đột ca làm việc!
        </Text>
      </View>
      <Text style={styles.subTitle}>
        Có nhân viên bị trùng giờ làm việc (cùng quán hoặc chi nhánh khác). Vui lòng điều chỉnh trước khi xuất bản.
      </Text>
      <View style={styles.list}>
        {conflicts.slice(0, 3).map((item, idx) => (
          <View key={idx} style={styles.item}>
            <Ionicons
              name={item.isCrossStore ? 'business' : 'alert-circle'}
              size={13}
              color={item.isCrossStore ? '#DC2626' : '#D97706'}
              style={styles.itemIcon}
            />
            <Text style={styles.itemText} numberOfLines={2}>
              {item.message}
            </Text>
          </View>
        ))}
        {conflicts.length > 3 && (
          <Text style={styles.moreText}>
            + Và {conflicts.length - 3} xung đột khác trong tuần...
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 14,
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
  },
  subTitle: {
    fontSize: 11,
    color: '#7F1D1D',
    lineHeight: 16,
    marginBottom: 10,
  },
  list: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
    paddingTop: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#FECACA',
  },
  itemIcon: {
    marginTop: 2,
    marginRight: 5,
  },
  itemText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7F1D1D',
    flex: 1,
    lineHeight: 15,
  },
  moreText: {
    fontSize: 10.5,
    fontStyle: 'italic',
    color: '#991B1B',
    marginTop: 2,
  },
});

export default ScheduleConflictAlertCard;
