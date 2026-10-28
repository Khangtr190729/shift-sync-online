import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';

export const InviteCodeBanner = ({
  inviteCode,
  copied,
  onGenerateCode,
  onCopyCode,
  generating = false,
}) => {
  // Safely extract string code if inviteCode is stored as an object { code, expiresAt }
  const displayCode =
    typeof inviteCode === 'object' && inviteCode !== null
      ? (inviteCode.code || '')
      : (typeof inviteCode === 'string' ? inviteCode : '');

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons name="key" size={16} color={colors.primary} />
          <Text style={styles.cardTitle}>MÃ MỜI NHÂN VIÊN GIA NHẬP</Text>
        </View>

        <TouchableOpacity
          style={styles.generateBtn}
          onPress={onGenerateCode}
          disabled={generating}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={13} color={colors.primaryDark} />
          <Text style={styles.generateBtnText}>
            {generating ? 'Đang tạo...' : 'Tạo mã mới'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.cardDesc}>
        Cung cấp mã 6 chữ số này cho nhân viên để họ nhập vào app di động (hiệu lực 60 phút):
      </Text>

      {displayCode ? (
        <View style={styles.codeContainer}>
          <Text style={styles.codeDigits}>{displayCode}</Text>

          <TouchableOpacity
            style={styles.copyBtn}
            onPress={() => onCopyCode(displayCode)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={copied ? 'checkmark' : 'copy-outline'}
              size={15}
              color={copied ? colors.success : colors.primary}
            />
            <Text
              style={[
                styles.copyBtnText,
                copied && { color: colors.success },
              ]}
            >
              {copied ? 'Đã chép' : 'Sao chép'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.noCodeBox}
          onPress={onGenerateCode}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.noCodeText}>Bấm để tạo mã mời 6 chữ số ngay</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#FED7AA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  generateBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 17,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  codeDigits: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primaryDark,
    letterSpacing: 4,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  noCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  noCodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default InviteCodeBanner;
