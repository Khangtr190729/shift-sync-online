import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import { formatVND } from '../../../utils/formatters';

export const ShiftEvaluationModal = ({
  visible,
  onClose,
  targetAssignment,
  onSaveEvaluation,
  loading = false,
}) => {
  if (!targetAssignment) return null;

  const hours = targetAssignment.hours || 4;
  const wage = targetAssignment.hourlyWage || 20000;
  const fullShiftPay = Math.round(hours * wage);

  const [mode, setMode] = useState('PARTIAL'); // 'PARTIAL' | 'MISSED'
  const [penaltyType, setPenaltyType] = useState('HOURS'); // 'HOURS' | 'AMOUNT'
  const [deductedHours, setDeductedHours] = useState(1);
  const [deductedAmount, setDeductedAmount] = useState(20000);
  const [reason, setReason] = useState('');

  // Reset or initialize when modal opens
  useEffect(() => {
    if (visible && targetAssignment) {
      if (targetAssignment.attendanceStatus === 'MISSED') {
        setMode('MISSED');
      } else {
        setMode('PARTIAL');
      }

      setPenaltyType(targetAssignment.penaltyType === 'AMOUNT' ? 'AMOUNT' : 'HOURS');
      setDeductedHours(
        targetAssignment.deductedHours > 0
          ? Math.min(hours, targetAssignment.deductedHours)
          : Math.min(hours, 1)
      );
      setDeductedAmount(
        targetAssignment.deductedPay > 0
          ? Math.min(fullShiftPay, targetAssignment.deductedPay)
          : Math.min(fullShiftPay, 20000)
      );
      setReason(targetAssignment.missedReason || '');
    }
  }, [visible, targetAssignment, hours, fullShiftPay]);

  // Quick hour options
  const hourOptions = useMemo(() => {
    const list = [];
    for (let h = 0.5; h <= hours; h += 0.5) {
      const val = Number(h.toFixed(1));
      list.push(val);
    }
    return list;
  }, [hours]);

  // Quick amount options
  const amountOptions = useMemo(() => {
    const list = [10000, 20000, 30000, 50000, 100000].filter((amt) => amt < fullShiftPay);
    list.push(fullShiftPay);
    return Array.from(new Set(list));
  }, [fullShiftPay]);

  // Computed preview deduction
  const previewDeductedPay = useMemo(() => {
    if (mode === 'MISSED') return fullShiftPay;
    if (penaltyType === 'AMOUNT') {
      return Math.min(fullShiftPay, Math.max(0, Number(deductedAmount) || 0));
    }
    return Math.min(fullShiftPay, Math.round(deductedHours * wage));
  }, [mode, penaltyType, deductedAmount, deductedHours, wage, fullShiftPay]);

  const previewDeductedHours = useMemo(() => {
    if (mode === 'MISSED') return hours;
    if (penaltyType === 'HOURS') return deductedHours;
    return wage > 0 ? Number((previewDeductedPay / wage).toFixed(1)) : 0;
  }, [mode, penaltyType, deductedHours, previewDeductedPay, wage, hours]);

  const previewTakeHome = Math.max(0, fullShiftPay - previewDeductedPay);

  // Handle Save
  const handleSave = () => {
    if (mode === 'MISSED') {
      onSaveEvaluation({
        date: targetAssignment.date,
        shiftId: targetAssignment.shiftId,
        userId: targetAssignment.userId,
        attendanceStatus: 'MISSED',
        penaltyType: 'NONE',
        deductedHours: hours,
        deductedPay: fullShiftPay,
        missedReason: reason.trim() || 'Không hoàn thành ca làm',
      });
    } else {
      onSaveEvaluation({
        date: targetAssignment.date,
        shiftId: targetAssignment.shiftId,
        userId: targetAssignment.userId,
        attendanceStatus: 'PARTIAL',
        penaltyType,
        deductedHours: previewDeductedHours,
        deductedPay: previewDeductedPay,
        missedReason: reason.trim() || 'Chưa hoàn thành tốt ca làm',
      });
    }
  };

  // Handle Restore
  const handleRestore = () => {
    Alert.alert(
      'Khôi phục hoàn thành ca',
      `Khôi phục trạng thái hoàn thành 100% lương cho nhân viên ${targetAssignment.userName}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Khôi phục',
          onPress: () => {
            onSaveEvaluation({
              date: targetAssignment.date,
              shiftId: targetAssignment.shiftId,
              userId: targetAssignment.userId,
              attendanceStatus: 'COMPLETED',
              penaltyType: 'NONE',
              deductedHours: 0,
              deductedPay: 0,
              missedReason: '',
            });
          },
        },
      ]
    );
  };

  const isAlreadyEvaluated =
    targetAssignment.attendanceStatus === 'MISSED' ||
    targetAssignment.attendanceStatus === 'PARTIAL';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* iOS Sheet Grab Handle */}
          <View style={styles.grabHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Đánh giá chuyên cần ca làm</Text>
              <Text style={styles.subtitle}>
                {targetAssignment.userName} • {targetAssignment.shiftName} ({targetAssignment.date})
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Mode Switcher Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabBtn, mode === 'PARTIAL' && styles.tabBtnActivePartial]}
                onPress={() => setMode('PARTIAL')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="warning"
                  size={16}
                  color={mode === 'PARTIAL' ? '#D97706' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    mode === 'PARTIAL' && styles.tabBtnTextActivePartial,
                  ]}
                >
                  Trừ 1 phần (Đi trễ / Vi phạm)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, mode === 'MISSED' && styles.tabBtnActiveMissed]}
                onPress={() => setMode('MISSED')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={mode === 'MISSED' ? colors.danger : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    mode === 'MISSED' && styles.tabBtnTextActiveMissed,
                  ]}
                >
                  Vắng ca (-100%)
                </Text>
              </TouchableOpacity>
            </View>

            {/* PARTIAL MODE BODY */}
            {mode === 'PARTIAL' && (
              <View style={styles.sectionWrap}>
                {/* Method selector */}
                <Text style={styles.fieldLabel}>Hình thức khấu trừ:</Text>
                <View style={styles.methodRow}>
                  <TouchableOpacity
                    style={[
                      styles.methodBtn,
                      penaltyType === 'HOURS' && styles.methodBtnActive,
                    ]}
                    onPress={() => setPenaltyType('HOURS')}
                  >
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={penaltyType === 'HOURS' ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.methodText,
                        penaltyType === 'HOURS' && styles.methodTextActive,
                      ]}
                    >
                      Trừ theo số tiếng
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.methodBtn,
                      penaltyType === 'AMOUNT' && styles.methodBtnActive,
                    ]}
                    onPress={() => setPenaltyType('AMOUNT')}
                  >
                    <Ionicons
                      name="cash-outline"
                      size={16}
                      color={penaltyType === 'AMOUNT' ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.methodText,
                        penaltyType === 'AMOUNT' && styles.methodTextActive,
                      ]}
                    >
                      Trừ theo số tiền
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Hours selection */}
                {penaltyType === 'HOURS' ? (
                  <View style={styles.pickerBox}>
                    <Text style={styles.subLabel}>Chọn số giờ trừ:</Text>
                    <View style={styles.chipsRow}>
                      {hourOptions.map((h) => (
                        <TouchableOpacity
                          key={h}
                          style={[
                            styles.chip,
                            deductedHours === h && styles.chipActive,
                          ]}
                          onPress={() => setDeductedHours(h)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              deductedHours === h && styles.chipTextActive,
                            ]}
                          >
                            -{h}h
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : (
                  /* Amount selection */
                  <View style={styles.pickerBox}>
                    <Text style={styles.subLabel}>Chọn mức tiền phạt:</Text>
                    <View style={styles.chipsRow}>
                      {amountOptions.map((amt) => (
                        <TouchableOpacity
                          key={amt}
                          style={[
                            styles.chip,
                            deductedAmount === amt && styles.chipActive,
                          ]}
                          onPress={() => setDeductedAmount(amt)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              deductedAmount === amt && styles.chipTextActive,
                            ]}
                          >
                            -{formatVND(amt)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* MISSED MODE BODY */}
            {mode === 'MISSED' && (
              <View style={styles.missedNotice}>
                <Ionicons name="alert-circle" size={24} color={colors.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.missedNoticeTitle}>
                    Khấu trừ 100% lương ca làm
                  </Text>
                  <Text style={styles.missedNoticeDesc}>
                    Nhân viên không đến nhận ca hoặc vi phạm nghiêm trọng. Lương ca làm sẽ về 0đ.
                  </Text>
                </View>
              </View>
            )}

            {/* Reason input */}
            <View style={styles.inputWrap}>
              <Text style={styles.fieldLabel}>Lý do vi phạm / ghi chú:</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Ví dụ: Đi muộn 45 phút, về sớm, không dọn dẹp quán..."
                placeholderTextColor={colors.textMuted}
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Calculation Preview Card */}
            <View style={styles.previewCard}>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Lương gốc ca ({hours}h):</Text>
                <Text style={styles.previewValue}>{formatVND(fullShiftPay)}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={[styles.previewLabel, { color: colors.danger }]}>Khấu trừ:</Text>
                <Text style={[styles.previewValue, { color: colors.danger, fontWeight: '800' }]}>
                  -{formatVND(previewDeductedPay)}
                </Text>
              </View>
              <View style={styles.previewDivider} />
              <View style={styles.previewRow}>
                <Text style={styles.previewTotalLabel}>Thực nhận dự kiến:</Text>
                <Text style={styles.previewTotalValue}>
                  {formatVND(previewTakeHome)}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.btnRow}>
              {isAlreadyEvaluated && (
                <TouchableOpacity
                  style={styles.restoreBtn}
                  onPress={handleRestore}
                  disabled={loading}
                >
                  <Ionicons name="refresh" size={16} color="#059669" />
                  <Text style={styles.restoreText}>Khôi phục ca đạt 100%</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  mode === 'MISSED' ? styles.submitBtnMissed : styles.submitBtnPartial,
                ]}
                onPress={handleSave}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.submitText}>Lưu kết quả đánh giá</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  grabHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D2D2D7',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scrollBody: {
    paddingBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActivePartial: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  tabBtnActiveMissed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabBtnTextActivePartial: {
    color: '#D97706',
  },
  tabBtnTextActiveMissed: {
    color: colors.danger,
  },
  sectionWrap: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  methodBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  methodText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  methodTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  pickerBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  missedNotice: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FEF2F2',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 14,
    alignItems: 'center',
  },
  missedNoticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
  },
  missedNoticeDesc: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 2,
    lineHeight: 16,
  },
  inputWrap: {
    marginBottom: 14,
  },
  reasonInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 12,
    color: colors.text,
    minHeight: 65,
    textAlignVertical: 'top',
  },
  previewCard: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  previewLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  previewValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  previewDivider: {
    height: 1,
    backgroundColor: '#FED7AA',
    marginVertical: 6,
  },
  previewTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  previewTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },
  btnRow: {
    gap: 10,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  restoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
  },
  submitBtnPartial: {
    backgroundColor: colors.primary,
  },
  submitBtnMissed: {
    backgroundColor: colors.danger,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default ShiftEvaluationModal;
