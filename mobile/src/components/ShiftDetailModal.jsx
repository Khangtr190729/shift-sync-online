import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { formatVND } from '../utils/formatters';

export const ShiftDetailModal = ({
  visible,
  onClose,
  shiftDetail,
  shift,
  storeName,
}) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    } else {
      anim.setValue(0);
    }
  }, [visible]);

  const detail = shiftDetail || shift;
  if (!detail) return null;

  const isMissed = detail.attendanceStatus === 'MISSED';
  const isPartial = detail.attendanceStatus === 'PARTIAL';

  const shiftName =
    detail.shift?.name || detail.shiftName || 'Ca làm việc';
  const startTime =
    detail.shift?.startTime || detail.startTime || '';
  const endTime =
    detail.shift?.endTime || detail.endTime || '';
  const duration =
    detail.shift?.durationHours || detail.hours || 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: anim,
              transform: [
                {
                  scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.94, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerSubtitle}>CHI TIẾT CA LÀM VIỆC</Text>
              <Text style={styles.headerTitle}>{shiftName}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Info Rows */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ngày làm việc:</Text>
              <Text style={styles.infoValue}>{detail.date}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Thời gian ca:</Text>
              <Text style={styles.infoValue}>
                {startTime} — {endTime} ({duration} giờ)
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cơ sở làm việc:</Text>
              <Text style={styles.infoValue}>{storeName || 'Cửa hàng'}</Text>
            </View>

            {/* Attendance Status Box if PARTIAL */}
            {isPartial && (
              <View style={styles.partialBox}>
                <View style={styles.statusHeader}>
                  <View style={styles.statusTitleRow}>
                    <Ionicons name="alert-circle" size={16} color="#D97706" />
                    <Text style={styles.partialTitle}>Chưa hoàn thành tốt</Text>
                  </View>
                  <Text style={styles.deductedAmount}>
                    -{formatVND(detail.deductedPay || 0)}
                  </Text>
                </View>
                {detail.missedReason ? (
                  <Text style={styles.reasonText}>
                    <Text style={styles.bold}>Lý do: </Text>
                    {detail.missedReason}
                  </Text>
                ) : null}
                <View style={styles.takeHomeRow}>
                  <Text style={styles.takeHomeLabel}>Lương ca thực nhận:</Text>
                  <Text style={styles.takeHomeValue}>
                    {formatVND(detail.totalPay || 0)}
                  </Text>
                </View>
              </View>
            )}

            {/* Attendance Status Box if MISSED */}
            {isMissed && (
              <View style={styles.missedBox}>
                <View style={styles.statusHeader}>
                  <View style={styles.statusTitleRow}>
                    <Ionicons name="close-circle" size={16} color="#DC2626" />
                    <Text style={styles.missedTitle}>Không hoàn thành ca làm</Text>
                  </View>
                  <Text style={styles.deductedAmount}>Trừ 100% lương</Text>
                </View>
                {detail.missedReason ? (
                  <Text style={styles.reasonText}>
                    <Text style={styles.bold}>Lý do: </Text>
                    {detail.missedReason}
                  </Text>
                ) : null}
              </View>
            )}

            {/* Coworkers Section */}
            <View style={styles.coworkersSection}>
              <Text style={styles.coworkersTitle}>
                Đồng nghiệp cùng ca ({detail.coworkers?.length || 0}):
              </Text>

              {!detail.coworkers || detail.coworkers.length === 0 ? (
                <Text style={styles.noCoworkersText}>
                  Bạn là nhân sự duy nhất được phân ca này.
                </Text>
              ) : (
                detail.coworkers.map((c, idx) => (
                  <View key={c._id || idx} style={styles.coworkerItem}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarInitial}>
                        {c.name ? c.name.charAt(0).toUpperCase() : 'U'}
                      </Text>
                    </View>
                    <Text style={styles.coworkerName}>{c.name}</Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.actionButton}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: colors.primaryLight,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#FED7AA',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.primaryDark,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    maxHeight: 400,
  },
  bodyContent: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  partialBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },
  missedBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  partialTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  missedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
  },
  deductedAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger,
  },
  reasonText: {
    fontSize: 11,
    color: '#78350F',
    marginTop: 6,
    lineHeight: 16,
  },
  bold: {
    fontWeight: '700',
  },
  takeHomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  takeHomeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  takeHomeValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  coworkersSection: {
    marginTop: 16,
  },
  coworkersTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  noCoworkersText: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  coworkerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 8,
    marginBottom: 6,
  },
  avatarCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarInitial: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  coworkerName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  footer: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ShiftDetailModal;
