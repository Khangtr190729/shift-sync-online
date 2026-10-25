import React from 'react';
import { Plus, AlertTriangle, Lock } from 'lucide-react';
import { formatVND } from '../../utils/formatters';

/**
 * Component xử lý Form thêm nhân viên vào ca làm việc:
 * - Dropdown chọn nhân viên (kiểm tra đã có trong ca hoặc bị trùng ca)
 * - Cảnh báo trùng lịch làm việc nếu có conflict
 * - Khóa thêm mới nếu ca đã kết thúc trong quá khứ
 */
export const ShiftAddEmployeeForm = ({
  targetShift,
  assignModal,
  setAssignModal,
  members,
  currentCellAssignments,
  getUserId,
  getConflictingShift,
  isShiftPassed,
  onAddEmployee,
}) => {
  if (isShiftPassed) {
    return (
      <div className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 shadow-xs">
        <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-950">Ca làm việc đã kết thúc — Không thể thêm mới nhân viên</p>
          <p className="mt-0.5 text-amber-800 leading-relaxed">
            Ca làm <strong>{targetShift?.name} ({targetShift?.startTime} — {targetShift?.endTime}, {assignModal.date})</strong> đã qua. Hệ thống khóa chỉnh sửa để bảo toàn giờ làm và tiền lương của nhân viên.
          </p>
        </div>
      </div>
    );
  }

  const selectedCandidateId = getUserId(assignModal.selectedUserId);
  const selectedConflict = selectedCandidateId
    ? getConflictingShift(selectedCandidateId, assignModal.date, targetShift?._id)
    : null;
  const isSelectedAlready = selectedCandidateId
    ? currentCellAssignments.some((a) => getUserId(a.userId) === selectedCandidateId)
    : false;

  return (
    <div className="pt-3 border-t border-slate-100 space-y-2">
      <label className="block text-xs font-bold text-slate-700">
        Thêm nhân viên vào ca này
      </label>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <select
          value={assignModal.selectedUserId}
          onChange={(e) =>
            setAssignModal((prev) => ({ ...prev, selectedUserId: e.target.value }))
          }
          className="flex-1 min-w-0 w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#EA701B] truncate"
        >
          <option value="">-- Chọn nhân viên để thêm --</option>
          {members.map((m) => {
            const uid = getUserId(m.user?._id || m.userId);
            const alreadyIn = currentCellAssignments.some((a) => getUserId(a.userId) === uid);
            const conflict = getConflictingShift(uid, assignModal.date, targetShift?._id);

            let note = '';
            if (alreadyIn) {
              note = `[Đã có trong ca này] ${m.user?.name || m.fullName}`;
            } else if (conflict) {
              const prefix = conflict.isCrossStore
                ? `[Trùng ca tại ${conflict.storeName}: ${conflict.name} (${conflict.startTime} - ${conflict.endTime})]`
                : `[Trùng ca: ${conflict.name} (${conflict.startTime} - ${conflict.endTime})]`;
              note = `${prefix} ${m.user?.name || m.fullName}`;
            }

            return (
              <option
                key={uid}
                value={uid}
                disabled={alreadyIn || !!conflict}
                className={alreadyIn || conflict ? 'text-slate-400 bg-slate-50' : ''}
              >
                {note ||
                  `${m.user?.name || m.fullName} (${m.user?.email || m.email}) — ${formatVND(
                    m.hourlyWage
                  )}/h`}
              </option>
            );
          })}
        </select>

        <button
          type="button"
          disabled={!assignModal.selectedUserId || !!selectedConflict || isSelectedAlready}
          onClick={onAddEmployee}
          className="px-4 py-2.5 bg-[#EA701B] hover:bg-[#D55E0D] text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap transition"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm vào ca</span>
        </button>
      </div>

      {/* Cảnh báo trùng ca nếu chọn nhân viên bị trùng giờ */}
      {selectedConflict && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700 animate-fade-in mt-1">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-800">
              {selectedConflict.isCrossStore
                ? `Cảnh báo: Trùng ca tại chi nhánh "${selectedConflict.storeName}"!`
                : 'Cảnh báo: Trùng giờ làm việc!'}
            </p>
            <p className="mt-0.5 text-slate-600">
              {selectedConflict.isCrossStore ? (
                <>
                  Nhân viên này đã có ca <b>"{selectedConflict.name}" ({selectedConflict.startTime} - {selectedConflict.endTime})</b> tại chi nhánh <b>"{selectedConflict.storeName}"</b> vào ngày này. Không thể phân 2 ca cùng khung giờ!
                </>
              ) : (
                <>
                  Nhân viên này đã được phân ca <b>"{selectedConflict.name}" ({selectedConflict.startTime} - {selectedConflict.endTime})</b> vào ngày này. Không thể phân 2 ca cùng khung giờ!
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftAddEmployeeForm;
