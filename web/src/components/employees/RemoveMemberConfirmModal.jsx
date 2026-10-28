import React from 'react';
import { Trash2 } from 'lucide-react';

export const RemoveMemberConfirmModal = ({ modalState, setModalState, onConfirmRemove }) => {
  if (!modalState.isOpen) return null;

  const handleClose = () => {
    setModalState({ isOpen: false, member: null });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-backdrop-fade">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-modal-pop">
        <div className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Xóa nhân viên khỏi quán?</h3>
          <p className="text-xs text-slate-500">
            Bạn có chắc muốn xóa <b>{modalState.member?.user?.name}</b> khỏi danh sách nhân sự của quán? Hệ thống sẽ tự động gỡ nhân viên này khỏi các ca trong tương lai, nhưng vẫn giữ nguyên lịch sử chấm công các ca đã qua.
          </p>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirmRemove}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
          >
            Xác nhận xóa
          </button>
        </div>
      </div>
    </div>
  );
};

