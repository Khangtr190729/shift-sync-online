import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Clock,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  Info,
  Star
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { shiftApi } from '../services/api';
import { checkShiftOverlap } from '../utils/formatters';
import { ShiftFormModal } from '../components/shifts/ShiftFormModal';
import { DeleteShiftConfirmModal } from '../components/shifts/DeleteShiftConfirmModal';

export const ShiftManagementPage = () => {
  const { store } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Create / Edit Shift Modal
  const [shiftModal, setShiftModal] = useState({
    isOpen: false,
    isEdit: false,
    shiftId: null,
    name: '',
    startTime: '08:00',
    endTime: '12:00',
    durationHours: 4,
    color: '#EA701B',
    peakLevel: 1
  });

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    shift: null
  });

  const loadShifts = useCallback(async () => {
    if (!store?._id) return;
    try {
      setLoading(true);
      const res = await shiftApi.getShifts(store._id);
      if (res.success) {
        setShifts(res.shifts || res.data || []);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Không thể tải danh sách ca làm' });
    } finally {
      setLoading(false);
    }
  }, [store?._id]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  // Kiểm tra xung đột thời gian trong modal với các ca khác
  const modalConflict = useMemo(() => {
    if (!shiftModal.isOpen || !shiftModal.startTime || !shiftModal.endTime) return null;
    return shifts.find(
      (s) =>
        (!shiftModal.isEdit || s._id !== shiftModal.shiftId) &&
        checkShiftOverlap({ startTime: shiftModal.startTime, endTime: shiftModal.endTime }, s)
    );
  }, [shiftModal.isOpen, shiftModal.isEdit, shiftModal.shiftId, shiftModal.startTime, shiftModal.endTime, shifts]);

  // Tìm các cặp ca làm việc đang bị trùng khung giờ với nhau trong toàn quán
  const conflictingShiftMap = useMemo(() => {
    const map = {};
    for (let i = 0; i < shifts.length; i++) {
      for (let j = i + 1; j < shifts.length; j++) {
        if (checkShiftOverlap(shifts[i], shifts[j])) {
          if (!map[shifts[i]._id]) map[shifts[i]._id] = [];
          if (!map[shifts[j]._id]) map[shifts[j]._id] = [];
          map[shifts[i]._id].push(shifts[j]);
          map[shifts[j]._id].push(shifts[i]);
        }
      }
    }
    return map;
  }, [shifts]);

  const conflictingCount = Object.keys(conflictingShiftMap).length;

  // Tự động tính số tiếng trực tiếp từ giờ bắt đầu và giờ kết thúc
  const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    try {
      const [startH, startM] = start.split(':').map(Number);
      const [endH, endM] = end.split(':').map(Number);
      const startMin = (startH || 0) * 60 + (startM || 0);
      let endMin = (endH || 0) * 60 + (endM || 0);
      if (endMin < startMin) {
        endMin += 1440; // Ca đêm qua 0h
      } else if (endMin === startMin) {
        return 0;
      }
      return Math.round(((endMin - startMin) / 60) * 10) / 10;
    } catch {
      return 0;
    }
  };

  const computedDuration = useMemo(() => {
    return calculateDuration(shiftModal.startTime, shiftModal.endTime);
  }, [shiftModal.startTime, shiftModal.endTime]);

  const handleTimeChange = (field, value) => {
    setShiftModal((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenCreate = () => {
    setShiftModal({
      isOpen: true,
      isEdit: false,
      shiftId: null,
      name: `Ca ${shifts.length + 1}`,
      startTime: '08:00',
      endTime: '12:00',
      color: '#EA701B',
      peakLevel: 1
    });
  };

  const handleOpenEdit = (shift) => {
    setShiftModal({
      isOpen: true,
      isEdit: true,
      shiftId: shift._id,
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      color: shift.color || '#EA701B',
      peakLevel: shift.peakLevel || 1
    });
  };

  const handleQuickUpdateStars = async (shiftId, newStars) => {
    if (!store?._id) return;
    const targetShift = shifts.find((s) => s._id === shiftId);
    if (!targetShift) return;

    setShifts((prev) =>
      prev.map((s) => (s._id === shiftId ? { ...s, peakLevel: newStars } : s))
    );

    try {
      const res = await shiftApi.updateShift(store._id, shiftId, { peakLevel: newStars });
      if (res.success) {
        const labels = { 1: '⭐ Bình thường', 2: '⭐⭐ Khá cao điểm', 3: '⭐⭐⭐ Rất cao điểm' };
        setFeedback({
          type: 'success',
          message: `Đã cập nhật ca "${targetShift.name}": ${labels[newStars]}. Tự động xếp lịch sẽ ưu tiên phân bổ nhân sự theo mức độ này!`
        });
      }
    } catch (err) {
      setShifts((prev) =>
        prev.map((s) => (s._id === shiftId ? { ...s, peakLevel: targetShift.peakLevel || 1 } : s))
      );
      setFeedback({ type: 'error', message: err.message || 'Lỗi khi cập nhật số sao' });
    }
  };

  const handleSaveShift = async (e) => {
    e.preventDefault();
    if (!store?._id) return;
    if (modalConflict) {
      setFeedback({
        type: 'error',
        message: `Khung giờ bị trùng với ca "${modalConflict.name}" (${modalConflict.startTime} — ${modalConflict.endTime})! Vui lòng chọn khung giờ khác.`
      });
      return;
    }
    if (computedDuration <= 0) {
      setFeedback({ type: 'error', message: 'Giờ bắt đầu và kết thúc không hợp lệ (thời lượng phải lớn hơn 0).' });
      return;
    }

    try {
      const payload = {
        name: shiftModal.name.trim(),
        startTime: shiftModal.startTime,
        endTime: shiftModal.endTime,
        durationHours: computedDuration,
        color: shiftModal.color,
        peakLevel: shiftModal.peakLevel || 1
      };

      if (shiftModal.isEdit) {
        const res = await shiftApi.updateShift(store._id, shiftModal.shiftId, payload);
        if (res.success) {
          setFeedback({ type: 'success', message: 'Cập nhật ca làm việc thành công!' });
          setShiftModal((prev) => ({ ...prev, isOpen: false }));
          loadShifts();
        }
      } else {
        const res = await shiftApi.createShift(store._id, payload);
        if (res.success) {
          setFeedback({ type: 'success', message: 'Tạo ca làm việc mới thành công!' });
          setShiftModal((prev) => ({ ...prev, isOpen: false }));
          loadShifts();
        }
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Lỗi khi lưu ca làm việc' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!store?._id || !deleteModal.shift) return;
    try {
      const res = await shiftApi.deleteShift(store._id, deleteModal.shift._id);
      if (res.success) {
        setFeedback({ type: 'success', message: 'Đã xóa ca làm việc.' });
        setDeleteModal({ isOpen: false, shift: null });
        loadShifts();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Lỗi khi xóa ca làm việc' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#EA701B]" />
            <span>Quản lý Khung giờ Ca làm</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-[#EA701B] font-bold">
              {shifts.length} ca
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Định nghĩa các khung thời gian (ví dụ: Slot 1, Slot 2, Ca Sáng, Ca Chiều...) để xếp lịch biểu.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#EA701B] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#D55E0D] transition self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm ca làm mới</span>
        </button>
      </div>

      {/* Global overlap warning banner */}
      {conflictingCount > 0 && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start gap-3 text-amber-900 animate-fade-in shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-extrabold text-sm text-amber-950">
              Phát hiện {conflictingCount} ca làm việc đang bị trùng khung giờ!
            </p>
            <p className="text-amber-800 leading-relaxed">
              Các ca làm trong cùng một cửa hàng phải có khung thời gian tách biệt rõ ràng. Vui lòng chỉnh sửa lại giờ bắt đầu / kết thúc để tránh gây nhầm lẫn khi xếp lịch.
            </p>
          </div>
        </div>
      )}

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm font-medium animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Shifts Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400 text-sm shadow-sm">
          Đang tải danh sách ca làm...
        </div>
      ) : shifts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center shadow-sm">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">Chưa có ca làm việc nào</p>
          <p className="text-xs text-slate-500 mt-1">
            Hãy tạo các ca làm chuẩn (ví dụ: Ca Sáng 08:00 - 12:00, Ca Chiều 13:00 - 17:00).
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 bg-[#EA701B] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#D55E0D] transition"
          >
            Tạo ca đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map((shift) => {
            const conflicts = conflictingShiftMap[shift._id] || [];
            const hasConflict = conflicts.length > 0;

            return (
              <div
                key={shift._id}
                className={`bg-white p-5 rounded-2xl border shadow-xs hover:shadow-md transition space-y-3 relative overflow-hidden ${
                  hasConflict ? 'border-amber-300 ring-2 ring-amber-200/60 bg-amber-50/10' : 'border-slate-200/80'
                }`}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: shift.color || '#EA701B' }}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-xs shrink-0"
                      style={{ backgroundColor: shift.color || '#EA701B' }}
                    />
                    <h4 className="text-sm font-extrabold text-slate-900 truncate">{shift.name}</h4>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(shift)}
                      className="p-1.5 text-slate-400 hover:text-[#EA701B] hover:bg-orange-50 rounded-lg transition"
                      title="Chỉnh sửa ca"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteModal({ isOpen: true, shift })}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Xóa ca"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Clock className="w-4 h-4 text-[#EA701B]" />
                    <span>
                      {shift.startTime} — {shift.endTime}
                    </span>
                  </div>
                  <span className="font-bold text-[#EA701B] bg-orange-100 px-2 py-0.5 rounded-md">
                    {shift.durationHours} tiếng
                  </span>
                </div>

                {/* Mức độ cao điểm (1 - 3 sao) */}
                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center">
                    {[1, 2, 3].map((starVal) => {
                      const currentStars = shift.peakLevel || 1;
                      const isFilled = starVal <= currentStars;
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => handleQuickUpdateStars(shift._id, starVal)}
                          className="p-0.5 hover:scale-110 transition cursor-pointer"
                          title={`${starVal} sao - ${
                            starVal === 1 ? 'Bình thường' : starVal === 2 ? 'Khá cao điểm' : 'Rất cao điểm'
                          }`}
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              isFilled
                                ? 'fill-amber-400 stroke-amber-500 text-amber-500'
                                : 'fill-slate-100 stroke-slate-300 text-slate-300 hover:stroke-amber-400'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs font-semibold text-slate-600 select-none">
                    {(shift.peakLevel || 1) === 3
                      ? 'Rất cao điểm'
                      : (shift.peakLevel || 1) === 2
                      ? 'Khá cao điểm'
                      : 'Bình thường'}
                  </span>
                </div>

                {/* Cảnh báo nếu ca này trùng giờ với ca khác trong quán */}
                {hasConflict && (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2 text-[11px] text-amber-800 animate-fade-in">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Trùng giờ với: </span>
                      <span className="font-semibold text-amber-950">
                        {conflicts.map((c) => `${c.name} (${c.startTime} - ${c.endTime})`).join(', ')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sub-modals */}
      <ShiftFormModal
        shiftModal={shiftModal}
        setShiftModal={setShiftModal}
        computedDuration={computedDuration}
        modalConflict={modalConflict}
        handleTimeChange={handleTimeChange}
        onSaveShift={handleSaveShift}
      />

      <DeleteShiftConfirmModal
        deleteModal={deleteModal}
        setDeleteModal={setDeleteModal}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
};

export default ShiftManagementPage;
