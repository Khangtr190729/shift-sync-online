import React, { useState, useEffect } from 'react';
import {
  Store,
  KeyRound,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Mail,
  UserPlus,
  Clock,
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
          message: 'Đã tạo mã mời 6 chữ số mới có hiệu lực trong 60 phút!'
        });
        await refreshUser(store._id);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Lỗi khi tạo mã mời' });
    } finally {
      setGeneratingCode(false);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    if (!inviteCode || typeof inviteCode !== 'string') return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Direct invite by Email
  const handleDirectInvite = async (e) => {
    e.preventDefault();
    const email = directForm.email?.trim() || '';
    if (!email) {
      setFeedback({
        type: 'error',
        message: 'Vui lòng nhập Email của nhân viên cần mời.'
      });
      return;
    }

    try {
      setInvitingDirect(true);
      setFeedback(null);
      const payload = {
        storeId: store?._id,
        email,
        hourlyWage: Number(directForm.hourlyWage),
        employmentType: directForm.employmentType
      };
      const res = await storeApi.inviteByIdOrEmail(payload);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message || 'Đã thêm nhân viên vào cửa hàng thành công!'
        });
        setDirectForm({
          email: '',
          hourlyWage: 20000,
          employmentType: 'PART_TIME'
        });
        await refreshUser(store?._id);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Lỗi khi mời nhân viên' });
    } finally {
      setInvitingDirect(false);
    }
  };

  // IF NO STORE EXISTS YET: Prompt to create one
  if (!store) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4">
        <div className="bg-white p-8 rounded-3xl border border-orange-200/80 shadow-md space-y-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 text-[#EA701B] flex items-center justify-center mx-auto">
            <StoreIcon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Tạo cửa hàng của bạn
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Bạn cần tạo cửa hàng trước khi có thể sinh mã mời hoặc quản lý nhân sự.
          </p>

          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleCreateStore} className="space-y-3 pt-2 text-left">
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
                Địa chỉ quán
              </label>
              <input
                type="text"
                placeholder="Ví dụ: 123 Nguyễn Huệ, Quận 1, TP. HCM"
                value={newStoreForm.address}
                onChange={(e) => setNewStoreForm({ ...newStoreForm, address: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EA701B]"
              />
            </div>
            <button
              type="submit"
              disabled={creatingStore}
              className="w-full mt-3 py-3 bg-[#EA701B] hover:bg-[#D55E0D] text-white text-xs font-bold rounded-xl transition shadow-md shadow-orange-500/20 disabled:opacity-50"
            >
              {creatingStore ? 'Đang tạo cửa hàng...' : 'Bắt đầu sử dụng Ca Làm Online'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Safe string representation of invite code
  const hasValidCode =
    Boolean(inviteCode) &&
    typeof inviteCode === 'string' &&
    inviteCode.trim().length === 6;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="w-5 h-5 text-[#EA701B]" />
            <span>Hệ thống Cơ sở & Mã mời</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý thông tin từng chi nhánh và cấp phát mã số mời nhân viên mới gia nhập.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setBranchModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[#EA701B] to-[#FF8C38] text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-95 transition-all btn-press"
          >
            <span>+ Mở thêm chi nhánh</span>
          </button>
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-[#EA701B] rounded-xl text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Chủ cửa hàng</span>
          </div>
        </div>
      </div>

      {/* BRANCH SELECTOR CARDS */}
      {stores && stores.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>Các cơ sở đang hoạt động</span>
              <span className="px-1.5 py-0.2 bg-orange-100 text-[#EA701B] rounded-full text-[11px]">
                {stores.length}
              </span>
            </h3>
            <span className="text-[11px] text-slate-400">Bấm vào chi nhánh để chuyển giao diện quản lý</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {stores.map((s) => {
              const isSelected = String(s._id) === String(store?._id);
              return (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => switchStore(s._id)}
                  className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2 group ${
                    isSelected
                      ? 'bg-[#FFF0E5] border-orange-300 ring-2 ring-[#EA701B]/20 shadow-xs'
                      : 'bg-slate-50/70 hover:bg-slate-50 border-slate-200/70 hover:border-orange-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate ${isSelected ? 'text-[#EA701B]' : 'text-slate-800'}`}>
                        {s.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                        <span>{s.address || 'Chưa có địa chỉ'}</span>
                      </p>
                    </div>
                    {isSelected ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-[#EA701B] text-white rounded-full shrink-0">
                        Đang chọn
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400 group-hover:text-[#EA701B] shrink-0">
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
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#EA701B] flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Mã mời 6 chữ số cho Nhân viên</h3>
              <p className="text-xs text-slate-500">
                Nhân viên tải app / mở web chỉ cần nhập 6 số này để tự động gia nhập quán
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={generatingCode}
            onClick={handleGenerateCode}
            className="flex items-center gap-2 px-4 py-2 bg-[#EA701B] text-white text-xs font-bold rounded-xl hover:bg-[#D55E0D] transition shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generatingCode ? 'animate-spin' : ''}`} />
            <span>{generatingCode ? 'Đang tạo...' : 'Tạo mã mới'}</span>
          </button>
        </div>

        {/* Big 6-digit Code Display */}
        <div className="bg-gradient-to-br from-[#FFF0E5] via-[#FFF7F0] to-orange-50/50 p-6 rounded-2xl border border-orange-200/70 text-center space-y-3">
          {hasValidCode ? (
            <>
              <div className="text-xs font-bold text-[#EA701B] uppercase tracking-wider">
                Mã mời hiện tại của quán
              </div>
              <div className="text-4xl md:text-5xl font-extrabold tracking-widest font-mono text-slate-900 select-all">
                {inviteCode.slice(0, 3)} {inviteCode.slice(3, 6)}
              </div>

              {/* Expiration countdown pill */}
              <div className="flex items-center justify-center gap-2 text-xs font-semibold">
                <Clock className="w-4 h-4 text-[#EA701B]" />
                <span className="text-slate-600">Thời gian còn lại:</span>
                <span className="px-2 py-0.5 rounded-full bg-orange-200 text-[#EA701B] font-mono font-bold">
                  {remainingTime || '60 phút'}
                </span>
              </div>

              {/* Copy button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-orange-200 rounded-xl text-xs font-bold text-slate-700 hover:text-[#EA701B] shadow-xs hover:border-orange-300 transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Đã sao chép mã!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Sao chép mã 6 số</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="py-4">
              <p className="text-xs text-slate-500 mb-3">
                Chưa có mã mời hoạt động hoặc mã cũ đã hết hạn. Nhấn nút bên dưới để tạo mã 6 chữ số có hiệu lực 60 phút.
              </p>
              <button
                type="button"
                onClick={handleGenerateCode}
                className="px-5 py-2.5 bg-[#EA701B] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Tạo mã mời 6 chữ số ngay
              </button>
            </div>
          )}

          {/* Warning notice */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200/80 rounded-xl p-2.5 max-w-lg mx-auto">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <b>Lưu ý:</b> Khi tạo mã mới, mã mời trước đó sẽ lập tức bị vô hiệu hóa.
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: DIRECT INVITATION BY EMAIL */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="pb-3 border-b border-slate-100 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Mời nhân viên bằng Email</h3>
            <p className="text-xs text-slate-500">
              Chủ động thêm nhân viên đã có tài khoản vào danh sách nhân sự của quán qua địa chỉ Email
            </p>
          </div>
        </div>

        <form onSubmit={handleDirectInvite} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email nhân viên
            </label>
            <input
              type="email"
              placeholder="nhanvien@gmail.com"
              value={directForm.email}
              onChange={(e) => setDirectForm((prev) => ({ ...prev, email: e.target.value }))}
              required
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA701B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lương theo giờ khởi điểm (VNĐ/giờ)
            </label>
            <input
              type="number"
              step="1000"
              value={directForm.hourlyWage}
              onChange={(e) => setDirectForm((prev) => ({ ...prev, hourlyWage: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EA701B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Hình thức làm việc
            </label>
            <select
              value={directForm.employmentType}
              onChange={(e) =>
                setDirectForm((prev) => ({ ...prev, employmentType: e.target.value }))
              }
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
            >
              <option value="PART_TIME">Bán thời gian (Part-time)</option>
              <option value="FULL_TIME">Toàn thời gian (Full-time)</option>
            </select>
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={invitingDirect}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-50 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4 text-[#EA701B]" />
              <span>{invitingDirect ? 'Đang thêm...' : 'Thêm nhân viên ngay'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 3: STORE GENERAL INFORMATION */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="pb-3 border-b border-slate-100 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#EA701B] flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Thông tin cơ sở quán</h3>
            <p className="text-xs text-slate-500">
              Tên cửa hàng và địa chỉ hiển thị trên ứng dụng của nhân viên và email xếp lịch
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveStore} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tên cửa hàng</label>
            <input
              type="text"
              value={storeForm.name}
              onChange={(e) => setStoreForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EA701B]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ quán</label>
            <input
              type="text"
              value={storeForm.address}
              onChange={(e) => setStoreForm((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Ví dụ: 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. HCM"
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EA701B]"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingStore}
              className="px-5 py-2.5 bg-[#EA701B] hover:bg-[#D55E0D] text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-50 flex items-center gap-2"
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
