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
      <div className="bg-white p-8 rounded-2xl border border-[#e5e5e7] shadow-xs space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#f5f5f7] text-[#0066cc] flex items-center justify-center mx-auto">
          <StoreIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-semibold text-[#1d1d1f] tracking-tight">
          Tạo cửa hàng của bạn
        </h2>
        <p className="text-xs text-[#6e6e73] leading-relaxed">
          Bạn vừa tạo tài khoản Chủ cửa hàng. Hãy đặt tên quán và địa chỉ để bắt đầu tạo ca làm và mời nhân sự.
        </p>

        <form onSubmit={onCreateStore} className="space-y-3 pt-2 text-left">
          <div>
            <label className="block text-xs font-medium text-[#1d1d1f] mb-1">
              Tên cửa hàng / Quán <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: The Coffee House — Cơ sở 1"
              value={newStoreForm.name}
              onChange={(e) => setNewStoreForm({ ...newStoreForm, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-[#d2d2d7] text-xs font-normal text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#1d1d1f] mb-1">
              Địa chỉ cửa hàng
            </label>
            <input
              type="text"
              placeholder="Ví dụ: 123 Nguyễn Huệ, Quận 1, TP. HCM"
              value={newStoreForm.address}
              onChange={(e) => setNewStoreForm({ ...newStoreForm, address: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-[#d2d2d7] text-xs font-normal text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
            />
          </div>
          <button
            type="submit"
            disabled={creatingStore}
            className="w-full mt-2 py-3 bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-medium rounded-full shadow-xs transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {creatingStore ? 'Đang tạo cửa hàng...' : 'Bắt đầu sử dụng ngay'}
          </button>
        </form>
      </div>
    </div>
  );
};

