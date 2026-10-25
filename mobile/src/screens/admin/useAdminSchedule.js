import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { scheduleApi, memberApi, shiftApi } from '../../services/api';
import {
  getMondayOfWeek,
  getDaysOfWeek,
  addWeeks,
  formatDateToISO,
  getWeekNumberAndYear,
} from '../../utils/formatters';
import { calculateWeeklyPayroll } from '../../utils/schedulePayrollHelpers';
import {
  checkMemberShiftConflict,
  checkSingleAssignmentConflict,
  detectScheduleConflicts,
} from '../../utils/scheduleConflictHelpers';

const getShiftId = (shift) => (typeof shift === 'object' && shift !== null ? shift._id : shift);
const getUserId = (user) => (typeof user === 'object' && user !== null ? user._id : user);

export const useAdminSchedule = () => {
  const { store } = useAuth();
  const [currentMonday, setCurrentMonday] = useState(() => getMondayOfWeek());
  const [selectedDate, setSelectedDate] = useState(() => formatDateToISO(new Date()));
  const [schedule, setSchedule] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [storeShifts, setStoreShifts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [crossStoreShifts, setCrossStoreShifts] = useState([]);

  const daysOfWeek = useMemo(() => getDaysOfWeek(currentMonday), [currentMonday]);
  const { week, year } = useMemo(() => getWeekNumberAndYear(currentMonday), [currentMonday]);
  const currentWeekNumber = useMemo(() => getWeekNumberAndYear(new Date()).week, []);

  // Tải dữ liệu lịch, ca và nhân viên
  const loadScheduleData = useCallback(async (isRefresh = false) => {
    if (!store?._id) return;
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [schedRes, shiftsRes, membersRes] = await Promise.all([
        scheduleApi.getWeeklySchedule(store._id, week, year).catch(() => null),
        shiftApi.getShifts(store._id).catch(() => null),
        memberApi.getMembers(store._id).catch(() => null),
      ]);

      setCrossStoreShifts(schedRes?.crossStoreShifts || []);
      if (schedRes?.success && schedRes.hasSchedule && schedRes.schedule) {
        setSchedule(schedRes.schedule);
        setAssignments(schedRes.schedule.assignments || []);
      } else {
        setSchedule(null);
        setAssignments([]);
      }
      if (shiftsRes?.success) setStoreShifts(shiftsRes.shifts || shiftsRes.data || []);
      if (membersRes?.success) setMembers(membersRes.members || []);
    } catch (err) {
      console.warn('Error loading admin schedule:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [store?._id, week, year]);

  useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]);

  // Điều hướng tuần
  const handlePrevWeek = () => setCurrentMonday((prev) => addWeeks(prev, -1));
  const handleNextWeek = () => setCurrentMonday((prev) => addWeeks(prev, 1));
  const handleToday = () => {
    const today = new Date();
    setCurrentMonday(getMondayOfWeek(today));
    setSelectedDate(formatDateToISO(today));
  };

  // Ca làm việc trong ngày được chọn
  const shiftsForDay = useMemo(() => {
    return storeShifts.map((s) => {
      const sId = (s._id || '').toString();
      const dayAssignments = assignments.filter((a) => {
        const aShiftId = (getShiftId(a.shiftId) || '').toString();
        return a.date === selectedDate && aShiftId === sId;
      });

      return {
        shiftId: s._id,
        shiftName: s.name,
        startTime: s.startTime,
        endTime: s.endTime,
        durationHours: s.durationHours,
        peakLevel: s.peakLevel,
        color: s.color,
        date: selectedDate,
        assignments: dayAssignments,
      };
    });
  }, [storeShifts, assignments, selectedDate]);

  // Bảng lương tuần
  const payrollSummary = useMemo(() => {
    return calculateWeeklyPayroll(members, assignments, storeShifts);
  }, [members, assignments, storeShifts]);

  // Kiểm tra trùng ca
  const getConflictingShift = useCallback(
    (userId, dateStr, targetShiftId) => {
      return checkMemberShiftConflict(userId, dateStr, targetShiftId, assignments, storeShifts, crossStoreShifts, store?.name);
    },
    [assignments, storeShifts, crossStoreShifts, store?.name]
  );

  const getAssignmentConflict = useCallback(
    (assignment) => {
      return checkSingleAssignmentConflict(assignment, assignments, storeShifts, crossStoreShifts, store?.name);
    },
    [assignments, storeShifts, crossStoreShifts, store?.name]
  );

  const scheduleConflicts = useMemo(() => {
    return detectScheduleConflicts(assignments, storeShifts, members, crossStoreShifts);
  }, [assignments, storeShifts, members, crossStoreShifts]);

  // Tự động xếp ca
  const handleRunAutoSchedule = async (config, onSuccess) => {
    if (!store?._id) return;
    try {
      setAutoLoading(true);
      const payload = {
        week,
        year,
        startDate: daysOfWeek[0].dateStr,
        endDate: daysOfWeek[6].dateStr,
        days: daysOfWeek.map((d) => ({ date: d.dateStr, dayOfWeek: d.dayName })),
        staffPerShift: config.staffPerShift || 'AUTO_BY_STARS',
        maxShiftsPerDay: config.maxShiftsPerDay || 1,
        preserveExisting: Boolean(config.preserveExisting),
        existingAssignments: assignments,
      };

      const res = await scheduleApi.autoGenerate(store._id, payload);
      if (onSuccess) onSuccess();
      Alert.alert('Thành công', res.message || 'Đã tự động xếp ca xong (Lưu bản nháp)!');
      await loadScheduleData();
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể xếp ca tự động.');
    } finally {
      setAutoLoading(false);
    }
  };

  // Xuất bản lịch
  const handlePublish = async () => {
    if (!store?._id) return;

    if (scheduleConflicts.length > 0) {
      const first = scheduleConflicts[0];
      Alert.alert(
        'Không thể xuất bản — Trùng ca làm việc!',
        first.message || 'Lịch làm việc đang có ca bị trùng giờ. Vui lòng gỡ ca trùng trước khi xuất bản.'
      );
      return;
    }

    Alert.alert(
      'Xuất bản lịch làm việc',
      `Bạn có chắc chắn muốn xuất bản lịch làm Tuần ${week}/${year} và gửi email thông báo tới toàn bộ nhân viên?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xuất bản ngay',
          onPress: async () => {
            try {
              setPublishing(true);
              const res = await scheduleApi.publishSchedule(store._id, { week, year });
              Alert.alert('Thành công', res.message || 'Xuất bản lịch thành công!');
              await loadScheduleData();
            } catch (err) {
              Alert.alert('Lỗi', err.message || 'Xuất bản thất bại.');
            } finally {
              setPublishing(false);
            }
          },
        },
      ]
    );
  };

  const saveDraftAssignments = async (updatedAssignments) => {
    await scheduleApi.saveDraft(store._id, {
      week,
      year,
      startDate: daysOfWeek[0].dateStr,
      endDate: daysOfWeek[6].dateStr,
      assignments: updatedAssignments,
    });
    await loadScheduleData();
  };

  // Gán nhân viên vào ca
  const handleSelectMemberToAssign = async (targetShift, member, onSuccess) => {
    if (!targetShift || !store?._id) return;

    const uId = member.userId?._id || member.userId;
    const conflict = getConflictingShift(uId, targetShift.date, targetShift.shiftId);
    if (conflict) {
      const empName = member.userId?.fullName || member.fullName || 'Nhân viên';
      const msg = conflict.isCrossStore
        ? `Nhân viên "${empName}" đã có ca "${conflict.name}" (${conflict.startTime} - ${conflict.endTime}) tại chi nhánh "${conflict.storeName}" vào ngày này. Không thể phân 2 ca cùng khung giờ!`
        : `Nhân viên "${empName}" đã được phân ca "${conflict.name}" (${conflict.startTime} - ${conflict.endTime}) vào ngày này. Không thể phân 2 ca cùng khung giờ!`;
      Alert.alert('Trùng giờ làm việc!', msg);
      return;
    }

    const dayObj = daysOfWeek.find((d) => d.dateStr === targetShift.date);
    const wage = member.hourlyWage || 20000;
    const hours = targetShift.durationHours || 4;

    const newAssignment = {
      date: targetShift.date,
      dayOfWeek: dayObj?.dayName || 'Thứ Hai',
      shiftId: targetShift.shiftId,
      userId: uId,
      hours,
      hourlyWage: wage,
      totalPay: Math.round(hours * wage),
      attendanceStatus: 'COMPLETED',
      penaltyType: 'NONE',
      deductedHours: 0,
      deductedPay: 0,
    };

    try {
      if (onSuccess) onSuccess();
      await saveDraftAssignments([...assignments, newAssignment]);
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể gán nhân viên vào ca.');
    }
  };

  // Xóa nhân viên khỏi ca
  const handleRemoveEmployee = async (shiftItem, empId) => {
    if (!store?._id) return;

    const updatedAssignments = assignments.filter((a) => {
      const aShiftId = (getShiftId(a.shiftId) || '').toString();
      const aUserId = (getUserId(a.userId) || '').toString();
      const targetShiftId = (shiftItem.shiftId || '').toString();
      const targetUserId = (empId || '').toString();
      return !(a.date === shiftItem.date && aShiftId === targetShiftId && aUserId === targetUserId);
    });

    try {
      await saveDraftAssignments(updatedAssignments);
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể xóa nhân viên khỏi ca.');
    }
  };

  return {
    store,
    week,
    year,
    currentWeekNumber,
    daysOfWeek,
    selectedDate,
    setSelectedDate,
    schedule,
    assignments,
    storeShifts,
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
  };
};

export default useAdminSchedule;
