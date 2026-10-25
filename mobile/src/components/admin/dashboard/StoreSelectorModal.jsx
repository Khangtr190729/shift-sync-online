import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import { useAuth } from '../../../context/AuthContext';

export const StoreSelectorModal = ({ visible, onClose }) => {
  const { store, stores, switchStore, createStore, isAdmin } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSelectStore = async (storeId) => {
    if (String(storeId) === String(store?._id)) {
      onClose();
      return;
    }
    try {
      await switchStore(storeId);
      onClose();
    } catch (e) {
      Alert.alert('Lỗi', e.message || 'Không thể chuyển cơ sở');
    }
  };

  const handleCreateNewBranch = async () => {
    if (!newStoreName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên chi nhánh mới.');
      return;
    }

    try {
      setCreating(true);
      await createStore({
        name: newStoreName.trim(),
        address: newStoreAddress.trim(),
      });
      setNewStoreName('');
      setNewStoreAddress('');
      setShowCreateForm(false);
      onClose();
      Alert.alert('Thành công', 'Đã tạo thêm chi nhánh mới thành công!');
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể tạo chi nhánh mới.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="business" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.title}>Hệ thống Chi nhánh</Text>
                <Text style={styles.subtitle}>
                  Đang quản lý {stores?.length || 1} cơ sở
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* List or Create Form */}
          {showCreateForm ? (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Mở thêm cơ sở / chi nhánh mới</Text>

              <Text style={styles.inputLabel}>
                Tên chi nhánh <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="VD: Chi nhánh 2 - Ninh Kiều"
                placeholderTextColor={colors.textMuted}
                value={newStoreName}
                onChangeText={setNewStoreName}
              />

              <Text style={styles.inputLabel}>Địa chỉ chi nhánh</Text>
              <TextInput
                style={styles.textInput}
                placeholder="VD: 123 Đường 30/4, Ninh Kiều, Cần Thơ"
                placeholderTextColor={colors.textMuted}
                value={newStoreAddress}
                onChangeText={setNewStoreAddress}
              />

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowCreateForm(false)}
                  disabled={creating}
                >
                  <Text style={styles.cancelBtnText}>Quay lại</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitBtn, creating && styles.disabledBtn]}
                  onPress={handleCreateNewBranch}
                  disabled={creating}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Tạo chi nhánh</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <ScrollView style={styles.storeList} showsVerticalScrollIndicator={false}>
                {stores && stores.length > 0 ? (
                  stores.map((s) => {
                    const isSelected = String(s._id) === String(store?._id);
                    return (
                      <TouchableOpacity
                        key={s._id}
                        style={[
                          styles.storeItem,
                          isSelected && styles.storeItemActive,
                        ]}
                        onPress={() => handleSelectStore(s._id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.storeInfo}>
                          <View style={styles.storeNameRow}>
                            <Ionicons
                              name="storefront"
                              size={15}
                              color={isSelected ? colors.primary : colors.textSecondary}
                            />
                            <Text
                              style={[
                                styles.storeItemName,
                                isSelected && styles.storeItemNameActive,
                              ]}
                            >
                              {s.name}
                            </Text>
                          </View>
                          {s.address ? (
                            <View style={styles.storeAddressRow}>
                              <Ionicons
                                name="location-outline"
                                size={12}
                                color={colors.textMuted}
                              />
                              <Text style={styles.storeItemAddress} numberOfLines={1}>
                                {s.address}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {isSelected ? (
                          <View style={styles.checkCircle}>
                            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                          </View>
                        ) : (
                          <View style={styles.uncheckCircle} />
                        )}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={styles.emptyText}>Chưa có cửa hàng nào</Text>
                )}
              </ScrollView>

              {isAdmin && (
                <TouchableOpacity
                  style={styles.addBranchBtn}
                  onPress={() => setShowCreateForm(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.addBranchBtnText}>Mở thêm chi nhánh mới</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeList: {
    marginTop: 12,
    maxHeight: 260,
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  storeItemActive: {
    backgroundColor: '#FFF7F0',
    borderColor: colors.primary,
  },
  storeInfo: {
    flex: 1,
    paddingRight: 10,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storeItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  storeItemNameActive: {
    color: colors.primaryDark,
  },
  storeAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  storeItemAddress: {
    fontSize: 11,
    color: colors.textMuted,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uncheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    paddingVertical: 20,
    fontSize: 13,
  },
  addBranchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 16,
    marginTop: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  addBranchBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // Form styles
  formContainer: {
    paddingTop: 16,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 8,
  },
  required: {
    color: colors.danger,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
  },
  formActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});

export default StoreSelectorModal;
