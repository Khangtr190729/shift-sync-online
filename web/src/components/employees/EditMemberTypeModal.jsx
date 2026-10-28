import React from 'react';
import { Briefcase, X } from 'lucide-react';

export const EditMemberTypeModal = ({ modalState, setModalState, onSaveType }) => {
  if (!modalState.isOpen) return null;

  const handleClose = () => {
    setModalState({ isOpen: false, member: null, newType: 'PART_TIME' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-backdrop-fade">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-modal-pop">
        <div className="p-5 bg-purple-50 border-b border-purple-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-slate-900 text-sm">Hình thức làm việc</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600">
            Nhân viên: <b className="text-slate-800">{modalState.member?.user?.name}</b>
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Chọn loại hình
            </label>
            <select
              value={modalState.newType}
              onChange={(e) =>
                setModalState((prev) => ({ ...prev, newType: e.target.value }))
              }
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white"
            >
              <option value="PART_TIME">Bán thời gian (Part-time)</option>
              <option value="FULL_TIME">Toàn thời gian (Full-time)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={onSaveType}
              className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

