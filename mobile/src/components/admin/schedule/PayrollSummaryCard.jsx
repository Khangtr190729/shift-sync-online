import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import { formatVND } from '../../../utils/formatters';
import ApplePressable from '../../ApplePressable';

const PayrollSummaryCardComponent = ({ payrollSummary }) => {
  const [expanded, setExpanded] = useState(true);

  if (!payrollSummary) return null;

  const totalShifts = payrollSummary.storeTotalShifts || 0;
  const totalHours = payrollSummary.storeTotalHours || 0;
  const totalPayroll = payrollSummary.storeTotalPayroll || 0;
  const missedCount = payrollSummary.storeTotalMissedShifts || 0;
  const partialCount = payrollSummary.storeTotalPartialShifts || 0;
  const employees = payrollSummary.employees || [];

  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Ionicons name="cash" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Dự toán quỹ lương tuần</Text>
            <Text style={styles.subtitle}>
              Tính trên ca thực tế đã khấu trừ chuyên cần
            </Text>
          </View>
        </View>

        <ApplePressable
          onPress={() => setExpanded(!expanded)}
          style={styles.expandBtn}
          activeScale={0.88}
        >
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textSecondary}
          />
        </ApplePressable>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Tổng ca</Text>
          <Text style={styles.metricValue}>{totalShifts} ca</Text>
          {missedCount > 0 && (
            <View style={styles.missedBadge}>
              <Text style={styles.missedBadgeText}>-{missedCount} ca vắng</Text>
            </View>
          )}
          {partialCount > 0 && (
            <View style={styles.partialBadge}>
              <Text style={styles.partialBadgeText}>{partialCount} ca trừ 1 phần</Text>
            </View>
          )}
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Tổng giờ</Text>
          <Text style={styles.metricValue}>{totalHours}h</Text>
        </View>

        <View style={styles.metricItemHighlight}>
          <Text style={styles.metricLabelHighlight}>Quỹ lương dự kiến</Text>
          <Text style={styles.metricValueHighlight}>
            {formatVND(totalPayroll)}
          </Text>
        </View>
      </View>

      {/* Employee Breakdown */}
      {expanded && (
        <View style={styles.breakdownWrap}>
          <Text style={styles.breakdownTitle}>
            Chi tiết theo nhân viên ({employees.length}):
          </Text>

          {employees.length === 0 ? (
            <Text style={styles.emptyText}>
              Chưa có nhân viên nào được phân ca trong tuần này.
            </Text>
          ) : (
            employees.map((emp, idx) => {
              const hasMissed = (emp.missedShifts || 0) > 0;
              const hasPartial = (emp.partialShifts || 0) > 0;

              return (
                <View
                  key={emp.userId || emp.email || emp.name || idx}
                  style={styles.empRow}
                >
                  <View style={styles.empLeft}>
                    <View style={styles.empAvatar}>
                      <Text style={styles.empAvatarText}>
                        {(emp.name || 'N').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.empInfo}>
                      <View style={styles.empNameRow}>
                        <Text style={styles.empName} numberOfLines={1}>
                          {emp.name}
                        </Text>
                        {hasMissed && (
                          <View style={styles.empMissedTag}>
                            <Text style={styles.empMissedTagText}>Vắng {emp.missedShifts}</Text>
                          </View>
                        )}
                        {hasPartial && (
                          <View style={styles.empPartialTag}>
                            <Text style={styles.empPartialTagText}>Trừ {emp.partialShifts}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.empSub}>
                        {emp.completedShifts || 0}/{emp.totalShifts} ca ({emp.totalHours}h) • {formatVND(emp.hourlyWage)}/h
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.empTotalWage}>
                    {formatVND(emp.totalWage)}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  expandBtn: {
    padding: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  missedBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  missedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.danger,
  },
  partialBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  partialBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
  },
  metricItemHighlight: {
    flex: 1.4,
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
  },
  metricLabelHighlight: {
    fontSize: 10,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  metricValueHighlight: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.primary,
    marginTop: 2,
  },
  breakdownWrap: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  breakdownTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  empRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  empLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  empAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empAvatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  empInfo: {
    flex: 1,
  },
  empNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  empName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  empMissedTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  empMissedTagText: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.danger,
  },
  empPartialTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  empPartialTagText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#D97706',
  },
  empSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  empTotalWage: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
});

export const PayrollSummaryCard = React.memo(PayrollSummaryCardComponent);
export default PayrollSummaryCard;
