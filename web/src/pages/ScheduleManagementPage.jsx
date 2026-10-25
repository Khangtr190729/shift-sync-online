import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Save,
  Send,
  Sparkles,
  Store as StoreIcon,
  Plus,
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
  checkShiftOverlap,
  formatVND,
} from '../utils/formatters';

import { ScheduleTimetableGrid } from '../components/schedules/ScheduleTimetableGrid';
import { AssignEmployeeModal } from '../components/schedules/AssignEmployeeModal';
import { AutoScheduleModal } from '../components/schedules/AutoScheduleModal';
import { PublishScheduleModal } from '../components/schedules/PublishScheduleModal';
import { PayrollSummaryCard } from '../components/schedules/PayrollSummaryCard';
import { ScheduleAlerts } from '../components/schedules/ScheduleAlerts';

// Helpers chuẩn hóa ID về dạng chuỗi an toàn tuyệt đối
export const getUserId = (userOrId) => {
  if (!userOrId) return '';
  if (typeof userOrId === 'object') {
    return String(userOrId._id || userOrId.id || userOrId.userId || '');
  }
  return String(userOrId);
};

export const getShiftId = (shiftOrId) => {
  if (!shiftOrId) return '';
  if (typeof shiftOrId === 'object') {
    return String(shiftOrId._id || shiftOrId.id || shiftOrId.shiftId || '');
  }
  return String(shiftOrId);
};

// Chuyển đổi định dạng giờ "HH:mm" sang số phút
export const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Lấy giờ hiện tại theo định dạng HH:mm chuẩn múi giờ Việt Nam
export const getCurrentVNTime = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
};

// Kiểm tra ca làm việc đã kết thúc/đã qua hay chưa (kể cả ca sáng hôm nay đã làm rồi)
export const isShiftPassedOrCompleted = (dateStr, shift) => {
  if (!dateStr || !shift) return false;
  const todayStr = formatDateToISO(new Date());

  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  // Nếu là ngày hôm nay: so sánh giờ hiện tại với giờ kết thúc của ca
  const currentMinutes = timeToMinutes(getCurrentVNTime());
  const startMinutes = timeToMinutes(shift.startTime);
  let endMinutes = timeToMinutes(shift.endTime);

  if (endMinutes <= startMinutes) {
    // Ca qua đêm của ngày hôm nay (VD: 22:00 -> 06:00):
    return currentMinutes >= startMinutes;
  }

  // Ca trong ngày thông thường (VD: 08:00 -> 12:00):
  return currentMinutes >= endMinutes;
};

// Kiểm tra ca làm việc đã bắt đầu hoặc đã qua hay chưa (ca đang diễn ra hoặc đã kết thúc)
// Ràng buộc: Chỉ ca đang diễn ra hoặc quá khứ mới được quyền đánh giá, ca tương lai không được đánh giá.
export const isShiftStartedOrPassed = (dateStr, shift) => {
  if (!dateStr || !shift) return false;
  const todayStr = formatDateToISO(new Date());

  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  // Nếu là ngày hôm nay: so sánh giờ hiện tại với giờ bắt đầu của ca
  const currentMinutes = timeToMinutes(getCurrentVNTime());
  const startMinutes = timeToMinutes(shift.startTime);

  return currentMinutes >= startMinutes;
};

export const ScheduleManagementPage = () => {
  const { store, user, roleInStore, refreshUser } = useAuth();
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

  // Create initial store modal state if owner doesn't have a store yet
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

  // Load shifts and members for the current store
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

  // Load schedule for the current selected week
  const loadSchedule = useCallback(async () => {
    if (!store?._id) return;
    try {
      setLoading(true);
      const res = await scheduleApi.getWeekSchedule(store._id, week, year);
      if (res.crossStoreShifts) {
        setCrossStoreShifts(res.crossStoreShifts);
      } else {
        setCrossStoreShifts([]);
      }
      if (res.success && res.hasSchedule && res.schedule) {
        setScheduleStatus(res.schedule.status || 'DRAFT');
        const raw = res.schedule.assignments || [];
        const validAssignments = raw.filter((a) => {
          const uId = getUserId(a.userId);
          const isOwner = store?.ownerId && String(store.ownerId) === uId;
          return !isOwner;
        });
        const formatted = validAssignments.map((a) => {
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
        setAssignments(formatted);
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
  }, [store?._id, store?.ownerId, week, year]);

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

  // Check conflicting shifts
  const getConflictingShift = useCallback(
    (userId, dateStr, targetShiftId) => {
      if (!userId || !dateStr || !targetShiftId) return null;
      const tShiftId = getShiftId(targetShiftId);
      const uId = getUserId(userId);
      const targetShift = shifts.find((s) => getShiftId(s._id) === tShiftId);
      if (!targetShift) return null;

      const otherAssignments = assignments.filter(
        (a) => a.date === dateStr && getUserId(a.userId) === uId && getShiftId(a.shiftId) !== tShiftId
      );

      for (const a of otherAssignments) {
        const otherShift = shifts.find((s) => getShiftId(s._id) === getShiftId(a.shiftId)) || a.shiftObj;
        if (otherShift && checkShiftOverlap(targetShift, otherShift)) {
          return otherShift;
        }
      }

      // Kiểm tra trùng ca với các chi nhánh khác
      const crossConflict = crossStoreShifts.find((c) => {
        if (getUserId(c.userId) !== uId || c.date !== dateStr) return false;
        return c.shift && checkShiftOverlap(targetShift, c.shift);
      });

      if (crossConflict) {
        return {
          ...crossConflict.shift,
          isCrossStore: true,
          storeName: crossConflict.storeName,
        };
      }

      return null;
    },
    [assignments, shifts, crossStoreShifts]
  );

  const getAssignmentConflict = useCallback(
    (assignment) => {
      if (!assignment || !assignment.userId || !assignment.date) return null;
      const targetUserId = getUserId(assignment.userId);
      const targetShiftId = getShiftId(assignment.shiftId);
      const targetShift = shifts.find((s) => getShiftId(s._id) === targetShiftId) || assignment.shiftObj;
      if (!targetShift) return null;

      const conflicting = assignments.find((a) => {
        if (
          a === assignment ||
          a.date !== assignment.date ||
          getUserId(a.userId) !== targetUserId
        ) {
          return false;
        }
        if (getShiftId(a.shiftId) === targetShiftId) {
          return true;
        }
        const otherShift = shifts.find((s) => getShiftId(s._id) === getShiftId(a.shiftId)) || a.shiftObj;
        return otherShift && checkShiftOverlap(targetShift, otherShift);
      });

      if (conflicting) {
        return shifts.find((s) => getShiftId(s._id) === getShiftId(conflicting.shiftId)) || conflicting.shiftObj;
      }

      // Kiểm tra trùng ca với các chi nhánh khác
      const crossConflict = crossStoreShifts.find((c) => {
        if (getUserId(c.userId) !== targetUserId || c.date !== assignment.date) return false;
        return c.shift && checkShiftOverlap(targetShift, c.shift);
      });

      if (crossConflict) {
        return {
          ...crossConflict.shift,
          isCrossStore: true,
          storeName: crossConflict.storeName,
        };
      }

      return null;
    },
    [assignments, shifts, crossStoreShifts]
  );

  const scheduleConflicts = useMemo(() => {
    const conflicts = [];
    assignments.forEach((a1, idx1) => {
      const uId1 = getUserId(a1.userId);
      const sId1 = getShiftId(a1.shiftId);
      if (!uId1 || !a1.date || !sId1) return;
      const shift1 = shifts.find((s) => getShiftId(s._id) === sId1) || a1.shiftObj;
      if (!shift1) return;

      assignments.forEach((a2, idx2) => {
        if (idx1 >= idx2) return;
        const uId2 = getUserId(a2.userId);
        const sId2 = getShiftId(a2.shiftId);
        if (a1.date !== a2.date || uId1 !== uId2) return;

        const shift2 = shifts.find((s) => getShiftId(s._id) === sId2) || a2.shiftObj;
        if (!shift2) return;

        const emp = members.find((m) => getUserId(m.user?._id || m.userId) === uId1);
        const empName = emp?.user?.name || emp?.fullName || a1.userObj?.name || 'Nhân viên';

        if (sId1 === sId2) {
          conflicts.push({
            date: a1.date,
            userId: uId1,
            employeeName: empName,
            shift1,
            shift2,
            isDuplicate: true,
            message: `Lỗi trùng lặp: Nhân viên "${empName}" đã được phân công 2 lần vào ca "${shift1.name}" ngày ${a1.date}!`,
          });
          return;
        }

        if (checkShiftOverlap(shift1, shift2)) {
          conflicts.push({
            date: a1.date,
            userId: uId1,
            employeeName: empName,
            shift1,
            shift2,
            isDuplicate: false,
            message: `Lỗi trùng ca: Nhân viên "${empName}" bị trùng giờ làm việc vào ngày ${a1.date} giữa ca "${shift1.name}" (${shift1.startTime} - ${shift1.endTime}) và ca "${shift2.name}" (${shift2.startTime} - ${shift2.endTime})!`,
          });
        }
      });

      // Kiểm tra trùng ca với các chi nhánh khác
      const crossConflict = crossStoreShifts.find(
        (c) => getUserId(c.userId) === uId1 && c.date === a1.date && c.shift && checkShiftOverlap(shift1, c.shift)
      );

      if (crossConflict) {
        const emp = members.find((m) => getUserId(m.user?._id || m.userId) === uId1);
        const empName = emp?.user?.name || emp?.fullName || a1.userObj?.name || 'Nhân viên';
        conflicts.push({
          date: a1.date,
          userId: uId1,
          employeeName: empName,
          shift1,
          shift2: crossConflict.shift,
          isDuplicate: false,
          isCrossStore: true,
          storeName: crossConflict.storeName,
          message: `Lỗi trùng ca liên chi nhánh: Nhân viên "${empName}" đã có ca "${crossConflict.shift.name}" (${crossConflict.shift.startTime} - ${crossConflict.shift.endTime}) tại chi nhánh "${crossConflict.storeName}" vào ngày ${a1.date}!`,
        });
      }
    });
    return conflicts;
  }, [assignments, shifts, members, crossStoreShifts]);

  const validateAssignmentsNoOverlap = useCallback(() => {
    if (scheduleConflicts.length > 0) {
      const first = scheduleConflicts[0];
      return {
        hasError: true,
        message: first.message || `Lỗi trùng ca: Nhân viên "${first.employeeName}" bị trùng giờ làm việc vào ngày ${first.date}!`,
      };
    }
    return { hasError: false };
  }, [scheduleConflicts]);

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
          const raw = res.schedule.assignments || [];
          const formatted = raw.map((a) => {
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
          setAssignments(formatted);
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
        const rawAssignments = res.schedule.assignments || [];
        const formatted = rawAssignments.map((a) => {
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
        setAssignments(formatted);
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

    // Optimistic UI update
    setShifts((prevShifts) =>
      prevShifts.map((s) =>
        getShiftId(s._id) === sId ? { ...s, peakLevel: newStars } : s
      )
    );

    try {
      const res = await shiftApi.updateShift(store._id, sId, {
        peakLevel: newStars,
      });
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
      console.error('Lỗi cập nhật số sao ca:', err);
      // Rollback
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

  // Đánh giá ca làm việc (Đánh dấu không hoàn thành / Khôi phục ca)
  // Đánh giá ca làm việc (Đánh dấu không hoàn thành / Chưa hoàn thành tốt / Khôi phục ca)
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
  // Trừ ca không hoàn thành (MISSED) và trừ một phần lương ca chưa tốt (PARTIAL)
  const payrollSummary = useMemo(() => {
    const employeeMap = {};
    members.forEach((m) => {
      const uId = getUserId(m.user?._id || m.userId);
      employeeMap[uId] = {
        name: m.user?.name || m.fullName || 'Nhân viên',
        email: m.user?.email || m.email,
        hourlyWage: m.hourlyWage || 20000,
        totalHours: 0,
        totalShifts: 0,
        completedShifts: 0,
        partialShifts: 0,
        missedShifts: 0,
        totalWage: 0,
      };
    });

    assignments.forEach((a) => {
      const uId = getUserId(a.userId);
      const sId = getShiftId(a.shiftId);
      const shift = shifts.find((s) => getShiftId(s._id) === sId) || a.shiftObj;
      const hours = a.hours || shift?.durationHours || 4;
      const wage = a.hourlyWage || employeeMap[uId]?.hourlyWage || 20000;
      const fullPay = Math.round(hours * wage);

      if (!employeeMap[uId]) {
        const uName = a.userObj?.name || 'Nhân viên';
        employeeMap[uId] = {
          name: uName,
          email: '',
          hourlyWage: wage,
          totalHours: 0,
          totalShifts: 0,
          completedShifts: 0,
          partialShifts: 0,
          missedShifts: 0,
          totalWage: 0,
        };
      }

      employeeMap[uId].totalShifts += 1;

      if (a.attendanceStatus === 'MISSED') {
        employeeMap[uId].missedShifts += 1;
      } else if (a.attendanceStatus === 'PARTIAL') {
        employeeMap[uId].partialShifts += 1;
        employeeMap[uId].completedShifts += 1;
        const effectiveHours = Math.max(0, hours - (a.deductedHours || 0));
        employeeMap[uId].totalHours += effectiveHours;
        const shiftPay = a.totalPay !== undefined ? a.totalPay : Math.max(0, fullPay - (a.deductedPay || 0));
        employeeMap[uId].totalWage += shiftPay;
      } else {
        employeeMap[uId].completedShifts += 1;
        employeeMap[uId].totalHours += hours;
        const shiftPay = a.totalPay !== undefined ? a.totalPay : fullPay;
        employeeMap[uId].totalWage += shiftPay;
      }
    });

    let storeTotalPayroll = 0;
    let storeTotalHours = 0;
    let storeTotalShifts = assignments.length;
    let storeTotalMissedShifts = 0;
    let storeTotalPartialShifts = 0;

    const list = Object.values(employeeMap)
      .filter((e) => e.totalShifts > 0)
      .map((e) => {
        storeTotalPayroll += e.totalWage;
        storeTotalHours += e.totalHours;
        storeTotalMissedShifts += e.missedShifts;
        storeTotalPartialShifts += e.partialShifts;
        return e;
      });

    return {
      employees: list,
      storeTotalPayroll,
      storeTotalHours,
      storeTotalShifts,
      storeTotalMissedShifts,
      storeTotalPartialShifts,
    };
  }, [members, assignments, shifts]);

  // If Store Owner has not created a store yet
  if (!store) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="bg-white p-8 rounded-3xl border border-orange-200/80 shadow-md space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 text-[#EA701B] flex items-center justify-center mx-auto">
            <StoreIcon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Tạo cửa hàng của bạn
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Bạn vừa tạo tài khoản Chủ cửa hàng. Hãy đặt tên quán và địa chỉ để bắt đầu tạo ca làm và mời nhân sự.
          </p>

          <form onSubmit={handleCreateStore} className="space-y-3 pt-2 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên cửa hàng / Quán <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: The Coffee House — Cơ sở 1"
                value={newStoreForm.name}
                onChange={(e) => setNewStoreForm({ ...newStoreForm, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EA701B]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Địa chỉ cửa hàng
              </label>
              <input
                type="text"
                placeholder="Ví dụ: 123 Nguyễn Huệ, Quận 1, TP. HCM"
                value={newStoreForm.address}
                onChange={(e) => setNewStoreForm({ ...newStoreForm, address: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EA701B]"
              />
            </div>
            <button
              type="submit"
              disabled={creatingStore}
              className="w-full mt-2 py-3 bg-[#EA701B] hover:bg-[#D55E0D] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
            >
              {creatingStore ? 'Đang tạo cửa hàng...' : 'Bắt đầu sử dụng ngay'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar: Navigation & Action Buttons */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left: Week Navigation Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-50 border border-slate-200/80 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-1.5 hover:bg-white hover:text-[#EA701B] rounded-lg transition text-slate-600 shadow-xs"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCurrentWeek}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                isCurrentWeek
                  ? 'bg-[#EA701B] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-white hover:text-[#EA701B]'
              }`}
            >
              Tuần này
            </button>
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-1.5 hover:bg-white hover:text-[#EA701B] rounded-lg transition text-slate-600 shadow-xs"
              title="Tuần sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50/60 border border-orange-100 rounded-xl text-xs font-semibold text-slate-800">
            <Calendar className="w-4 h-4 text-[#EA701B]" />
            <span>
              {formatWeekRange(currentMonday)} (Tuần {week}/{year})
            </span>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
              scheduleStatus === 'PUBLISHED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {scheduleStatus === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp (DRAFT)'}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={saving || autoGenerating || isPastWeek}
            onClick={() => setAutoScheduleModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-300 bg-linear-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-900 text-sm font-bold transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            title={isPastWeek ? 'Tuần này đã kết thúc trong quá khứ' : 'Tự động phân bổ ca làm tối ưu cho nhân viên và lưu bản nháp'}
          >
            <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>Tự động xếp lịch</span>
          </button>

          <button
            type="button"
            disabled={saving || autoGenerating || isPastWeek}
            onClick={handleSaveDraft}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold bg-white hover:bg-slate-50 transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            title={isPastWeek ? 'Không thể lưu hoặc sửa đổi lịch của tuần đã qua' : 'Lưu bản nháp'}
          >
            <Save className="w-4 h-4 text-slate-500" />
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EA701B] hover:bg-[#D55E0D] text-white text-sm font-bold transition shadow-md shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            title={isPastWeek ? 'Tuần này đã kết thúc trong quá khứ' : 'Xuất bản lịch & gửi email'}
          >
            <Send className="w-4 h-4" />
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
