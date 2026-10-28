import React, { useState, useEffect } from 'react';
import {
  Store,
  Save,
  CheckCircle2,
  AlertCircle,
  X,
  MapPin,
  ShieldCheck,
  Store as StoreIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { storeApi } from '../services/api';
import CreateBranchModal from '../components/store/CreateBranchModal';
import { StoreInviteCodeCard } from '../components/stores/StoreInviteCodeCard';
import { StoreDirectInviteForm } from '../components/stores/StoreDirectInviteForm';

export const StoreManagementPage = () => {
  const { store, stores, switchStore, refreshUser } = useAuth();
  const [branchModalOpen, setBranchModalOpen] = useState(false);

  // Helper to safely extract 6-digit code string from store data
  const extractCode = (s) => {
    if (!s?.inviteCode) return '';
    if (typeof s.inviteCode === 'object') return s.inviteCode.code || '';
    if (typeof s.inviteCode === 'string') return s.inviteCode;
    return '';
  };

  const extractExpires = (s) => {
    if (!s?.inviteCode) return s?.inviteExpires || null;
    if (typeof s.inviteCode === 'object') return s.inviteCode.expiresAt || null;
    return s.inviteExpires || null;
  };

  // Store profile form
  const [storeForm, setStoreForm] = useState({
    name: store?.name || '',
    address: store?.address || ''
  });
  const [savingStore, setSavingStore] = useState(false);

  // Initial store creation (if not created yet)
  const [newStoreForm, setNewStoreForm] = useState({ name: '', address: '' });
  const [creatingStore, setCreatingStore] = useState(false);

  // Invite code state
  const [inviteCode, setInviteCode] = useState(() => extractCode(store));
  const [inviteExpires, setInviteExpires] = useState(() => extractExpires(store));
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [remainingTime, setRemainingTime] = useState('');

  // Direct invite form (by Email)
  const [directForm, setDirectForm] = useState({
    email: '',
    hourlyWage: 20000,
    employmentType: 'PART_TIME'
  });
  const [invitingDirect, setInvitingDirect] = useState(false);

  const [feedback, setFeedback] = useState(null);

  // Sync store data when store updates
  useEffect(() => {
    if (store) {
      setStoreForm({
        name: store.name || '',
        address: store.address || ''
      });
      setInviteCode(extractCode(store));
      setInviteExpires(extractExpires(store));
    }
  }, [store]);

  // Countdown timer for 60-minute expiration
  useEffect(() => {
    if (!inviteExpires) {
      setRemainingTime('');
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(inviteExpires).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setRemainingTime('Đã hết hạn');
        clearInterval(interval);
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setRemainingTime(`${minutes} phút ${seconds < 10 ? '0' : ''}${seconds} giây`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [inviteExpires]);

  // Handle Initial Store Creation
  const handleCreateStore = async (e) => {
    e.preventDefault();
    if (!newStoreForm.name.trim()) return;
    try {
      setCreatingStore(true);
      setFeedback(null);
      const res = await storeApi.createStore(newStoreForm);
      if (res.success) {
        setFeedback({ type: 'success', message: 'Tạo cửa hàng thành công!' });
        await refreshUser();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Lỗi khi tạo cửa hàng' });
    } finally {
      setCreatingStore(false);
    }
  };

  // Update store info
  const handleSaveStore = async (e) => {
    e.preventDefault();
    try {
      setSavingStore(true);
      setFeedback(null);
      const res = await storeApi.updateMyStore({
        ...storeForm,
        storeId: store?._id,
      });
      if (res.success) {
        setFeedback({ type: 'success', message: 'Cập nhật thông tin cửa hàng thành công!' });
        await refreshUser(store?._id);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Lỗi khi cập nhật cửa hàng' });
    } finally {
      setSavingStore(false);
    }
  };

  // Generate new 6-digit code
  const handleGenerateCode = async () => {
    if (!store?._id) return;
    try {
      setGeneratingCode(true);
      setFeedback(null);
      const res = await storeApi.generateInviteCode(store._id);
      if (res.success) {
        const code = res.inviteCode || res.data?.inviteCode || '';
        const expires = res.expiresAt || res.data?.expiresAt || null;
        setInviteCode(String(code));
        setInviteExpires(expires);
        setFeedback({
          type: 'success',
          message: 'Đã tạo mã mời 6 chữ số mới (có hiệu lực trong 60 phút)!'
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Không thể tạo mã mời mới' });
    } finally {
      setGeneratingCode(false);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setFeedback({ type: 'error', message: 'Không thể sao chép mã vào clipboard' });
    }
  };

  // Direct invite by email
  const handleDirectInvite = async (e) => {
    e.preventDefault();
    if (!store?._id || !directForm.email.trim()) return;
    try {
      setInvitingDirect(true);
      setFeedback(null);
      const res = await storeApi.inviteDirect(store._id, {
        email: directForm.email.trim().toLowerCase(),
        hourlyWage: Number(directForm.hourlyWage) || 20000,
        employmentType: directForm.employmentType || 'PART_TIME'
      });
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Đã thêm nhân viên "${directForm.email}" vào danh sách nhân sự của quán!`
        });
        setDirectForm({
          email: '',
          hourlyWage: 20000,
          employmentType: 'PART_TIME'
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Không thể thêm nhân viên. Vui lòng kiểm tra lại địa chỉ email.'
      });
    } finally {
      setInvitingDirect(false);
    }
  };

  // Initial Store Creation Fallback
  if (!store) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="bg-white p-8 rounded-2xl border border-[#e5e5e7] shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-[#0066cc] flex items-center justify-center mx-auto">
            <StoreIcon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-[#1d1d1f] tracking-tight">
            Tạo cửa hàng của bạn
          </h2>
          <p className="text-xs text-[#6e6e73] leading-relaxed">
            Bạn vừa tạo tài khoản Chủ cửa hàng. Hãy đặt tên quán và địa chỉ để bắt đầu tạo ca làm và mời nhân sự.
          </p>

          {feedback && (
            <div
              className={`p-3 rounded-xl flex items-center gap-2 text-xs font-medium text-left ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                  : 'bg-rose-50 text-rose-800 border border-rose-200/60'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleCreateStore} className="space-y-3 pt-2 text-left">
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
                Địa chỉ quán
              </label>
              <input
                type="text"
                placeholder="Ví dụ: 123 Nguyễn Huệ, Quận 1, TP. HCM"
                value={newStoreForm.address}
                onChange={(e) => setNewStoreForm({ ...newStoreForm, address: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#d2d2d7] text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
              />
            </div>
            <button
              type="submit"
              disabled={creatingStore}
              className="w-full mt-3 py-3 bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-medium rounded-full transition shadow-xs active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {creatingStore ? 'Đang tạo cửa hàng...' : 'Bắt đầu sử dụng Ca Làm Online'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const hasValidCode =
    Boolean(inviteCode) &&
    typeof inviteCode === 'string' &&
    inviteCode.trim().length === 6;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#e5e5e7] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#1d1d1f] tracking-tight flex items-center gap-2">
            <Store className="w-5 h-5 text-[#0066cc]" />
            <span>Hệ thống Cơ sở & Mã mời</span>
          </h2>
          <p className="text-xs text-[#6e6e73] mt-0.5">
            Quản lý thông tin từng chi nhánh và cấp phát mã số mời nhân viên mới gia nhập.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setBranchModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0066cc] text-white text-xs font-medium rounded-full shadow-xs hover:bg-[#0071e3] transition active:scale-[0.98] cursor-pointer"
          >
            <span>+ Mở thêm chi nhánh</span>
          </button>
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#0066cc] rounded-full text-xs font-medium border border-blue-200/60">
            <ShieldCheck className="w-4 h-4" />
            <span>Chủ cửa hàng</span>
          </div>
        </div>
      </div>

      {/* BRANCH SELECTOR CARDS */}
      {stores && stores.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-[#e5e5e7] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider flex items-center gap-1.5">
              <span>Các cơ sở đang hoạt động</span>
              <span className="px-2 py-0.5 bg-blue-50 text-[#0066cc] border border-blue-200/60 rounded-full text-[11px] font-medium">
                {stores.length}
              </span>
            </h3>
            <span className="text-[11px] text-[#86868b]">Bấm vào chi nhánh để chuyển giao diện quản lý</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {stores.map((s) => {
              const isSelected = String(s._id) === String(store?._id);
              return (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => switchStore(s._id)}
                  className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2 group cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#0066cc] ring-2 ring-[#0066cc]/20 shadow-xs'
                      : 'bg-[#fafafc] hover:bg-white border-[#e5e5e7] hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold truncate ${isSelected ? 'text-[#0066cc]' : 'text-[#1d1d1f]'}`}>
                        {s.name}
                      </p>
                      <p className="text-[11px] text-[#6e6e73] truncate mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0 text-[#86868b]" />
                        <span>{s.address || 'Chưa có địa chỉ'}</span>
                      </p>
                    </div>
                    {isSelected ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 bg-[#0066cc] text-white rounded-full shrink-0">
                        Đang chọn
                      </span>
                    ) : (
                      <span className="text-[10px] font-normal text-[#86868b] group-hover:text-[#0066cc] shrink-0">
                        Chọn
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm font-medium animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION 1: 6-DIGIT INVITATION CODE */}
      <StoreInviteCodeCard
        inviteCode={inviteCode}
        remainingTime={remainingTime}
        hasValidCode={hasValidCode}
        generatingCode={generatingCode}
        copied={copied}
        onGenerateCode={handleGenerateCode}
        onCopyCode={handleCopyCode}
      />

      {/* SECTION 2: DIRECT INVITATION BY EMAIL */}
      <StoreDirectInviteForm
        directForm={directForm}
        setDirectForm={setDirectForm}
        invitingDirect={invitingDirect}
        onDirectInvite={handleDirectInvite}
      />

      {/* SECTION 3: STORE GENERAL INFORMATION */}
      <div className="bg-white rounded-2xl border border-[#e5e5e7] shadow-xs p-6 space-y-4">
        <div className="pb-3 border-b border-[#e5e5e7] flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-blue-50 text-[#0066cc] flex items-center justify-center">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1d1d1f]">Thông tin cơ sở quán</h3>
            <p className="text-xs text-[#6e6e73]">
              Tên cửa hàng và địa chỉ hiển thị trên ứng dụng của nhân viên và email xếp lịch
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveStore} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Tên cửa hàng</label>
            <input
              type="text"
              value={storeForm.name}
              onChange={(e) => setStoreForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-[#d2d2d7] text-xs font-normal text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Địa chỉ quán</label>
            <input
              type="text"
              value={storeForm.address}
              onChange={(e) => setStoreForm((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Ví dụ: 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. HCM"
              className="w-full p-2.5 rounded-xl border border-[#d2d2d7] text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingStore}
              className="px-5 py-2.5 bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-medium rounded-full transition shadow-xs active:scale-[0.98] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savingStore ? 'Đang lưu...' : 'Lưu thông tin quán'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Create Branch Modal */}
      <CreateBranchModal
        isOpen={branchModalOpen}
        onClose={() => setBranchModalOpen(false)}
      />
    </div>
  );
};

export default StoreManagementPage;
