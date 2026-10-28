import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import { formatVND } from '../../../utils/formatters';

const StatOverviewCardsComponent = ({
  memberCount = 0,
  shiftCount = 0,
  totalHours = 0,
  totalWageCost = 0,
  isPublished = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Published status banner */}
      <View
        style={[
          styles.publishStatusBanner,
          isPublished ? styles.bannerPublished : styles.bannerDraft,
        ]}
      >
        <Ionicons
          name={isPublished ? 'checkmark-circle' : 'alert-circle'}
          size={16}
          color={isPublished ? colors.success : '#D97706'}
        />
        <Text
          style={[
            styles.publishStatusText,
            isPublished ? styles.textPublished : styles.textDraft,
          ]}
        >
          {isPublished
            ? 'Lịch tuần này ĐÃ XUẤT BẢN cho nhân viên'
            : 'Lịch tuần này ĐANG LÀ BẢN NHÁP (Chưa công bố)'}
        </Text>
      </View>

      {/* 2x2 Grid of Stat Cards */}
      <View style={styles.grid}>
        <View style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="people" size={18} color="#2563EB" />
          </View>
          <Text style={styles.statValue}>{memberCount}</Text>
          <Text style={styles.statLabel}>Nhân viên quán</Text>
        </View>

        <View style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="calendar" size={18} color={colors.primary} />
          </View>
          <Text style={styles.statValue}>{shiftCount}</Text>
          <Text style={styles.statLabel}>Ca tuần này</Text>
        </View>

        <View style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="time" size={18} color={colors.success} />
          </View>
          <Text style={styles.statValue}>{totalHours}h</Text>
          <Text style={styles.statLabel}>Tổng giờ trực</Text>
        </View>

        <View style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="cash" size={18} color="#D97706" />
          </View>
          <Text style={styles.statValue}>{formatVND(totalWageCost)}</Text>
          <Text style={styles.statLabel}>Ước tính quỹ lương</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  publishStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  bannerPublished: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  bannerDraft: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  publishStatusText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  textPublished: {
    color: colors.success,
  },
  textDraft: {
    color: '#B45309',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
});

export const StatOverviewCards = React.memo(StatOverviewCardsComponent);
export default StatOverviewCards;
