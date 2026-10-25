import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import AssignMemberItem from './AssignMemberItem';

export const AssignEmployeeModal = ({
  visible,
  onClose,
  targetShift,
  members = [],
  onSelectMember,
  getConflictingShift,
}) => {
  if (!targetShift) return null;

  const currentAssignedIds = new Set(
    (targetShift.assignments || []).map((a) => a.userId?._id || a.userId || a.id)
  );

  const handleMemberPress = (member, isAssigned, conflict) => {
    if (isAssigned) {
      Alert.alert('Đã có trong ca', 'Nhân viên này đã được phân công vào ca làm này rồi.');
      return;
    }
    if (conflict) {
      const empName = member.userId?.fullName || member.fullName || 'Nhân viên';
      if (conflict.isCrossStore) {
        Alert.alert(
          `Trùng ca tại chi nhánh "${conflict.storeName}"!`,
          `Nhân viên "${empName}" đã có ca "${conflict.name}" (${conflict.startTime} - ${conflict.endTime}) tại chi nhánh "${conflict.storeName}" vào ngày này. Không thể phân 2 ca cùng khung giờ!`
        );
      } else {
        Alert.alert(
          'Trùng giờ làm việc!',
          `Nhân viên "${empName}" đã được phân ca "${conflict.name}" (${conflict.startTime} - ${conflict.endTime}) vào ngày này. Không thể phân 2 ca cùng khung giờ!`
        );
      }
      return;
    }
    onSelectMember(member);
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
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.title}>Thêm nhân viên vào ca</Text>
              <Text style={styles.subtitle}>
                {targetShift.shiftName || targetShift.shift?.name} ({targetShift.startTime} — {targetShift.endTime})
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.listLabel}>Chọn nhân viên trong danh sách:</Text>

          <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
            {members.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có nhân viên nào trong quán.</Text>
            ) : (
              members.map((member) => {
                const uId = member.userId?._id || member.userId;
                const isAssigned = currentAssignedIds.has(uId);
                const conflict = getConflictingShift
                  ? getConflictingShift(uId, targetShift.date, targetShift.shiftId)
                  : null;

                return (
                  <AssignMemberItem
                    key={member._id || uId}
                    member={member}
                    isAssigned={isAssigned}
                    conflict={conflict}
                    onPress={() => handleMemberPress(member, isAssigned, conflict)}
                  />
                );
              })
            )}
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
    maxHeight: '80%',
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
  headerTitleWrap: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  listLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 10,
  },
  listScroll: {
    maxHeight: 380,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default AssignEmployeeModal;
