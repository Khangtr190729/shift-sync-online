import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import colors from '../theme/colors';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';

export const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('Nam');
  const [age, setAge] = useState('');
  const [systemRole, setSystemRole] = useState('ADMIN'); // 'ADMIN' | 'EMPLOYEE'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword || !age) {
      setError('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    const parsedAge = Number(age);
    if (isNaN(parsedAge) || parsedAge < 15 || parsedAge > 100) {
      setError('Độ tuổi làm việc hợp lệ từ 15 đến 100 tuổi.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        gender,
        age: parsedAge,
        systemRole: systemRole,
      });
      // Successful registration will auto-login via context state change
    } catch (err) {
      setError(err.message || 'Đăng ký không thành công. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={Platform.OS === 'ios'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={styles.backButtonText}>Đăng nhập</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Đăng ký tài khoản</Text>
          <Text style={styles.subtitle}>
            {systemRole === 'ADMIN'
              ? 'Thiết lập tài khoản Quản lý & Chủ sở hữu cửa hàng'
              : 'Thiết lập tài khoản Người đi làm / Nhân viên trực ca'}
          </Text>
        </View>

        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          {/* Role Selection Cards */}
          <View style={styles.roleSelectionBox}>
            <Text style={styles.sectionLabel}>
              Bạn đăng ký với vai trò gì? <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.roleCardsRow}>
              {/* Card 1: ADMIN */}
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  systemRole === 'ADMIN' && styles.roleCardActive,
                ]}
                onPress={() => setSystemRole('ADMIN')}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.roleIconCircle,
                    systemRole === 'ADMIN' && styles.roleIconCircleActive,
                  ]}
                >
                  <Ionicons
                    name="storefront"
                    size={20}
                    color={systemRole === 'ADMIN' ? '#FFFFFF' : colors.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.roleCardTitle,
                    systemRole === 'ADMIN' && styles.roleCardTitleActive,
                  ]}
                >
                  Chủ cửa hàng
                </Text>
                <Text style={styles.roleCardDesc}>
                  Quản lý quán, tạo ca làm & tính lương
                </Text>
              </TouchableOpacity>

              {/* Card 2: EMPLOYEE */}
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  systemRole === 'EMPLOYEE' && styles.roleCardActive,
                ]}
                onPress={() => setSystemRole('EMPLOYEE')}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.roleIconCircle,
                    { backgroundColor: systemRole === 'EMPLOYEE' ? '#059669' : '#ECFDF5' },
                  ]}
                >
                  <Ionicons
                    name="briefcase"
                    size={20}
                    color={systemRole === 'EMPLOYEE' ? '#FFFFFF' : '#059669'}
                  />
                </View>
                <Text
                  style={[
                    styles.roleCardTitle,
                    systemRole === 'EMPLOYEE' && styles.roleCardTitleActive,
                  ]}
                >
                  Người đi làm
                </Text>
                <Text style={styles.roleCardDesc}>
                  Xem lịch làm việc, theo dõi lương ca
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <CustomInput
            label="Họ và tên"
            required
            placeholder="Ví dụ: Nguyễn Văn An"
            value={fullName}
            onChangeText={(t) => {
              setFullName(t);
              setError('');
            }}
            autoCapitalize="words"
            leftIcon={
              <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
            }
          />

          <CustomInput
            label="Địa chỉ Email"
            required
            placeholder="an.nguyen@example.com"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={
              <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
            }
          />

          <CustomInput
            label="Mật khẩu"
            required
            placeholder="Tối thiểu 6 ký tự"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setError('');
            }}
            secureTextEntry
            leftIcon={
              <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
            }
          />

          <CustomInput
            label="Xác nhận mật khẩu"
            required
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChangeText={(t) => {
              setConfirmPassword(t);
              setError('');
            }}
            secureTextEntry
            leftIcon={
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.textSecondary} />
            }
          />

          {/* Giới tính Selection */}
          <View style={styles.genderContainer}>
            <Text style={styles.sectionLabel}>
              Giới tính <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.genderRow}>
              {['Nam', 'Nữ', 'Khác'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderChip,
                    gender === g && styles.genderChipSelected,
                  ]}
                  onPress={() => setGender(g)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.genderChipText,
                      gender === g && styles.genderChipTextSelected,
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tuổi */}
          <CustomInput
            label="Tuổi"
            required
            placeholder="Ví dụ: 20"
            value={age}
            onChangeText={(t) => {
              setAge(t.replace(/\D/g, ''));
              setError('');
            }}
            keyboardType="number-pad"
            maxLength={3}
            leftIcon={
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
            }
          />

          <CustomButton
            title="Hoàn tất đăng ký"
            onPress={handleRegister}
            loading={loading}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 4,
    paddingVertical: 6,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  errorBannerText: {
    fontSize: 11,
    color: colors.danger,
    fontWeight: '600',
    flex: 1,
  },
  genderContainer: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  required: {
    color: colors.danger,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderChipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  genderChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  genderChipTextSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  roleSelectionBox: {
    marginBottom: 16,
  },
  roleCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  roleCardActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  roleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  roleIconCircleActive: {
    backgroundColor: colors.primary,
  },
  roleCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  roleCardTitleActive: {
    color: colors.primaryDark,
  },
  roleCardDesc: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  bold: {
    fontWeight: '700',
  },
  submitButton: {
    marginTop: 4,
  },
});

export default RegisterScreen;
