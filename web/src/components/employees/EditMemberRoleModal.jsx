import React from 'react';
import { Shield, X } from 'lucide-react';

export const EditMemberRoleModal = ({ modalState, setModalState, onSaveRole }) => {
  if (!modalState.isOpen) return null;

  const handleClose = () => {
    setModalState({ isOpen: false, member: null, newRole: 'EMPLOYEE' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-backdrop-fade">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-modal-pop">
        <div className="p-5 bg-blue-50 border-b border-blue-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Thay đổi vai trò quản lý</h3>
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
              Chọn quyền hạn
            </label>
            <select
              value={modalState.newRole}
              onChange={(e) =>
                setModalState((prev) => ({ ...prev, newRole: e.target.value }))
              }
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white"
            >
              <option value="EMPLOYEE">Nhân viên (Chỉ xem lịch & ca của mình)</option>
              <option value="MANAGER">Quản lý (Được xếp ca, lưu nháp & xuất bản lịch)</option>
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
              onClick={onSaveRole}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              Cập nhật quyền
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

