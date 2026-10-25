import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { scheduleApi } from '../../services/api';
import colors from '../../theme/colors';
import useAdminSchedule from './useAdminSchedule';

import AdminWeekNavigator from '../../components/admin/schedule/AdminWeekNavigator';
import ScheduleConflictAlertCard from '../../components/admin/schedule/ScheduleConflictAlertCard';
import AdminDayStrip from '../../components/admin/schedule/AdminDayStrip';
import AdminDayShiftsList from '../../components/admin/schedule/AdminDayShiftsList';
import AutoScheduleModal from '../../components/admin/schedule/AutoScheduleModal';
import AssignEmployeeModal from '../../components/admin/schedule/AssignEmployeeModal';
import PayrollSummaryCard from '../../components/admin/schedule/PayrollSummaryCard';
import ShiftEvaluationModal from '../../components/admin/schedule/ShiftEvaluationModal';

const getShiftId = (shift) => (typeof shift === 'object' && shift !== null ? shift._id : shift);
const getUserId = (user) => (typeof user === 'object' && user !== null ? user._id : user);

export const AdminScheduleScreen = () => {
  const {
    store,
    week,
    year,
    currentWeekNumber,
    daysOfWeek,
    selectedDate,
    setSelectedDate,
    schedule,
    members,
    loading,
    refreshing,
    autoLoading,
    publishing,
    shiftsForDay,
    payrollSummary,
    scheduleConflicts,
    getConflictingShift,
    getAssignmentConflict,
    loadScheduleData,
    handlePrevWeek,
    handleNextWeek,
    handleToday,
    handleRunAutoSchedule,
    handlePublish,
    handleSelectMemberToAssign,
    handleRemoveEmployee,
  } = useAdminSchedule();

  // Modal UI States
  const [autoModalVisible, setAutoModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedShiftForAssign, setSelectedShiftForAssign] = useState(null);
  const [evalModalVisible, setEvalModalVisible] = useState(false);
  const [selectedAssignForEval, setSelectedAssignForEval] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  // Mở modal đánh giá ca
  const handleOpenEvaluate = (shiftItem, assign) => {
    const uId = getUserId(assign.userId);
    const uName =
      (typeof assign.userId === 'object' && assign.userId !== null
        ? assign.userId.fullName || assign.userId.name
        : '') ||
      assign.userName ||
      assign.fullName ||
      'Nhân viên';

    setSelectedAssignForEval({
      shiftId: getShiftId(assign.shiftId) || shiftItem.shiftId,
      shiftName: shiftItem.shiftName,
      date: assign.date || shiftItem.date,
      userId: uId,
      userName: uName,
      hourlyWage: assign.hourlyWage || 20000,
      hours: assign.hours || shiftItem.durationHours || 4,
      attendanceStatus: assign.attendanceStatus || 'COMPLETED',
      deductedHours: assign.deductedHours || 0,
      deductedPay: assign.deductedPay || 0,
      penaltyType: assign.penaltyType || 'HOURS',
      missedReason: assign.missedReason || '',
    });
    setEvalModalVisible(true);
  };

  // Lưu kết quả đánh giá ca
  const handleSaveEvaluation = async (evalData) => {
    if (!store?._id) return;
    try {
      setEvaluating(true);
      const res = await scheduleApi.evaluateShift(store._id, {
        week,
        year,
        weekStart: daysOfWeek[0]?.dateStr,
        date: evalData.date,
        shiftId: evalData.shiftId,
        userId: evalData.userId,
        attendanceStatus: evalData.attendanceStatus,
        missedReason: evalData.missedReason,
        deductedHours: evalData.deductedHours,
        deductedPay: evalData.deductedPay,
        penaltyType: evalData.penaltyType,
      });

      if (res?.success) {
        setEvalModalVisible(false);
        Alert.alert('Thành công', 'Đã lưu kết quả đánh giá ca làm việc!');
        await loadScheduleData();
      }
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể đánh giá ca làm việc.');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadScheduleData(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Quản lý xếp ca tuần</Text>
          <Text style={styles.subtitle}>
            Điều chỉnh ca làm, phân công nhân viên và gửi thông báo lịch trực
          </Text>
        </View>

        {/* 1. Week Navigator */}
        <AdminWeekNavigator
          week={week}
          year={year}
          status={schedule?.status || 'DRAFT'}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onToday={handleToday}
          isCurrentWeek={week === currentWeekNumber}
          onOpenAutoSchedule={() => setAutoModalVisible(true)}
          onPublish={handlePublish}
          publishing={publishing}
        />

        {/* Banner cảnh báo xung đột ca làm việc */}
        <ScheduleConflictAlertCard conflicts={scheduleConflicts} />

        {/* 2. Payroll Summary Card */}
        <PayrollSummaryCard payrollSummary={payrollSummary} />

        {/* 3. 7-Day Strip */}
        <AdminDayStrip
          daysOfWeek={daysOfWeek}
          selectedDate={selectedDate}
          onSelectDate={(d) => setSelectedDate(d)}
        />

        {/* Loading Spinner */}
        {loading && !refreshing && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Đang cập nhật lịch ca...</Text>
          </View>
        )}

        {/* 4. Danh sách ca làm trong ngày */}
        <AdminDayShiftsList
          shiftsForDay={shiftsForDay}
          selectedDate={selectedDate}
          isPublished={schedule?.status === 'PUBLISHED'}
          getAssignmentConflict={getAssignmentConflict}
          onAssignEmployee={(s) => {
            setSelectedShiftForAssign(s);
            setAssignModalVisible(true);
          }}
          onRemoveEmployee={handleRemoveEmployee}
          onEvaluateEmployee={handleOpenEvaluate}
        />
      </ScrollView>

      {/* Auto Schedule Modal */}
      <AutoScheduleModal
        visible={autoModalVisible}
        onClose={() => setAutoModalVisible(false)}
        onRunAutoSchedule={(config) => handleRunAutoSchedule(config, () => setAutoModalVisible(false))}
        loading={autoLoading}
      />

      {/* Assign Employee Modal */}
      <AssignEmployeeModal
        visible={assignModalVisible}
        onClose={() => setAssignModalVisible(false)}
        targetShift={selectedShiftForAssign}
        members={members}
        onSelectMember={(m) => handleSelectMemberToAssign(selectedShiftForAssign, m, () => setAssignModalVisible(false))}
        getConflictingShift={getConflictingShift}
      />

      {/* Shift Evaluation Modal */}
      <ShiftEvaluationModal
        visible={evalModalVisible}
        onClose={() => setEvalModalVisible(false)}
        targetAssignment={selectedAssignForEval}
        onSaveEvaluation={handleSaveEvaluation}
        loading={evaluating}
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
  header: {
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
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  loadingText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default AdminScheduleScreen;
