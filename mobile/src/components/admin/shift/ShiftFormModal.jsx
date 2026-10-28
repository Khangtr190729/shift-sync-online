import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import { calculateDuration } from '../../../utils/formatters';
import CustomInput from '../../CustomInput';
import CustomButton from '../../CustomButton';
import ApplePressable from '../../ApplePressable';

const ShiftFormModalComponent = ({
  visible,
  onClose,
  initialShift = null,
  onSave,
  saving = false,
}) => {
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [peakLevel, setPeakLevel] = useState(1);
  const [minEmployees, setMinEmployees] = useState('1');
  const [maxEmployees, setMaxEmployees] = useState('2');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialShift) {
      setName(initialShift.name || '');
      setStartTime(initialShift.startTime || '07:00');
      setEndTime(initialShift.endTime || '12:00');
      setPeakLevel(initialShift.peakLevel || 1);
      setMinEmployees(String(initialShift.minEmployees || 1));
      setMaxEmployees(String(initialShift.maxEmployees || 2));
    } else {
      setName('');
      setStartTime('07:00');
      setEndTime('12:00');
      setPeakLevel(1);
      setMinEmployees('1');
      setMaxEmployees('2');
    }
    setError('');
  }, [initialShift, visible]);

  const durationHours = useMemo(() => calculateDuration(startTime, endTime), [startTime, endTime]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Vui lòng nhập tên ca làm việc.');
      return;
    }
    if (!startTime.trim() || !endTime.trim()) {
      setError('Vui lòng nhập giờ bắt đầu và kết thúc.');
      return;
    }
    if (durationHours <= 0) {
      setError('Giờ kết thúc phải khác giờ bắt đầu (thời lượng phải lớn hơn 0 tiếng).');
      return;
    }

    onSave({
      _id: initialShift?._id,
      name: name.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      durationHours,
      peakLevel,
      minEmployees: Number(minEmployees) || 1,
      maxEmployees: Number(maxEmployees) || 2,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Apple Sheet Grab Handle */}
          <View style={styles.grabHandle} />

          <View style={styles.header}>
            <Text style={styles.title}>
              {initialShift ? 'Chỉnh sửa Ca làm' : 'Thêm Ca làm mới'}
            </Text>
            <ApplePressable onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeScale={0.9}>
              <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
            </ApplePressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <CustomInput
              label="Tên ca làm"
              required
              placeholder="Ví dụ: Ca sáng, Ca tối"
              value={name}
              onChangeText={(t) => {
                setName(t);
                setError('');
              }}
            />

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <CustomInput
                  label="Giờ bắt đầu"
                  required
                  placeholder="07:00"
                  value={startTime}
                  onChangeText={(t) => {
                    setStartTime(t);
                    setError('');
                  }}
                />
              </View>

              <View style={styles.halfCol}>
                <CustomInput
                  label="Giờ kết thúc"
                  required
                  placeholder="12:00"
                  value={endTime}
                  onChangeText={(t) => {
                    setEndTime(t);
                    setError('');
                  }}
                />
              </View>
            </View>

            {/* Calculated duration badge */}
            <View style={styles.durationBadge}>
              <Ionicons name="time" size={14} color={colors.primary} />
              <Text style={styles.durationBadgeText}>
                Thời lượng ca: <Text style={{ fontWeight: '800' }}>{durationHours} tiếng</Text>
              </Text>
            </View>

            {/* Peak Level Stars */}
            <Text style={styles.label}>Mức độ cao điểm:</Text>
            <View style={styles.peakRow}>
              {[
                { level: 1, label: '⭐ Bình thường' },
                { level: 2, label: '⭐⭐ Cao điểm' },
                { level: 3, label: '⭐⭐⭐ Rất cao' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.level}
                  style={[
                    styles.peakPill,
                    peakLevel === item.level && styles.peakPillActive,
                  ]}
                  onPress={() => setPeakLevel(item.level)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.peakPillText,
                      peakLevel === item.level && styles.peakPillTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <CustomInput
                  label="Nhân viên tối thiểu"
                  value={minEmployees}
                  onChangeText={setMinEmployees}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.halfCol}>
                <CustomInput
                  label="Nhân viên tối đa"
                  value={maxEmployees}
                  onChangeText={setMaxEmployees}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>

              <CustomButton
                title={initialShift ? 'Lưu thay đổi' : 'Tạo ca làm'}
                onPress={handleSave}
                loading={saving}
                style={styles.saveBtn}
              />
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
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
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
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.dangerLight,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCol: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  peakRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  peakPill: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  peakPillActive: {
    borderColor: '#D97706',
    backgroundColor: '#FEF3C7',
  },
  peakPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  peakPillTextActive: {
    color: '#B45309',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  durationBadgeText: {
    fontSize: 11,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  saveBtn: {
    flex: 1.6,
  },
});

export const ShiftFormModal = React.memo(ShiftFormModalComponent);
export default ShiftFormModal;
