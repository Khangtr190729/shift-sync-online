import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import { formatVND } from '../../../utils/formatters';
import ApplePressable from '../../ApplePressable';

export const MemberCardItem = React.memo(({
  member,
  onEdit,
  onDelete,
}) => {
  const isFullTime = member.employmentType === 'FULL_TIME';
  const isManager = member.roleInStore === 'MANAGER';
  const name = member.userId?.fullName || member.fullName || 'Nhân viên';
  const email = member.userId?.email || member.email || '';
  const initial = name.charAt(0).toUpperCase();
  const hourlyWage = member.hourlyWage || 0;
  const gender = member.userId?.gender || member.gender || 'Nam';
  const age = member.userId?.age || member.age || '';

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.memberLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.memberName}>{name}</Text>
            <Text style={styles.memberEmail}>{email}</Text>
            <Text style={styles.memberMeta}>
              {gender} {age ? `• ${age} tuổi` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.badgeColumn}>
          {isManager && (
            <View style={styles.managerBadge}>
              <Ionicons name="shield-checkmark" size={11} color="#1D4ED8" />
              <Text style={styles.managerBadgeText}>Quản lý</Text>
            </View>
          )}
          <View style={[styles.roleTag, isFullTime ? styles.roleTagFullTime : styles.roleTagPartTime]}>
            <Text
              style={[
                styles.roleTagText,
                isFullTime ? styles.roleTagTextFullTime : styles.roleTagTextPartTime,
              ]}
            >
              {isFullTime ? 'Full-time' : 'Part-time'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.wageBox}>
          <Text style={styles.wageLabel}>Lương cơ bản:</Text>
          <Text style={styles.wageValue}>{formatVND(hourlyWage)}/h</Text>
        </View>

        <View style={styles.actionBtns}>
          <ApplePressable
            style={styles.editBtn}
            onPress={() => onEdit(member)}
            activeScale={0.94}
          >
            <View style={styles.editBtnContent}>
              <Ionicons name="pencil" size={14} color={colors.primary} />
              <Text style={styles.editBtnText}>Sửa lương</Text>
            </View>
          </ApplePressable>

          <ApplePressable
            style={styles.deleteBtn}
            onPress={() => onDelete(member)}
            activeScale={0.92}
          >
            <Ionicons name="trash-outline" size={14} color={colors.danger} />
          </ApplePressable>
        </View>
      </View>
    </View>
  );
});

MemberCardItem.displayName = 'MemberCardItem';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  nameBlock: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  memberEmail: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  memberMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  badgeColumn: {
    alignItems: 'flex-end',
    gap: 4,
  },
  managerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  managerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  roleTag: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleTagFullTime: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  roleTagPartTime: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  roleTagTextFullTime: {
    color: '#7C3AED',
  },
  roleTagTextPartTime: {
    color: '#D97706',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wageLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  wageValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.success,
  },
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editBtn: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  editBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
});

export default MemberCardItem;
