import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';

export const AssignMemberItem = ({
  member,
  isAssigned,
  conflict,
  onPress,
}) => {
  const isDisabled = isAssigned || Boolean(conflict);

  return (
    <TouchableOpacity
      style={[
        styles.memberItem,
        isAssigned && styles.memberItemDisabled,
        conflict && (conflict.isCrossStore ? styles.memberItemCrossConflict : styles.memberItemLocalConflict),
      ]}
      onPress={onPress}
      activeOpacity={isDisabled ? 0.9 : 0.7}
    >
      <View style={styles.memberLeft}>
        <View
          style={[
            styles.avatar,
            conflict && (conflict.isCrossStore ? styles.avatarCross : styles.avatarLocal),
            isAssigned && styles.avatarDisabled,
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              conflict && (conflict.isCrossStore ? styles.avatarTextCross : styles.avatarTextLocal),
              isAssigned && styles.avatarTextDisabled,
            ]}
          >
            {(member.userId?.fullName || 'N').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={[styles.memberName, isDisabled && styles.textDisabled]}>
            {member.userId?.fullName || 'Nhân viên'}
          </Text>
          <Text style={styles.memberRole}>
            {member.employmentType === 'FULL_TIME' ? 'Full-time' : 'Part-time'} • {member.userId?.email}
          </Text>

          {/* Banner cảnh báo trùng ca trực quan */}
          {conflict && (
            <View
              style={[
                styles.conflictNoticeBox,
                conflict.isCrossStore ? styles.crossNoticeBox : styles.localNoticeBox,
              ]}
            >
              <Ionicons
                name={conflict.isCrossStore ? 'business' : 'alert-circle'}
                size={12}
                color={conflict.isCrossStore ? '#DC2626' : '#D97706'}
                style={styles.noticeIcon}
              />
              <Text
                style={[
                  styles.conflictNoticeText,
                  conflict.isCrossStore ? styles.crossNoticeText : styles.localNoticeText,
                ]}
              >
                {conflict.isCrossStore
                  ? `Trùng ca tại "${conflict.storeName}": ${conflict.name} (${conflict.startTime}-${conflict.endTime})`
                  : `Trùng ca "${conflict.name}" (${conflict.startTime}-${conflict.endTime}) cùng ngày`}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Badge trạng thái bên phải */}
      {isAssigned ? (
        <View style={styles.assignedTag}>
          <Text style={styles.assignedTagText}>Đã có</Text>
        </View>
      ) : conflict ? (
        <View
          style={[
            styles.conflictBadge,
            conflict.isCrossStore ? styles.crossBadge : styles.localBadge,
          ]}
        >
          <Text
            style={[
              styles.conflictBadgeText,
              conflict.isCrossStore ? styles.crossBadgeText : styles.localBadgeText,
            ]}
          >
            {conflict.isCrossStore ? 'Trùng chi nhánh' : 'Trùng giờ'}
          </Text>
        </View>
      ) : (
        <View style={styles.addIcon}>
          <Ionicons name="add" size={18} color={colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  memberItemDisabled: {
    opacity: 0.6,
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  memberItemCrossConflict: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  memberItemLocalConflict: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
    paddingRight: 6,
  },
  infoCol: {
    flex: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  avatarDisabled: {
    backgroundColor: '#E2E8F0',
  },
  avatarCross: {
    backgroundColor: '#FEE2E2',
  },
  avatarLocal: {
    backgroundColor: '#FEF3C7',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  avatarTextDisabled: {
    color: '#94A3B8',
  },
  avatarTextCross: {
    color: '#DC2626',
  },
  avatarTextLocal: {
    color: '#D97706',
  },
  memberName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  textDisabled: {
    color: '#64748B',
  },
  memberRole: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  conflictNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 8,
  },
  crossNoticeBox: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  localNoticeBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  noticeIcon: {
    marginTop: 1,
    marginRight: 4,
  },
  conflictNoticeText: {
    fontSize: 10.5,
    lineHeight: 14,
    flex: 1,
    fontWeight: '600',
  },
  crossNoticeText: {
    color: '#B91C1C',
  },
  localNoticeText: {
    color: '#B45309',
  },
  assignedTag: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  assignedTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  conflictBadge: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  crossBadge: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  crossBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  localBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  localBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  addIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AssignMemberItem;
