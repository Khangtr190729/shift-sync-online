import React from 'react';
import { DollarSign, X } from 'lucide-react';

export const EditMemberWageModal = ({ modalState, setModalState, onSaveWage }) => {
  if (!modalState.isOpen) return null;

  const handleClose = () => {
    setModalState({ isOpen: false, member: null, newWage: '' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-backdrop-fade">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-modal-pop">
        <div className="p-5 bg-[#FFF0E5] border-b border-orange-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#EA701B]" />
            <h3 className="font-bold text-slate-900 text-sm">Cập nhật lương theo giờ</h3>
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
              Mức lương theo giờ (VNĐ/giờ)
            </label>
            <div className="relative">
              <input
                type="number"
                step="1000"
                min="0"
                value={modalState.newWage}
                onChange={(e) =>
                  setModalState((prev) => ({ ...prev, newWage: e.target.value }))
                }
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 font-mono pr-14 focus:outline-none focus:ring-2 focus:ring-[#EA701B]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                VNĐ
              </span>
            </div>
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
              onClick={onSaveWage}
              className="px-4 py-2 text-xs font-bold text-white bg-[#EA701B] hover:bg-[#D55E0D] rounded-xl shadow-xs"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

