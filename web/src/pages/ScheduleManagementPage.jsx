import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Save,
  Send,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { scheduleApi, shiftApi, memberApi, storeApi } from '../services/api';
import {
  getMondayOfWeek,
  getDaysOfWeek,
  addWeeks,
  formatWeekRange,
  formatDateToISO,
  getWeekNumberAndYear,
  formatVND,
} from '../utils/formatters';

import {
  getUserId,
  getShiftId,
  isShiftPassedOrCompleted,
  isShiftStartedOrPassed,
} from '../utils/scheduleTimeHelpers';
import { calculateWeeklyPayrollSummary } from '../utils/schedulePayroll';
import { useScheduleConflicts } from '../hooks/useScheduleConflicts';

import { ScheduleTimetableGrid } from '../components/schedules/ScheduleTimetableGrid';
import { AssignEmployeeModal } from '../components/schedules/AssignEmployeeModal';
import { AutoScheduleModal } from '../components/schedules/AutoScheduleModal';
import { PublishScheduleModal } from '../components/schedules/PublishScheduleModal';
import { PayrollSummaryCard } from '../components/schedules/PayrollSummaryCard';
import { ScheduleAlerts } from '../components/schedules/ScheduleAlerts';
import { InitialStoreSetup } from '../components/schedules/InitialStoreSetup';

// Re-export helpers for backward compatibility
export {
  getUserId,
  getShiftId,
  isShiftPassedOrCompleted,
  isShiftStartedOrPassed,
};

export const ScheduleManagementPage = () => {
  const { store, user, refreshUser } = useAuth();
  const [currentMonday, setCurrentMonday] = useState(() => getMondayOfWeek());
  const [shifts, setShifts] = useState([]);
  const [members, setMembers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [scheduleStatus, setScheduleStatus] = useState('DRAFT');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [crossStoreShifts, setCrossStoreShifts] = useState([]);

  // Auto-schedule Modal State
  const [autoScheduleModalOpen, setAutoScheduleModalOpen] = useState(false);
  const [autoConfig, setAutoConfig] = useState({
    staffPerShift: 'AUTO_BY_STARS',
    maxShiftsPerDay: 1,
    preserveExisting: false,
  });
  const [autoGenerating, setAutoGenerating] = useState(false);

  // Initial store modal state if owner doesn't have a store yet
  const [newStoreForm, setNewStoreForm] = useState({ name: '', address: '' });
  const [creatingStore, setCreatingStore] = useState(false);

  // Modal State for Managing Shift Roster
  const [assignModal, setAssignModal] = useState({
    isOpen: false,
    date: '',
    shiftId: '',
    selectedUserId: '',
  });

  const daysOfWeek = useMemo(() => getDaysOfWeek(currentMonday), [currentMonday]);
  const { week, year } = useMemo(() => getWeekNumberAndYear(currentMonday), [currentMonday]);
  const todayDateStr = useMemo(() => formatDateToISO(new Date()), []);
  const isPastWeek = useMemo(
    () => Boolean(daysOfWeek[6]?.dateStr && daysOfWeek[6].dateStr < todayDateStr),
    [daysOfWeek, todayDateStr]
  );

  // Hook xử lý và kiểm tra toàn diện các xung đột ca làm việc
  const {
    getConflictingShift,
    getAssignmentConflict,
    scheduleConflicts,
    validateAssignmentsNoOverlap,
  } = useScheduleConflicts({
    assignments,
    shifts,
    members,
    crossStoreShifts,
  });

  // Load shifts and members for current store
  const loadStoreData = useCallback(async () => {
    if (!store?._id) return;
    try {
      const [shiftsRes, membersRes] = await Promise.all([
        shiftApi.getShifts(store._id),
        memberApi.getMembers(store._id),
      ]);
      if (shiftsRes.success) {
        setShifts(shiftsRes.shifts || []);
      }
      if (membersRes.success) {
        const rawMembers = membersRes.members || [];
        const activeOnly = rawMembers.filter((m) => {
          if (m.status && m.status !== 'ACTIVE') return false;
          if (m.roleInStore === 'ADMIN' || m.isOwner) return false;
          const uId = getUserId(m.user?._id || m.userId);
          const isOwner = m.isOwner || (store?.ownerId && String(store.ownerId) === uId);
          return !isOwner;
        });
        setMembers(activeOnly);
      }
    } catch (err) {
      console.error('Error loading shifts or members:', err);
    }
  }, [store?._id, store?.ownerId]);

  // Format assignments from raw API payload
  const formatRawAssignments = useCallback(
    (rawList) => {
      return (rawList || []).map((a) => {
        const sId = getShiftId(a.shiftId);
        const uId = getUserId(a.userId);
        const member = members.find(
          (m) => getUserId(m.userId?._id || m.userId || m.user?._id) === uId
        );
        const uName =
          (typeof a.userId === 'object' && a.userId !== null
            ? a.userId.fullName || a.userId.name
            : '') ||
          member?.fullName ||
          member?.name ||
          'Nhân viên';
        return {
          date: a.date,
          dayOfWeek: a.dayOfWeek,
          shiftId: sId,
          userId: uId,
          hours: a.hours,
          hourlyWage: a.hourlyWage,
          totalPay: a.totalPay,
          penaltyType: a.penaltyType || 'NONE',
          deductedHours: a.deductedHours || 0,
          deductedPay: a.deductedPay || 0,
          attendanceStatus: a.attendanceStatus || 'COMPLETED',
          missedReason: a.missedReason || '',
          evaluatedAt: a.evaluatedAt || null,
          evaluatedBy: a.evaluatedBy || null,
          userObj: { _id: uId, name: uName, fullName: uName },
          shiftObj: typeof a.shiftId === 'object' && a.shiftId !== null ? a.shiftId : null,
        };
      });
    },
    [members]
  );

  // Load schedule for the current selected week
  const loadSchedule = useCallback(async () => {
    if (!store?._id) return;
    try {
      setLoading(true);
      const res = await scheduleApi.getWeekSchedule(store._id, week, year);
      setCrossStoreShifts(res.crossStoreShifts || []);
      if (res.success && res.hasSchedule && res.schedule) {
        setScheduleStatus(res.schedule.status || 'DRAFT');
        const raw = res.schedule.assignments || [];
        const validAssignments = raw.filter((a) => {
          const uId = getUserId(a.userId);
          const isOwner = store?.ownerId && String(store.ownerId) === uId;
          return !isOwner;
        });
        setAssignments(formatRawAssignments(validAssignments));
      } else {
        setAssignments([]);
        setScheduleStatus('DRAFT');
      }
    } catch (err) {
      console.error('Error loading schedule:', err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [store?._id, store?.ownerId, week, year, formatRawAssignments]);

  useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Week navigation
  const handlePrevWeek = () => setCurrentMonday((prev) => addWeeks(prev, -1));
  const handleNextWeek = () => setCurrentMonday((prev) => addWeeks(prev, 1));
  const handleCurrentWeek = () => setCurrentMonday(getMondayOfWeek());
  const isCurrentWeek = currentMonday === getMondayOfWeek();

  // Create store for new owner
  const handleCreateStore = async (e) => {
    e.preventDefault();
    if (!newStoreForm.name.trim()) return;
    try {
      setCreatingStore(true);
      const res = await storeApi.createStore(newStoreForm);
      if (res.success) {
        await refreshUser();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Lỗi khi tạo cửa hàng' });
    } finally {
      setCreatingStore(false);
    }
  };

  // Modal actions
  const handleOpenAssignModal = (dateStr, shiftId) => {
    const currentShiftId = getShiftId(shiftId);
    const targetShift = shifts.find((s) => getShiftId(s._id) === currentShiftId);
    const currentCellAssignments = assignments.filter(
      (a) => a.date === dateStr && getShiftId(a.shiftId) === currentShiftId
    );

    const isPassed = isShiftPassedOrCompleted(dateStr, targetShift);
    if (isPassed && currentCellAssignments.length === 0) {
      setFeedback({
        type: 'error',
        message: `Ca làm việc "${targetShift?.name || 'Ca làm'}" ngày ${dateStr} đã kết thúc. Hệ thống không cho phép xếp lịch cho các ca đã qua trong quá khứ!`,
      });
      return;
    }

    setAssignModal({
      isOpen: true,
      date: dateStr,
      shiftId: currentShiftId,
      selectedUserId: '',
    });
  };

  const handleAddEmployeeToShift = () => {
    if (!assignModal.selectedUserId || !assignModal.date || !assignModal.shiftId) return;
    const uid = getUserId(assignModal.selectedUserId);
    const sid = getShiftId(assignModal.shiftId);
    const targetShift = shifts.find((s) => getShiftId(s._id) === sid);

    if (isShiftPassedOrCompleted(assignModal.date, targetShift)) {
      setFeedback({
        type: 'error',
        message: `Ca làm việc "${targetShift?.name || 'Ca làm'}" ngày ${assignModal.date} đã kết thúc. Hệ thống đã khóa ca để bảo toàn giờ làm và tiền lương của nhân viên!`,
      });
      return;
    }

    if (store?.ownerId && String(store.ownerId) === uid) {
      setFeedback({
        type: 'error',
        message: 'Chủ cửa hàng (ADMIN) không được phân công vào ca làm việc.',
      });
      return;
    }

    const alreadyIn = assignments.some(
      (a) => a.date === assignModal.date && getShiftId(a.shiftId) === sid && getUserId(a.userId) === uid
    );
    if (alreadyIn) {
      setFeedback({
        type: 'error',
        message: 'Nhân viên này đã được phân công vào ca này rồi! Không thể thêm cùng một nhân viên nhiều lần vào cùng một ca.',
      });
      return;
    }

    const conflict = getConflictingShift(uid, assignModal.date, sid);
    if (conflict) {
      const selectedMember = members.find((m) => getUserId(m.user?._id || m.userId) === uid);
      const name = selectedMember?.user?.name || selectedMember?.fullName || 'Nhân viên';
      setFeedback({
        type: 'error',
        message: `Không thể phân ca: Nhân viên "${name}" đã có ca "${conflict.name}" (${conflict.startTime} - ${conflict.endTime}) trong cùng khung giờ ngày ${assignModal.date}!`,
      });
      return;
    }

    const selectedMember = members.find(
      (m) => getUserId(m.userId?._id || m.userId || m.user?._id) === uid
    );
    const day = daysOfWeek.find((d) => d.dateStr === assignModal.date);
    const empName =
      selectedMember?.fullName ||
      selectedMember?.name ||
      selectedMember?.user?.fullName ||
      selectedMember?.user?.name ||
      'Nhân viên';

    const newAssignment = {
      date: assignModal.date,
      dayOfWeek: day?.dayName || 'Thứ Hai',
      shiftId: sid,
      userId: uid,
      attendanceStatus: 'COMPLETED',
      missedReason: '',
      evaluatedAt: null,
      evaluatedBy: null,
      userObj: { _id: uid, name: empName, fullName: empName },
      shiftObj: targetShift,
    };

    setAssignments((prev) => [...prev, newAssignment]);
    setAssignModal((prev) => ({ ...prev, selectedUserId: '' }));
  };

  const handleRemoveSingleAssignment = (dateStr, shiftId, userId) => {
    const sId = getShiftId(shiftId);
    const targetShift = shifts.find((s) => getShiftId(s._id) === sId);

    if (isShiftPassedOrCompleted(dateStr, targetShift)) {
      setFeedback({
        type: 'error',
        message: `Ca làm việc "${targetShift?.name || 'Ca làm'}" ngày ${dateStr} đã kết thúc. Hệ thống đã khóa ca để bảo toàn giờ làm và tiền lương của nhân viên, không thể xóa!`,
      });
      return;
    }

    const uId = getUserId(userId);
    setAssignments((prev) =>
      prev.filter(
        (a) => !(a.date === dateStr && getShiftId(a.shiftId) === sId && getUserId(a.userId) === uId)
      )
    );
  };

  const handleClearShiftAssignments = (dateStr, shiftId) => {
    const sId = getShiftId(shiftId);
    const targetShift = shifts.find((s) => getShiftId(s._id) === sId);

    if (isShiftPassedOrCompleted(dateStr, targetShift)) {
      setFeedback({
        type: 'error',
        message: `Ca làm việc "${targetShift?.name || 'Ca làm'}" ngày ${dateStr} đã kết thúc. Hệ thống đã khóa ca để bảo toàn giờ làm và tiền lương của nhân viên, không thể xóa!`,
      });
      return;
    }

    setAssignments((prev) =>
      prev.filter((a) => !(a.date === dateStr && getShiftId(a.shiftId) === sId))
    );
  };

  // Save Draft Schedule
  const handleSaveDraft = async () => {
    if (!store?._id) return;
    if (isPastWeek) {
      setFeedback({
        type: 'error',
        message: 'Tuần này đã kết thúc trong quá khứ. Không thể chỉnh sửa hoặc lưu lịch làm việc.',
      });
      return;
    }
    const validation = validateAssignmentsNoOverlap();
    if (validation.hasError) {
      setFeedback({ type: 'error', message: validation.message });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      const payload = {
        week,
        year,
        startDate: currentMonday,
        endDate: daysOfWeek[6]?.dateStr || addWeeks(currentMonday, 1),
        assignments: assignments.map((a) => {
          const day = daysOfWeek.find((d) => d.dateStr === a.date);
          return {
            date: a.date,
            dayOfWeek: day?.dayName || 'Thứ Hai',
            shiftId: getShiftId(a.shiftId),
            userId: getUserId(a.userId),
            attendanceStatus: a.attendanceStatus || 'COMPLETED',
            penaltyType: a.penaltyType || 'NONE',
            deductedHours: a.deductedHours || 0,
            deductedPay: a.deductedPay || 0,
            totalPay: a.totalPay,
            missedReason: a.missedReason || '',
          };
        }),
      };
      const res = await scheduleApi.saveDraft(store._id, payload);
      if (res.success) {
        setScheduleStatus('DRAFT');
        if (res.schedule && Array.isArray(res.schedule.assignments)) {
          setAssignments(formatRawAssignments(res.schedule.assignments));
        }
        setFeedback({
          type: 'success',
          message: 'Đã lưu bản nháp thành công! Bạn có thể tiếp tục chỉnh sửa.',
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Không thể lưu bản nháp' });
    } finally {
      setSaving(false);
    }
  };

  // Auto Generate Schedule
  const handleAutoSchedule = async () => {
    if (!store?._id) return;
    if (isPastWeek) {
      setFeedback({
        type: 'error',
        message: 'Tuần này đã kết thúc trong quá khứ. Không thể tự động xếp lịch. Vui lòng chọn tuần hiện tại hoặc tương lai.',
      });
      return;
    }
    if (shifts.length === 0) {
      setFeedback({
        type: 'error',
        message: 'Cửa hàng chưa có ca làm việc nào. Vui lòng tạo ca làm trước khi tự động chia ca.',
      });
      return;
    }
    if (members.length === 0) {
      setFeedback({
        type: 'error',
        message: 'Cửa hàng chưa có nhân viên nào. Vui lòng mời nhân viên vào quán trước khi tự động chia ca.',
      });
      return;
    }

    try {
      setAutoGenerating(true);
      setFeedback(null);

      const payload = {
        week,
        year,
        startDate: currentMonday,
        endDate: daysOfWeek[6]?.dateStr || addWeeks(currentMonday, 1),
        days: daysOfWeek.map((d) => ({
          date: d.dateStr,
          dayOfWeek: d.dayName,
        })),
        staffPerShift: autoConfig.staffPerShift || 'AUTO_BY_STARS',
        maxShiftsPerDay: Number(autoConfig.maxShiftsPerDay) || 1,
        preserveExisting: Boolean(autoConfig.preserveExisting),
        existingAssignments: assignments.map((a) => {
          const day = daysOfWeek.find((d) => d.dateStr === a.date);
          return {
            date: a.date,
            dayOfWeek: day?.dayName || 'Thứ Hai',
            shiftId: getShiftId(a.shiftId),
            userId: getUserId(a.userId),
            attendanceStatus: a.attendanceStatus || 'COMPLETED',
            penaltyType: a.penaltyType || 'NONE',
            deductedHours: a.deductedHours || 0,
            deductedPay: a.deductedPay || 0,
            totalPay: a.totalPay,
            missedReason: a.missedReason || '',
            hourlyWage: a.hourlyWage,
          };
        }),
      };

      const res = await scheduleApi.autoGenerate(store._id, payload);
      if (res.success && res.schedule) {
        setScheduleStatus('DRAFT');
        setAssignments(formatRawAssignments(res.schedule.assignments || []));
        setAutoScheduleModalOpen(false);
        setFeedback({
          type: 'success',
          message: res.message || 'Đã tự động xếp lịch nháp thành công! Bạn có thể xem lại và chỉnh sửa trước khi xuất bản.',
        });
      }
    } catch (err) {
      console.error('Error auto-generating schedule:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Không thể tự động xếp lịch',
      });
    } finally {
      setAutoGenerating(false);
    }
  };

  // Cập nhật mức độ cao điểm (1 - 3 sao) của ca làm việc
  const handleUpdateShiftStars = async (shiftId, newStars) => {
    if (!store?._id) return;
    const sId = getShiftId(shiftId);
    const targetShift = shifts.find((s) => getShiftId(s._id) === sId);
    if (!targetShift) return;

    setShifts((prevShifts) =>
      prevShifts.map((s) =>
        getShiftId(s._id) === sId ? { ...s, peakLevel: newStars } : s
      )
    );

    try {
      const res = await shiftApi.updateShift(store._id, sId, { peakLevel: newStars });
      if (res.success) {
        const starLabels = {
          1: '⭐ Bình thường',
          2: '⭐⭐ Khá cao điểm',
          3: '⭐⭐⭐ Rất cao điểm',
        };
        setFeedback({
          type: 'success',
          message: `Đã cập nhật ca "${targetShift.name}": ${starLabels[newStars] || newStars + ' sao'}. Thuật toán xếp ca tự động sẽ điều phối nhân sự theo mức độ cao điểm này.`,
        });
      }
    } catch (err) {
      setShifts((prevShifts) =>
        prevShifts.map((s) =>
          getShiftId(s._id) === sId ? { ...s, peakLevel: targetShift.peakLevel || 1 } : s
        )
      );
      setFeedback({
        type: 'error',
        message: err.message || 'Không thể cập nhật số sao cho ca làm việc',
      });
    }
  };

  // Confirm Publish Schedule
  const handleConfirmPublish = async () => {
    if (!store?._id) return;
    try {
      setSaving(true);
      setFeedback(null);
      const payload = {
        week,
        year,
        startDate: currentMonday,
        endDate: daysOfWeek[6]?.dateStr || addWeeks(currentMonday, 1),
        assignments: assignments.map((a) => {
          const day = daysOfWeek.find((d) => d.dateStr === a.date);
          return {
            date: a.date,
            dayOfWeek: day?.dayName || 'Thứ Hai',
            shiftId: getShiftId(a.shiftId),
            userId: getUserId(a.userId),
            attendanceStatus: a.attendanceStatus || 'COMPLETED',
            penaltyType: a.penaltyType || 'NONE',
            deductedHours: a.deductedHours || 0,
            deductedPay: a.deductedPay || 0,
            totalPay: a.totalPay,
            missedReason: a.missedReason || '',
          };
        }),
      };
      const res = await scheduleApi.publishSchedule(store._id, payload);
      if (res.success) {
        setScheduleStatus('PUBLISHED');
        setPublishModalOpen(false);
        setFeedback({
          type: res.hasEmailError ? 'warning' : 'success',
          message: res.message || 'Đã xuất bản lịch làm việc và thông báo cho nhân viên!',
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Không thể xuất bản lịch' });
    } finally {
      setSaving(false);
    }
  };

  // Đánh giá ca làm việc
  const handleEvaluateShift = async ({
    date,
    shiftId,
    userId,
    attendanceStatus,
    missedReason,
    deductedHours = 0,
    deductedPay = 0,
    penaltyType = 'HOURS',
  }) => {
    if (!store?._id) return;
    try {
      setSaving(true);
      setFeedback(null);
      const res = await scheduleApi.evaluateShift(store._id, {
        week,
        year,
        weekStart: currentMonday,
        date,
        shiftId: getShiftId(shiftId),
        userId: getUserId(userId),
        attendanceStatus,
        missedReason: missedReason || '',
        deductedHours,
        deductedPay,
        penaltyType,
      });

      if (res.success) {
        setAssignments((prev) =>
          prev.map((a) => {
            if (
              a.date === date &&
              getShiftId(a.shiftId) === getShiftId(shiftId) &&
              getUserId(a.userId) === getUserId(userId)
            ) {
              const fullHours = a.hours || 4;
              const wage = a.hourlyWage || 20000;
              const fullPay = Math.round(fullHours * wage);
              let totalPay = fullPay;
              if (attendanceStatus === 'MISSED') totalPay = 0;
              else if (attendanceStatus === 'PARTIAL') totalPay = Math.max(0, fullPay - deductedPay);

              return {
                ...a,
                attendanceStatus,
                penaltyType,
                deductedHours,
                deductedPay,
                totalPay,
                missedReason: missedReason || '',
                evaluatedAt: new Date().toISOString(),
                evaluatedBy: user ? { _id: user._id, fullName: user.fullName || user.name } : null,
              };
            }
            return a;
          })
        );

        setFeedback({
          type: 'success',
          message:
            attendanceStatus === 'MISSED'
              ? `Đã đánh dấu nhân viên không hoàn thành ca và gửi email thông báo trừ toàn bộ lương ca!`
              : attendanceStatus === 'PARTIAL'
              ? `Đã ghi nhận chưa hoàn thành tốt và trừ ${formatVND(deductedPay)} lương ca của nhân viên!`
              : `Đã khôi phục ca làm việc thành hoàn thành và cộng lại lương cho nhân viên!`,
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Không thể cập nhật đánh giá ca làm',
      });
    } finally {
      setSaving(false);
    }
  };

  // Weekly Payroll Summary calculation
  const payrollSummary = useMemo(() => {
    return calculateWeeklyPayrollSummary(members, assignments, shifts);
  }, [members, assignments, shifts]);

  // If Store Owner has not created a store yet
  if (!store) {
    return (
      <InitialStoreSetup
        newStoreForm={newStoreForm}
        setNewStoreForm={setNewStoreForm}
        creatingStore={creatingStore}
        onCreateStore={handleCreateStore}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar: Navigation & Action Buttons */}
      <div className="bg-white p-4 lg:p-5 rounded-2xl border border-[#e5e5e7] shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left: Week Navigation Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-[#f5f5f7] border border-[#e5e5e7] rounded-full p-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-1.5 hover:bg-white hover:text-[#0066cc] rounded-full transition text-[#6e6e73] cursor-pointer"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCurrentWeek}
              className={`px-3 py-1 text-xs font-medium rounded-full transition cursor-pointer ${
                isCurrentWeek
                  ? 'bg-white text-[#1d1d1f] shadow-xs'
                  : 'text-[#6e6e73] hover:bg-white/80 hover:text-[#1d1d1f]'
              }`}
            >
              Tuần này
            </button>
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-1.5 hover:bg-white hover:text-[#0066cc] rounded-full transition text-[#6e6e73] cursor-pointer"
              title="Tuần sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f5f5f7] border border-[#e5e5e7] rounded-full text-xs font-medium text-[#1d1d1f]">
            <Calendar className="w-3.5 h-3.5 text-[#0066cc]" />
            <span>
              {formatWeekRange(currentMonday)} (Tuần {week}/{year})
            </span>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
              scheduleStatus === 'PUBLISHED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                : 'bg-amber-50 text-amber-700 border-amber-200/60'
            }`}
          >
            {scheduleStatus === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp (DRAFT)'}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={saving || autoGenerating || isPastWeek}
            onClick={() => setAutoScheduleModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#e5e5e7] bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] text-xs font-medium transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title={isPastWeek ? 'Tuần này đã kết thúc trong quá khứ' : 'Tự động phân bổ ca làm tối ưu cho nhân viên và lưu bản nháp'}
          >
            <Sparkles className="w-4 h-4 text-[#0066cc]" />
            <span>Tự động xếp lịch</span>
          </button>

          <button
            type="button"
            disabled={saving || autoGenerating || isPastWeek}
            onClick={handleSaveDraft}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#e5e5e7] text-[#1d1d1f] text-xs font-medium bg-white hover:bg-[#f5f5f7] transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title={isPastWeek ? 'Không thể lưu hoặc sửa đổi lịch của tuần đã qua' : 'Lưu bản nháp'}
          >
            <Save className="w-4 h-4 text-[#6e6e73]" />
            <span>{saving ? 'Đang lưu...' : 'Lưu bản nháp'}</span>
          </button>

          <button
            type="button"
            disabled={saving || autoGenerating || isPastWeek}
            onClick={() => {
              if (isPastWeek) {
                setFeedback({
                  type: 'error',
                  message: 'Tuần này đã kết thúc trong quá khứ. Không thể xuất bản lịch làm việc.',
                });
                return;
              }
              const val = validateAssignmentsNoOverlap();
              if (val.hasError) {
                setFeedback({ type: 'error', message: val.message });
                return;
              }
              setPublishModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-medium transition active:scale-[0.98] shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title={isPastWeek ? 'Tuần này đã kết thúc trong quá khứ' : 'Xuất bản lịch & gửi email'}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Xác nhận & gửi email</span>
          </button>
        </div>
      </div>

      {/* Alerts and Notices */}
      <ScheduleAlerts
        feedback={feedback}
        setFeedback={setFeedback}
        scheduleStatus={scheduleStatus}
        hasAssignments={assignments.length > 0}
        scheduleConflicts={scheduleConflicts}
      />

      {/* 7-Day Timetable Grid */}
      <ScheduleTimetableGrid
        shifts={shifts}
        daysOfWeek={daysOfWeek}
        assignments={assignments}
        members={members}
        getShiftId={getShiftId}
        getUserId={getUserId}
        getAssignmentConflict={getAssignmentConflict}
        isShiftPassedOrCompleted={isShiftPassedOrCompleted}
        onOpenAssignModal={handleOpenAssignModal}
        onUpdateShiftStars={handleUpdateShiftStars}
      />

      {/* Weekly Payroll Summary */}
      <PayrollSummaryCard payrollSummary={payrollSummary} />

      {/* MODAL: Manage Shift Roster / Multi-Employee Assignment */}
      <AssignEmployeeModal
        assignModal={assignModal}
        setAssignModal={setAssignModal}
        shifts={shifts}
        members={members}
        assignments={assignments}
        daysOfWeek={daysOfWeek}
        getShiftId={getShiftId}
        getUserId={getUserId}
        getConflictingShift={getConflictingShift}
        getAssignmentConflict={getAssignmentConflict}
        isShiftPassedOrCompleted={isShiftPassedOrCompleted}
        isShiftStartedOrPassed={isShiftStartedOrPassed}
        onEvaluateShift={handleEvaluateShift}
        saving={saving}
        onAddEmployee={handleAddEmployeeToShift}
        onRemoveSingleAssignment={handleRemoveSingleAssignment}
        onClearShiftAssignments={handleClearShiftAssignments}
      />

      {/* MODAL: Auto-Generate Schedule */}
      <AutoScheduleModal
        isOpen={autoScheduleModalOpen}
        onClose={() => setAutoScheduleModalOpen(false)}
        autoConfig={autoConfig}
        setAutoConfig={setAutoConfig}
        autoGenerating={autoGenerating}
        onAutoSchedule={handleAutoSchedule}
        isPastWeek={isPastWeek}
        daysOfWeek={daysOfWeek}
        todayDateStr={todayDateStr}
        shifts={shifts}
        shiftsCount={shifts.length}
        membersCount={members.length}
      />

      {/* MODAL: Publish Confirmation Dialog */}
      <PublishScheduleModal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        saving={saving}
        onConfirmPublish={handleConfirmPublish}
        currentMonday={currentMonday}
        week={week}
        year={year}
      />
    </div>
  );
};

export default ScheduleManagementPage;
