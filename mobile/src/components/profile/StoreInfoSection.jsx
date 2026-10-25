import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { formatVND, getEmploymentTypeLabel } from '../../utils/formatters';

export const StoreInfoSection = ({
  store,
  roleInStore,
  hourlyWage,
  employmentType,
  isAdmin = false,
  onOpenStoreSettings,
  onOpenBranchSelector,
  storesCount = 1,
}) => {
  const empTypeInfo = getEmploymentTypeLabel(employmentType);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="storefront" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Thông tin cơ sở & Chi nhánh</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {(isAdmin || storesCount > 1) && onOpenBranchSelector && (
            <TouchableOpacity
              style={styles.branchBtn}
              onPress={onOpenBranchSelector}
              activeOpacity={0.7}
            >
              <Ionicons name="swap-horizontal" size={13} color={colors.primary} />
              <Text style={styles.branchBtnText}>Đổi ({storesCount})</Text>
            </TouchableOpacity>
          )}

          {isAdmin && onOpenStoreSettings && (
            <TouchableOpacity
              style={styles.editStoreBtn}
              onPress={onOpenStoreSettings}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={13} color={colors.primaryDark} />
              <Text style={styles.editStoreBtnText}>Sửa</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Cửa hàng:</Text>
        <Text style={styles.infoValue}>{store?.name || 'Chưa tham gia'}</Text>
      </View>

      {isAdmin ? (
        <>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Quyền hạn:</Text>
            <View style={styles.ownerBadge}>
              <Text style={styles.ownerBadgeText}>Chủ sở hữu cửa hàng 👑</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Địa chỉ quán:</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {store?.address || 'Chưa cập nhật địa chỉ'}
            </Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Chức vụ:</Text>
            <View style={styles.roleInStoreBadge}>
              <Text style={styles.roleInStoreText}>
                {roleInStore === 'MANAGER' ? 'Quản lý cửa hàng' : 'Nhân viên'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Chế độ làm việc:</Text>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: empTypeInfo.bg, borderColor: empTypeInfo.border },
              ]}
            >
              <Text style={[styles.typeBadgeText, { color: empTypeInfo.color }]}>
                {empTypeInfo.shortText}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Lương thỏa thuận:</Text>
            <Text style={styles.wageValue}>{formatVND(hourlyWage)}/h</Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  branchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  branchBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  editStoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  editStoreBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    maxWidth: 220,
    textAlign: 'right',
  },
  ownerBadge: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  ownerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  roleInStoreBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  roleInStoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  typeBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  wageValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.success,
  },
});

export default StoreInfoSection;
