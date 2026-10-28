import React from 'react';
import { Store as StoreIcon } from 'lucide-react';

export const InitialStoreSetup = ({
  newStoreForm,
  setNewStoreForm,
  creatingStore,
  onCreateStore,
}) => {
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

        <form onSubmit={onCreateStore} className="space-y-3 pt-2 text-left">
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
            className="w-full mt-2 py-3 bg-[#EA701B] hover:bg-[#D55E0D] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {creatingStore ? 'Đang tạo cửa hàng...' : 'Bắt đầu sử dụng ngay'}
          </button>
        </form>
      </div>
    </div>
  );
};

