import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { shiftApi } from '../../services/api';
import colors from '../../theme/colors';

import ShiftSlotItem from '../../components/admin/shift/ShiftSlotItem';
import ShiftFormModal from '../../components/admin/shift/ShiftFormModal';
import ApplePressable from '../../components/ApplePressable';

export const AdminShiftScreen = () => {
  const { store } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [savingShift, setSavingShift] = useState(false);

  const loadShifts = useCallback(async (isRefresh = false) => {
    if (!store?._id) return;
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await shiftApi.getShifts(store._id);
      if (res?.success) {
        setShifts(res.shifts || []);
      }
    } catch (err) {
      console.warn('Error loading shifts:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [store?._id]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingShift(null);
    setModalVisible(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (shift) => {
    setEditingShift(shift);
    setModalVisible(true);
  };

  // Save Shift
  const handleSaveShift = async (shiftData) => {
    if (!store?._id) return;
    try {
      setSavingShift(true);
      if (shiftData._id) {
        // Update
        await shiftApi.updateShift(store._id, shiftData._id, shiftData);
        Alert.alert('Thành công', 'Đã cập nhật ca làm việc!');
      } else {
        // Create
        await shiftApi.createShift(store._id, shiftData);
        Alert.alert('Thành công', 'Đã tạo ca làm việc mới!');
      }
      setModalVisible(false);
      await loadShifts();
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể lưu ca làm việc.');
    } finally {
      setSavingShift(false);
    }
  };

  // Delete Shift
  const handleDeleteShift = (shift) => {
    if (!store?._id) return;
    Alert.alert(
      'Xóa ca làm',
      `Bạn có chắc chắn muốn xóa "${shift.name}" (${shift.startTime} — ${shift.endTime})?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa ca',
          style: 'destructive',
          onPress: async () => {
            try {
              await shiftApi.deleteShift(store._id, shift._id);
              Alert.alert('Thành công', 'Đã xóa ca làm việc.');
              await loadShifts();
            } catch (err) {
              Alert.alert('Lỗi', err.message || 'Không thể xóa ca làm việc.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadShifts(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Quản lý Ca làm</Text>
            <Text style={styles.subtitle}>
              Thiết lập các khung giờ trực và hệ số sao cao điểm của quán
            </Text>
          </View>

          <ApplePressable
            style={styles.addShiftBtn}
            onPress={handleOpenCreate}
            activeScale={0.94}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addShiftText}>Thêm ca</Text>
          </ApplePressable>
        </View>

        {/* Shifts List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>
            DANH SÁCH CA TRỰC ({shifts.length})
          </Text>

          {loading && !refreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Đang tải danh sách ca...</Text>
            </View>
          ) : shifts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="time-outline" size={36} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Chưa có ca làm việc nào</Text>
              <Text style={styles.emptyDesc}>
                Bấm nút "+ Thêm ca" ở góc trên để tạo các khung giờ làm việc cho quán!
              </Text>
            </View>
          ) : (
            shifts.map((shift) => (
              <ShiftSlotItem
                key={shift._id}
                shift={shift}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteShift}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Shift Form Modal */}
      <ShiftFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        initialShift={editingShift}
        onSave={handleSaveShift}
        saving={savingShift}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    marginTop: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    maxWidth: 240,
  },
  addShiftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  addShiftText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  listSection: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});

export default AdminShiftScreen;
