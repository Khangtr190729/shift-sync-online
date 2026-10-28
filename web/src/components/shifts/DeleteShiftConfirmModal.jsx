import React from 'react';
import { Trash2 } from 'lucide-react';

export const DeleteShiftConfirmModal = ({ deleteModal, setDeleteModal, onConfirmDelete }) => {
  if (!deleteModal.isOpen) return null;

  const handleClose = () => {
    setDeleteModal({ isOpen: false, shift: null });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-backdrop-fade">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden my-auto animate-modal-pop">
        <div className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Xác nhận xóa ca làm?</h3>
          <p className="text-xs text-slate-500">
            Bạn có chắc muốn xóa ca <b>{deleteModal.shift?.name}</b> ({deleteModal.shift?.startTime} — {deleteModal.shift?.endTime})?
          </p>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl btn-press"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirmDelete}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs btn-press hover-lift"
          >
            Xóa ca làm
          </button>
        </div>
      </div>
    </div>
  );
};

