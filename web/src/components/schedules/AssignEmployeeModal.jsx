import React, { useState } from 'react';
import { Clock, Users, X, Lock } from 'lucide-react';
import { ShiftAssignedEmployeeItem } from './ShiftAssignedEmployeeItem';
import { ShiftAddEmployeeForm } from './ShiftAddEmployeeForm';

/**
 * Modal Quản lý phân công & Đánh giá ca làm việc (AssignEmployeeModal)
 * - Tách nhỏ thành các sub-components độc lập theo Single Responsibility Principle:
 *   + ShiftAssignedEmployeeItem: Render từng nhân viên trong ca & trạng thái
 *   + ShiftEvaluationForm: Form chọn mức trừ lương & nhập lý do tự do
 *   + ShiftAddEmployeeForm: Form chọn nhân viên thêm vào ca & cảnh báo trùng lịch
 */
export const AssignEmployeeModal = ({
  assignModal,
  setAssignModal,
  shifts,
  members,
  assignments,
  daysOfWeek,
  getShiftId,
  getUserId,
  getConflictingShift,
  getAssignmentConflict,
  isShiftPassedOrCompleted,
  isShiftStartedOrPassed,
  onEvaluateShift,
  saving,
  onAddEmployee,
  onRemoveSingleAssignment,
  onClearShiftAssignments,
}) => {
  const [evaluatingUserId, setEvaluatingUserId] = useState(null);
  const [evaluatingMode, setEvaluatingMode] = useState('PARTIAL'); // 'PARTIAL' | 'MISSED'
  const [submittingEvaluation, setSubmittingEvaluation] = useState(false);

  if (!assignModal.isOpen) return null;

  const currentShiftId = getShiftId(assignModal.shiftId);
  const targetShift = shifts.find((s) => getShiftId(s._id) === currentShiftId);
  const isShiftPassed = isShiftPassedOrCompleted ? isShiftPassedOrCompleted(assignModal.date, targetShift) : false;
  const isShiftStarted = isShiftStartedOrPassed ? isShiftStartedOrPassed(assignModal.date, targetShift) : false;

  const currentCellAssignments = assignments.filter(
    (a) => a.date === assignModal.date && getShiftId(a.shiftId) === currentShiftId
  );

  const handleStartEvaluatePartial = (userId) => {
    setEvaluatingUserId(userId);
    setEvaluatingMode('PARTIAL');
  };

  const handleStartEvaluateMissed = (userId) => {
    setEvaluatingUserId(userId);
    setEvaluatingMode('MISSED');
  };

  const handleCancelEvaluate = () => {
    setEvaluatingUserId(null);
  };

  const handleSubmitEvaluation = async (userId, evaluationData) => {
    if (!onEvaluateShift) return;
    try {
      setSubmittingEvaluation(true);
      await onEvaluateShift({
        date: assignModal.date,
        shiftId: currentShiftId,
        userId,
        ...evaluationData,
      });
      setEvaluatingUserId(null);
    } finally {
      setSubmittingEvaluation(false);
    }
  };

  const handleRestoreCompleted = async (userId) => {
    if (!onEvaluateShift) return;
    try {
      setSubmittingEvaluation(true);
      await onEvaluateShift({
        date: assignModal.date,
        shiftId: currentShiftId,
        userId,
        attendanceStatus: 'COMPLETED',
        missedReason: '',
        deductedHours: 0,
        deductedPay: 0,
        penaltyType: 'NONE',
      });
      setEvaluatingUserId(null);
    } finally {
      setSubmittingEvaluation(false);
    }
  };

  const closeModal = () => {
    setEvaluatingUserId(null);
    setAssignModal({ isOpen: false, date: '', shiftId: '', selectedUserId: '' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-backdrop-fade overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-modal-pop">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white border-b border-[#e5e5e7] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0066cc] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-[#1d1d1f] text-sm truncate">
                  Phân công ca: {targetShift?.name || 'Ca làm việc'}
                </h3>
                {isShiftPassed ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#6e6e73] border border-[#e5e5e7] text-[10px] font-medium shrink-0 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#86868b]" />
                    Đã kết thúc
                  </span>
                ) : isShiftStarted ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60 text-[10px] font-medium shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                    Đang diễn ra
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0066cc] border border-blue-200/60 text-[10px] font-medium shrink-0">
                    Sắp diễn ra
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#6e6e73] font-normal truncate">
                {targetShift?.startTime} — {targetShift?.endTime} •{' '}
                {daysOfWeek.find((d) => d.dateStr === assignModal.date)?.fullDisplay || assignModal.date}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="p-1 text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-full shrink-0 ml-2 transition btn-press cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* PHẦN 1: Danh sách nhân viên trong ca */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[#1d1d1f] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#0066cc]" />
                <span>Nhân viên trong ca này ({currentCellAssignments.length} người)</span>
              </label>
              {currentCellAssignments.length > 0 && !isShiftPassed && (
                <button
                  type="button"
                  onClick={() => onClearShiftAssignments(assignModal.date, assignModal.shiftId)}
                  className="text-[11px] text-rose-600 hover:underline font-medium cursor-pointer"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {currentCellAssignments.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-[#e5e5e7] text-center text-xs text-[#86868b] bg-[#fafafc]">
                {isShiftPassed
                  ? 'Không có nhân viên nào được xếp trong ca này.'
                  : 'Chưa có nhân viên nào trong ca này. Hãy chọn nhân viên bên dưới để thêm vào ca.'}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {currentCellAssignments.map((a, idx) => {
                  const aUserId = getUserId(a.userId);
                  const member = members.find((m) => getUserId(m.userId?._id || m.userId || m.user?._id) === aUserId);
                  const conflictShift = getAssignmentConflict ? getAssignmentConflict(a) : null;
                  const isEvaluatingThis = evaluatingUserId === aUserId;

                  return (
                    <ShiftAssignedEmployeeItem
                      key={`${aUserId}_${idx}`}
                      assignment={a}
                      member={member}
                      targetShift={targetShift}
                      conflictShift={conflictShift}
                      isShiftPassed={isShiftPassed}
                      isShiftStarted={isShiftStarted}
                      isEvaluating={isEvaluatingThis}
                      evaluatingMode={evaluatingMode}
                      onStartEvaluatePartial={() => handleStartEvaluatePartial(aUserId)}
                      onStartEvaluateMissed={() => handleStartEvaluateMissed(aUserId)}
                      onCancelEvaluate={handleCancelEvaluate}
                      onSubmitEvaluation={(evalData) => handleSubmitEvaluation(aUserId, evalData)}
                      onRestoreCompleted={() => handleRestoreCompleted(aUserId)}
                      onRemoveAssignment={() => onRemoveSingleAssignment(a.date, a.shiftId, a.userId)}
                      submittingEvaluation={submittingEvaluation}
                      saving={saving}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* PHẦN 2: Thêm nhân viên vào ca */}
          <ShiftAddEmployeeForm
            targetShift={targetShift}
            assignModal={assignModal}
            setAssignModal={setAssignModal}
            members={members}
            currentCellAssignments={currentCellAssignments}
            getUserId={getUserId}
            getConflictingShift={getConflictingShift}
            isShiftPassed={isShiftPassed}
            onAddEmployee={onAddEmployee}
          />

          {/* Modal Footer */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#e5e5e7]">
            <button
              type="button"
              onClick={closeModal}
              className="px-5 py-2 text-xs font-medium text-white bg-[#0066cc] hover:bg-[#0071e3] rounded-full shadow-xs btn-press transition cursor-pointer"
            >
              Xong & Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignEmployeeModal;
