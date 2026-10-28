import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../../../theme/colors';
import ApplePressable from '../../ApplePressable';

const AdminDayStripComponent = ({
  daysOfWeek = [],
  selectedDate,
  onSelectDate,
}) => {
  return (
    <View style={styles.dateStrip}>
      {daysOfWeek.map((day) => {
        const isSelected = day.dateStr === selectedDate;

        return (
          <ApplePressable
            key={day.dateStr}
            style={[
              styles.dayColumn,
              isSelected && styles.dayColumnSelected,
            ]}
            onPress={() => onSelectDate(day.dateStr)}
            activeScale={0.9}
            contentStyle={styles.dayInner}
          >
            <Text
              style={[
                styles.dayOfWeekText,
                isSelected && styles.dayOfWeekTextSelected,
              ]}
            >
              {day.dayOfWeek}
            </Text>

            <Text
              style={[
                styles.dayNumberText,
                isSelected && styles.dayNumberTextSelected,
              ]}
            >
              {day.dayNumber}
            </Text>
          </ApplePressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  dateStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  dayColumn: {
    flex: 1,
    borderRadius: 12,
  },
  dayInner: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dayColumnSelected: {
    backgroundColor: colors.primary,
  },
  dayOfWeekText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dayOfWeekTextSelected: {
    color: '#FFFFFF',
  },
  dayNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  dayNumberTextSelected: {
    color: '#FFFFFF',
  },
});

export const AdminDayStrip = React.memo(AdminDayStripComponent);
export default AdminDayStrip;
