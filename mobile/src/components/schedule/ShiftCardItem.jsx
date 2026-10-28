import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { formatVND } from '../../utils/formatters';
import ApplePressable from '../ApplePressable';

const ShiftCardItemComponent = ({ item, onOpenDetail }) => {
  const isMissed = item.attendanceStatus === 'MISSED';
  const isPartial = item.attendanceStatus === 'PARTIAL';
  const shiftName = item.shift?.name || item.shiftName || 'Ca làm việc';
  const startTime = item.shift?.startTime || item.startTime || '';
  const endTime = item.shift?.endTime || item.endTime || '';
  const hours = item.shift?.durationHours || item.hours || 0;
  const coworkersCount = item.coworkers?.length || 0;

  return (
    <ApplePressable
      style={[
        styles.shiftCard,
        isMissed && styles.shiftCardMissed,
        isPartial && styles.shiftCardPartial,
      ]}
      onPress={() => onOpenDetail(item)}
      activeScale={0.97}
    >
      <View style={styles.cardInner}>
        <View style={styles.shiftCardLeft}>
          <View
            style={[
              styles.shiftIconBox,
              isMissed && styles.shiftIconBoxMissed,
              isPartial && styles.shiftIconBoxPartial,
            ]}
          >
            <Ionicons
              name="time"
              size={20}
              color={
                isMissed
                  ? colors.danger
                  : isPartial
                  ? '#D97706'
                  : colors.primary
              }
            />
          </View>

          <View style={styles.shiftDetails}>
            <View style={styles.shiftNameRow}>
              <Text
                style={[
                  styles.shiftCardName,
                  isMissed && styles.shiftCardNameStruck,
                ]}
              >
                {shiftName}
              </Text>
              {isMissed && (
                <View style={styles.missedTag}>
                  <Text style={styles.missedTagText}>Không hoàn thành</Text>
                </View>
              )}
              {isPartial && (
                <View style={styles.partialTag}>
                  <Text style={styles.partialTagText}>
                    Trừ -{formatVND(item.deductedPay || 0)}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.shiftCardTime}>
              {startTime} — {endTime} ({hours}h)
              {isPartial && (
                <Text style={styles.partialPayText}>
                  {' '}• Nhận: {formatVND(item.totalPay || 0)}
                </Text>
              )}
            </Text>
          </View>
        </View>

        {/* Coworkers badge */}
        <View style={styles.coworkerBadge}>
          <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.coworkerBadgeText}>
            {coworkersCount} đồng nghiệp
          </Text>
        </View>
      </View>
    </ApplePressable>
  );
};

const styles = StyleSheet.create({
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  shiftCardMissed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  shiftCardPartial: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  shiftCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shiftIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shiftIconBoxMissed: {
    backgroundColor: '#FEE2E2',
  },
  shiftIconBoxPartial: {
    backgroundColor: '#FEF3C7',
  },
  shiftDetails: {
    flex: 1,
  },
  shiftNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  shiftCardName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  shiftCardNameStruck: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  shiftCardTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  missedTag: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  missedTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.danger,
  },
  partialTag: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  partialTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  partialPayText: {
    fontWeight: '700',
    color: colors.success,
  },
  coworkerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginLeft: 8,
  },
  coworkerBadgeText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

export const ShiftCardItem = React.memo(ShiftCardItemComponent);
export default ShiftCardItem;
