import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../../theme/colors';
import ApplePressable from '../ApplePressable';

export const DayPickerStrip = ({
  daysOfWeek = [],
  selectedDate,
  shiftDatesSet = new Set(),
  onSelectDate,
}) => {
  return (
    <View style={styles.dateStrip}>
      {daysOfWeek.map((day) => {
        const isSelected = day.dateStr === selectedDate;
        const hasShift = shiftDatesSet.has(day.dateStr);

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

            {/* Dot indicating shifts */}
            <View
              style={[
                styles.shiftDot,
                hasShift && styles.shiftDotActive,
                isSelected && hasShift && styles.shiftDotSelected,
              ]}
            />
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
    borderRadius: 18,
    padding: 6,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  dayColumn: {
    flex: 1,
    borderRadius: 14,
  },
  dayInner: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dayColumnSelected: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
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
  shiftDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'transparent',
    marginTop: 6,
  },
  shiftDotActive: {
    backgroundColor: colors.primary,
  },
  shiftDotSelected: {
    backgroundColor: '#FFFFFF',
  },
});

export default DayPickerStrip;
