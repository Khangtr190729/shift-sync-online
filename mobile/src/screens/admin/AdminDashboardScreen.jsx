import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { memberApi, shiftApi, scheduleApi } from '../../services/api';
import colors from '../../theme/colors';
import { getMondayOfWeek, getWeekNumberAndYear } from '../../utils/formatters';

import StatOverviewCards from '../../components/admin/dashboard/StatOverviewCards';
import QuickActionsGrid from '../../components/admin/dashboard/QuickActionsGrid';
import TodayShiftsSection from '../../components/admin/dashboard/TodayShiftsSection';
import StoreSelectorModal from '../../components/admin/dashboard/StoreSelectorModal';

export const AdminDashboardScreen = ({ navigation }) => {
  const { user, store, stores } = useAuth();
  const [storeModalVisible, setStoreModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [shiftsCount, setShiftsCount] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState({
    shiftCount: 0,
    totalHours: 0,
    totalWageCost: 0,
    isPublished: false,
  });
  const [todayShifts, setTodayShifts] = useState([]);
  const [publishing, setPublishing] = useState(false);

  const { week, year } = getWeekNumberAndYear(new Date());

  const loadDashboardData = useCallback(async () => {
    if (!store?._id) return;
    try {
      const [membersRes, shiftsRes, scheduleRes] = await Promise.all([
        memberApi.getMembers(store._id).catch(() => null),
        shiftApi.getShifts(store._id).catch(() => null),
        scheduleApi.getWeeklySchedule(store._id, week, year).catch(() => null),
      ]);

      if (membersRes?.success) {
        setMemberCount(membersRes.members?.length || 0);
      }
      if (shiftsRes?.success) {
        setShiftsCount(shiftsRes.shifts?.length || 0);
      }
      if (scheduleRes?.success && scheduleRes.schedule) {
        const sched = scheduleRes.schedule;
        const assignments = sched.assignments || [];
        const isPub = sched.status === 'PUBLISHED';

        const totalHours = assignments.reduce((acc, a) => acc + (a.hours || 0), 0);
        const totalCost = assignments.reduce((acc, a) => {
          if (a.attendanceStatus === 'MISSED') return acc;
          if (a.totalPay !== undefined) return acc + a.totalPay;
          return acc + (a.hours || 0) * (a.hourlyWage || 20000);
        }, 0);

        setWeeklyStats({
          shiftCount: assignments.length,
          totalHours,
          totalWageCost: totalCost,
          isPublished: isPub,
        });

        // Filter shifts for today
        const todayStr = new Date().toISOString().split('T')[0];
        const todayAssignments = assignments.filter((a) => a.date === todayStr);

        const storeShiftsList = shiftsRes?.shifts || [];
        const forToday = storeShiftsList.map((s) => {
          const sAssignments = todayAssignments.filter((a) => {
            const aShiftId = a.shiftId?._id || a.shiftId;
            return String(aShiftId) === String(s._id);
          });
          return {
            _id: s._id,
            shiftName: s.name,
            startTime: s.startTime,
            endTime: s.endTime,
            assignedEmployees: sAssignments,
          };
        }).filter((s) => s.assignedEmployees.length > 0);

        setTodayShifts(forToday);
      } else {
        setWeeklyStats({
          shiftCount: 0,
          totalHours: 0,
          totalWageCost: 0,
          isPublished: false,
        });
        setTodayShifts([]);
      }
    } catch (e) {
      console.warn('Dashboard data load error:', e.message);
    }
  }, [store?._id, week, year]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handlePublish = async () => {
    if (!store?._id) return;
    Alert.alert(
      'Xuất bản lịch làm việc',
      `Bạn có chắc chắn muốn xuất bản lịch làm việc Tuần ${week}/${year} và gửi email thông báo tới toàn bộ nhân viên?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xuất bản & Gửi Email',
          onPress: async () => {
            try {
              setPublishing(true);
              const res = await scheduleApi.publishSchedule(store._id, { week, year });
              Alert.alert('Thành công', res.message || 'Lịch làm việc đã được xuất bản thành công!');
              await loadDashboardData();
            } catch (err) {
              Alert.alert('Lỗi', err.message || 'Không thể xuất bản lịch làm.');
            } finally {
              setPublishing(false);
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
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header Store & Owner info */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.storeBadge}
            onPress={() => setStoreModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="storefront" size={14} color={colors.primary} />
            <Text style={styles.storeName}>{store?.name || 'Cửa hàng của tôi'}</Text>
            {stores?.length > 1 && (
              <View style={styles.branchCountBadge}>
                <Text style={styles.branchCountText}>{stores.length}</Text>
              </View>
            )}
            <Ionicons name="chevron-down" size={12} color={colors.primaryDark} style={{ marginLeft: 2 }} />
          </TouchableOpacity>

          <Text style={styles.greetingTitle}>
            Xin chào Chủ quán {user?.fullName || ''}! 👑
          </Text>
          <Text style={styles.weekTag}>
            Quản trị cửa hàng • Tuần {week}/{year}
          </Text>
        </View>

        {/* 1. Stat Overview */}
        <StatOverviewCards
          memberCount={memberCount}
          shiftCount={weeklyStats.shiftCount}
          totalHours={weeklyStats.totalHours}
          totalWageCost={weeklyStats.totalWageCost}
          isPublished={weeklyStats.isPublished}
        />

        {/* 2. Quick Actions */}
        <QuickActionsGrid
          onGoToSchedule={() => navigation.navigate('AdminSchedule')}
          onGoToMembers={() => navigation.navigate('AdminMembers')}
          onGoToShifts={() => navigation.navigate('AdminShifts')}
          onPublishSchedule={handlePublish}
          publishing={publishing}
        />

        {/* 3. Today Shifts Section */}
        <TodayShiftsSection
          todayShifts={todayShifts}
          onGoToSchedule={() => navigation.navigate('AdminSchedule')}
        />
      </ScrollView>

      {/* Store & Branch Selector Modal */}
      <StoreSelectorModal
        visible={storeModalVisible}
        onClose={() => setStoreModalVisible(false)}
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
  topHeader: {
    marginBottom: 18,
    marginTop: 4,
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  storeName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  branchCountBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 2,
  },
  branchCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  weekTag: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
    fontWeight: '500',
  },
});

export default AdminDashboardScreen;
