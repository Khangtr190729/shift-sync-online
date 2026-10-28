import React from 'react';
import { DollarSign, X } from 'lucide-react';

export const EditMemberWageModal = ({ modalState, setModalState, onSaveWage }) => {
  if (!modalState.isOpen) return null;

  const handleClose = () => {
    setModalState({ isOpen: false, member: null, newWage: '' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-backdrop-fade">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-[#e5e5e7] overflow-hidden my-auto max-h-[92vh] flex flex-col animate-modal-pop">
        <div className="p-5 bg-white border-b border-[#e5e5e7] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#0066cc]" />
            <h3 className="font-semibold text-[#1d1d1f] text-sm">Cập nhật lương theo giờ</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-full transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-[#6e6e73]">
            Nhân viên: <b className="font-semibold text-[#1d1d1f]">{modalState.member?.user?.name}</b>
          </p>
          <div>
            <label className="block text-xs font-medium text-[#1d1d1f] mb-1">
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
                className="w-full p-2.5 rounded-xl border border-[#d2d2d7] text-sm font-semibold text-[#1d1d1f] font-mono pr-14 focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#86868b]">
                VNĐ
              </span>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-full transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={onSaveWage}
              className="px-5 py-2 text-xs font-medium text-white bg-[#0066cc] hover:bg-[#0071e3] rounded-full shadow-xs active:scale-[0.98] transition cursor-pointer"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

