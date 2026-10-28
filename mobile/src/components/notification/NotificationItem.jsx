import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';

const NotificationItemComponent = ({ notification }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'SCHEDULE':
        return <Ionicons name="calendar" size={20} color={colors.primary} />;
      case 'EVALUATION':
        return <Ionicons name="ribbon" size={20} color="#10B981" />;
      case 'INVITE':
      default:
        return <Ionicons name="storefront" size={20} color="#3B82F6" />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case 'SCHEDULE':
        return colors.primaryLight;
      case 'EVALUATION':
        return '#ECFDF5';
      case 'INVITE':
      default:
        return '#EFF6FF';
    }
  };

  return (
    <View
      style={[
        styles.card,
        !notification.read && styles.cardUnread,
      ]}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: getIconBg(notification.type) },
        ]}
      >
        {getIcon(notification.type)}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              !notification.read && styles.titleUnread,
            ]}
          >
            {notification.title}
          </Text>
          {!notification.read && <View style={styles.unreadDot} />}
        </View>

        <Text style={styles.message}>{notification.message}</Text>
        <Text style={styles.time}>{notification.time}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardUnread: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFFDF9',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  titleUnread: {
    fontWeight: '800',
    color: colors.text,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginLeft: 6,
  },
  message: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  time: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
});

export const NotificationItem = React.memo(NotificationItemComponent);
export default NotificationItem;
