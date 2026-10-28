import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { scheduleApi } from '../services/api';
import colors from '../theme/colors';
import {
  getMondayOfWeek,
  getDaysOfWeek,
  addWeeks,
  formatWeekRange,
  formatDateToISO,
  getWeekNumberAndYear,
} from '../utils/formatters';

import WeekNavigator from '../components/schedule/WeekNavigator';
import DayPickerStrip from '../components/schedule/DayPickerStrip';
import WageSummaryCard from '../components/schedule/WageSummaryCard';
import NextShiftCard from '../components/schedule/NextShiftCard';
import ShiftCardItem from '../components/schedule/ShiftCardItem';
import EmptyShiftState from '../components/schedule/EmptyShiftState';
import ShiftDetailModal from '../components/ShiftDetailModal';
import StoreSelectorModal from '../components/admin/dashboard/StoreSelectorModal';
import ApplePressable from '../components/ApplePressable';

export const MyScheduleScreen = ({ navigation }) => {
  const { user, store, stores, roleInStore, isAdmin } = useAuth();
  const isManager = roleInStore === 'MANAGER' || user?.role === 'MANAGER';

  const [currentMonday, setCurrentMonday] = useState(() => getMondayOfWeek());
  const [selectedDate, setSelectedDate] = useState(() => formatDateToISO(new Date()));
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeShiftDetail, setActiveShiftDetail] = useState(null);
  const [branchModalVisible, setBranchModalVisible] = useState(false);

  const daysOfWeek = useMemo(() => getDaysOfWeek(currentMonday), [currentMonday]);
  const { week, year } = useMemo(() => getWeekNumberAndYear(currentMonday), [currentMonday]);
  const currentWeekNumber = useMemo(() => getWeekNumberAndYear(new Date()).week, []);

  // Fetch schedule
  const loadSchedule = useCallback(async (isRefresh = false) => {
    if (!store) return;
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const res = await scheduleApi.getMySchedule(week, year, store?._id);
      if (res && res.success) {
        setScheduleData({
          shifts: res.shifts || [],
          stats: {
            totalShifts: res.shifts?.length || 0,
            totalHours: res.totalHours || 0,
            hourlyWage: res.hourlyWage || 0,
            estimatedWage: res.totalSalary || 0,
          },
        });
      } else {
        setScheduleData(null);
      }
    } catch (err) {
      console.warn('Error loading schedule:', err.message);
      setScheduleData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [store, week, year]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Navigate weeks
  const handlePrevWeek = () => {
    setCurrentMonday((prev) => addWeeks(prev, -1));
  };

  const handleNextWeek = () => {
    setCurrentMonday((prev) => addWeeks(prev, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonday(getMondayOfWeek(today));
    setSelectedDate(formatDateToISO(today));
  };

  // Filter shifts for the selected date
  const shiftsForSelectedDate = useMemo(() => {
    if (!scheduleData?.shifts) return [];
    return scheduleData.shifts.filter((s) => s.date === selectedDate);
  }, [scheduleData, selectedDate]);

  // Find next upcoming shift
  const nextUpcomingShift = useMemo(() => {
    if (!scheduleData?.shifts || scheduleData.shifts.length === 0) return null;
    const todayISO = formatDateToISO(new Date());
    const upcoming = scheduleData.shifts.find((s) => s.date >= todayISO);
    return upcoming || scheduleData.shifts[0];
  }, [scheduleData]);

  // Map shift dates to check if a day has shifts
  const shiftDatesSet = useMemo(() => {
    const set = new Set();
    if (scheduleData?.shifts) {
      scheduleData.shifts.forEach((s) => set.add(s.date));
    }
    return set;
  }, [scheduleData]);

  const selectedDayInfo = useMemo(() => {
    return daysOfWeek.find((d) => d.dateStr === selectedDate);
  }, [daysOfWeek, selectedDate]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadSchedule(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Store & Employee Header */}
        <View style={styles.topHeader}>
          <View style={styles.topHeaderRow}>
            <View style={styles.storeBadgeContainer}>
              <ApplePressable
                style={styles.storeBadgeWrap}
                onPress={() => stores?.length > 1 && setBranchModalVisible(true)}
                disabled={!stores || stores.length <= 1}
                activeScale={0.96}
                contentStyle={styles.storeBadge}
              >
                <Ionicons name="storefront" size={14} color={colors.primary} />
                <Text style={styles.storeName}>{store?.name || 'Cửa hàng'}</Text>
                {stores?.length > 1 && (
                  <View style={styles.branchCountPill}>
                    <Text style={styles.branchCountText}>{stores.length}</Text>
                  </View>
                )}
                {stores?.length > 1 && (
                  <Ionicons name="chevron-down" size={13} color={colors.primary} />
                )}
              </ApplePressable>

              {isManager && (
                <View style={styles.managerRoleBadge}>
                  <Text style={styles.managerRoleText}>Quản lý</Text>
                </View>
              )}
            </View>

            {isManager && (
              <ApplePressable
                onPress={() => navigation?.navigate('AdminTabs')}
                activeScale={0.95}
                contentStyle={styles.adminSwitchBtn}
              >
                <Ionicons name="grid" size={13} color="#0066CC" />
                <Text style={styles.adminSwitchBtnText}>Trang Quản lý</Text>
              </ApplePressable>
            )}
          </View>

          <Text style={styles.greetingTitle}>
            {isManager
              ? `Xin chào, ${user?.fullName || 'Quản lý'}! ✨`
              : `Xin chào, ${user?.fullName || 'nhân viên'}! 👋`}
          </Text>
          <Text style={styles.weekRangeText}>
            Tuần {week}/{year} • {formatWeekRange(currentMonday)}
          </Text>
        </View>

        {/* 1. Week Navigator */}
        <WeekNavigator
          week={week}
          year={year}
          isCurrentWeek={week === currentWeekNumber}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onToday={handleToday}
        />

        {/* 2. 7-Day Horizontal Date Strip */}
        <DayPickerStrip
          daysOfWeek={daysOfWeek}
          selectedDate={selectedDate}
          shiftDatesSet={shiftDatesSet}
          onSelectDate={(dateStr) => setSelectedDate(dateStr)}
        />

        {/* Loading Indicator */}
        {loading && !refreshing && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải lịch làm việc...</Text>
          </View>
        )}

        {/* 3. Estimated Wage Card */}
        <WageSummaryCard stats={scheduleData?.stats} />

        {/* 4. Hero: Next Upcoming Shift Card */}
        <NextShiftCard
          nextShift={nextUpcomingShift}
          onOpenDetail={(item) => setActiveShiftDetail(item)}
        />

        {/* 5. Selected Day's Shifts Section */}
        <View style={styles.shiftsSection}>
          <Text style={styles.shiftsSectionTitle}>
            LỊCH NGÀY {selectedDayInfo?.fullDisplay || selectedDate}
          </Text>

          {shiftsForSelectedDate.length === 0 ? (
            <EmptyShiftState />
          ) : (
            shiftsForSelectedDate.map((item, idx) => (
              <ShiftCardItem
                key={item.assignmentId || idx}
                item={item}
                onOpenDetail={(shift) => setActiveShiftDetail(shift)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Shift Detail Modal */}
      <ShiftDetailModal
        visible={!!activeShiftDetail}
        shiftDetail={activeShiftDetail}
        storeName={store?.name}
        onClose={() => setActiveShiftDetail(null)}
      />

      {/* Branch Selector Modal */}
      <StoreSelectorModal
        visible={branchModalVisible}
        onClose={() => setBranchModalVisible(false)}
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
    marginBottom: 16,
    marginTop: 4,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  storeBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  managerRoleBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  managerRoleText: {
    color: '#0066CC',
    fontSize: 10,
    fontWeight: '700',
  },
  adminSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1D1D1F',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  adminSwitchBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  storeBadgeWrap: {
    alignSelf: 'flex-start',
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  storeName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  branchCountPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
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
  weekRangeText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  shiftsSection: {
    marginBottom: 20,
  },
  shiftsSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
});

export default MyScheduleScreen;
