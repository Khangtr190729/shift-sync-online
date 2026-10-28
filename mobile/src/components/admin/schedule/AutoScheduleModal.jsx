import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';

export const AutoScheduleModal = ({
  visible,
  onClose,
  onRunAutoSchedule,
  loading = false,
}) => {
  const [staffPerShift, setStaffPerShift] = useState('AUTO_BY_STARS');
  const [preserveExisting, setPreserveExisting] = useState(false);

  const handleConfirm = () => {
    onRunAutoSchedule({
      staffPerShift,
      maxShiftsPerDay: 1,
      preserveExisting,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="sparkles" size={24} color={colors.primary} />
            </View>
            <Text style={styles.title}>Tự động xếp lịch thông minh</Text>
            <Text style={styles.subtitle}>
              Hệ thống tự cân bằng tải và phân bổ nhân sự tối ưu cho cả tuần
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Rule notice */}
            <View style={styles.ruleNotice}>
              <Ionicons name="information-circle" size={18} color="#D97706" />
              <View style={{ flex: 1 }}>
                <Text style={styles.ruleNoticeTitle}>Quy tắc phân bổ thông minh:</Text>
                <Text style={styles.ruleNoticeText}>
                  • Ca cao điểm (nhiều sao ⭐) sẽ được ưu tiên xếp thêm nhân sự{'\n'}
                  • Cân bằng số ca và giờ làm đều nhau giữa các nhân viên{'\n'}
                  • Tuyệt đối không xếp trùng hoặc cấn giờ nhau
                </Text>
              </View>
            </View>

            {/* Staff per shift options */}
            <Text style={styles.optionsLabel}>Phương thức phân bổ nhân sự:</Text>

            <TouchableOpacity
              style={[
                styles.optionCard,
                staffPerShift === 'AUTO_BY_STARS' && styles.optionCardSelected,
              ]}
              onPress={() => setStaffPerShift('AUTO_BY_STARS')}
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  staffPerShift === 'AUTO_BY_STARS'
                    ? 'radio-button-on'
                    : 'radio-button-off'
                }
                size={20}
                color={staffPerShift === 'AUTO_BY_STARS' ? colors.primary : colors.textMuted}
              />
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Theo mức độ cao điểm (⭐) — Khuyên dùng</Text>
                <Text style={styles.optionDesc}>
                  Ca 3 sao tự động nhận nhiều nhân viên hơn ca 1 sao.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionCard,
                staffPerShift === '1' && styles.optionCardSelected,
              ]}
              onPress={() => setStaffPerShift('1')}
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  staffPerShift === '1'
                    ? 'radio-button-on'
                    : 'radio-button-off'
                }
                size={20}
                color={staffPerShift === '1' ? colors.primary : colors.textMuted}
              />
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Cố định 1 nhân viên / ca</Text>
                <Text style={styles.optionDesc}>
                  Phù hợp cửa hàng quy mô nhỏ hoặc ca làm đơn lẻ.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionCard,
                staffPerShift === '2' && styles.optionCardSelected,
              ]}
              onPress={() => setStaffPerShift('2')}
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  staffPerShift === '2'
                    ? 'radio-button-on'
                    : 'radio-button-off'
                }
                size={20}
                color={staffPerShift === '2' ? colors.primary : colors.textMuted}
              />
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Cố định 2 nhân viên / ca</Text>
                <Text style={styles.optionDesc}>
                  Phù hợp quán đông khách cần ít nhất 2 bạn trực cùng lúc.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Preserve existing toggle */}
            <TouchableOpacity
              style={styles.preserveRow}
              onPress={() => setPreserveExisting(!preserveExisting)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={preserveExisting ? 'checkbox' : 'square-outline'}
                size={20}
                color={preserveExisting ? colors.primary : colors.textSecondary}
              />
              <Text style={styles.preserveText}>
                Giữ nguyên các ca đã xếp thủ công trước đó
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Đóng</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirm}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="flash" size={16} color="#FFFFFF" />
                  <Text style={styles.confirmText}>Bắt đầu xếp ca</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  ruleNotice: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  ruleNoticeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 2,
  },
  ruleNoticeText: {
    fontSize: 10,
    color: '#78350F',
    lineHeight: 15,
  },
  optionsLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  optionDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  preserveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    marginBottom: 10,
  },
  preserveText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default AutoScheduleModal;
