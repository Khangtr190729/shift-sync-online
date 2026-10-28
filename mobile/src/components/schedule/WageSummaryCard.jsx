import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { formatVND } from '../../utils/formatters';

const WageSummaryCardComponent = ({ stats }) => {
  const estimatedWage = stats?.estimatedWage || 0;
  const hourlyWage = stats?.hourlyWage || 0;
  const totalShifts = stats?.totalShifts || 0;
  const totalHours = stats?.totalHours || 0;

  return (
    <View style={styles.wageCard}>
      <View style={styles.wageCardHeader}>
        <View style={styles.wageCardTitleRow}>
          <Ionicons name="sparkles" size={14} color={colors.primary} />
          <Text style={styles.wageCardTitle}>BẢNG LƯƠNG ƯỚC TÍNH TUẦN NÀY</Text>
        </View>
        <View style={styles.hourlyRatePill}>
          <Text style={styles.hourlyRateText}>
            {formatVND(hourlyWage)}/h
          </Text>
        </View>
      </View>

      <Text style={styles.totalWageAmount}>
        {formatVND(estimatedWage)}
      </Text>

      <View style={styles.wageStatsRow}>
        <View style={styles.wageStatCol}>
          <Text style={styles.wageStatLabel}>Số ca đã nhận:</Text>
          <Text style={styles.wageStatValue}>{totalShifts} ca</Text>
        </View>

        <View style={styles.wageStatDivider} />

        <View style={styles.wageStatCol}>
          <Text style={styles.wageStatLabel}>Tổng số giờ làm:</Text>
          <Text style={styles.wageStatValue}>{totalHours} giờ</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wageCard: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  wageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  wageCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wageCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  hourlyRatePill: {
    backgroundColor: '#1E293B',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  hourlyRateText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  totalWageAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  wageStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  wageStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  wageStatLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 2,
  },
  wageStatValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  wageStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },
});

export const WageSummaryCard = React.memo(WageSummaryCardComponent);
export default WageSummaryCard;
