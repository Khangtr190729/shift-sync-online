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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-orange-100 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-[#FFF0E5] to-[#FFF7F0] border-b border-orange-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EA701B] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                Mở thêm Chi nhánh mới
                <Sparkles className="w-4 h-4 text-[#EA701B]" />
              </h3>
              <p className="text-xs text-slate-500">Mở rộng cơ sở kinh doanh và xếp ca riêng biệt</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
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
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA701B]/30 focus:border-[#EA701B] transition-all font-medium"
              />
              <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Địa chỉ cơ sở
            </label>
            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ví dụ: 123 Đường 30/4, Quận Ninh Kiều, Cần Thơ"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA701B]/30 focus:border-[#EA701B] transition-all font-medium"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-800 leading-relaxed">
            💡 Mỗi chi nhánh sẽ có <b>danh sách nhân viên, khung ca làm, và bảng xếp lịch</b> hoàn toàn độc lập giúp bạn quản lý từng cửa hàng dễ dàng.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#EA701B] to-[#FF8C38] hover:opacity-95 rounded-xl shadow-md shadow-orange-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
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
