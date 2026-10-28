import React, { useState } from 'react';
import { X, Store, MapPin, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const CreateBranchModal = ({ isOpen, onClose, onCreated }) => {
  const { createStore } = useAuth();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên chi nhánh / cơ sở.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const newStore = await createStore({
        name: name.trim(),
        address: address.trim(),
      });
      setName('');
      setAddress('');
      if (onCreated) onCreated(newStore);
      onClose();
    } catch (err) {
      setError(err.message || 'Không thể tạo chi nhánh mới. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#e5e5e7] overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-white border-b border-[#e5e5e7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#0066cc]">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1d1d1f] flex items-center gap-1.5 tracking-tight">
                Mở thêm Chi nhánh mới
                <Sparkles className="w-4 h-4 text-[#0066cc]" />
              </h3>
              <p className="text-xs text-[#6e6e73]">Mở rộng cơ sở kinh doanh và xếp ca riêng biệt</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200/60 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#1d1d1f] uppercase tracking-wider mb-1.5">
              Tên cơ sở / Chi nhánh <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="Ví dụ: Shop Trái Cây - Cơ sở 2 (Ninh Kiều)"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#d2d2d7] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc] transition-all font-normal text-[#1d1d1f]"
              />
              <Store className="w-4 h-4 text-[#86868b] absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1d1d1f] uppercase tracking-wider mb-1.5">
              Địa chỉ cơ sở
            </label>
            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ví dụ: 123 Đường 30/4, Quận Ninh Kiều, Cần Thơ"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#d2d2d7] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc] transition-all font-normal text-[#1d1d1f]"
              />
              <MapPin className="w-4 h-4 text-[#86868b] absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="p-3 bg-[#fafafc] border border-[#e5e5e7] rounded-xl text-xs text-[#6e6e73] leading-relaxed">
            💡 Mỗi chi nhánh sẽ có <b>danh sách nhân viên, khung ca làm, và bảng xếp lịch</b> hoàn toàn độc lập giúp bạn quản lý từng cửa hàng dễ dàng.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e5e5e7]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-full transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-medium text-white bg-[#0066cc] hover:bg-[#0071e3] rounded-full shadow-xs flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang khởi tạo...</span>
                </>
              ) : (
                <span>Tạo chi nhánh</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBranchModal;
