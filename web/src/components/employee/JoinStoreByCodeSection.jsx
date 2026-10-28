import React from 'react';
import {
  ArrowRight,
  Info,
  Sparkles,
  Copy,
  CheckCircle2,
  AlertCircle,
  LogOut,
} from 'lucide-react';

export const JoinStoreByCodeSection = ({
  user,
  inviteCodeDigits,
  handleDigitChange,
  handleDigitKeyDown,
  handleJoinStore,
  joining,
  joinFeedback,
  copiedEmail,
  handleCopyUserEmail,
  logout,
}) => {
  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col justify-between bg-white md:rounded-2xl md:border md:border-[#e5e5e7] md:shadow-xs my-auto">
      <div>
        {/* Header branding */}
        <div className="text-center pt-2 pb-6 md:pb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#f5f5f7] shadow-xs mx-auto p-2 flex items-center justify-center mb-3 border border-[#e5e5e7]">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">
            Tham gia Cửa hàng
          </h2>
          <p className="text-xs text-[#6e6e73] mt-1.5 max-w-md mx-auto">
            Nhập <b>Mã mời 6 chữ số</b> do Chủ quán cấp, hoặc gửi <b>Email tài khoản</b> của bạn để Chủ quán thêm trực tiếp.
          </p>
        </div>

        {/* 2-Column Responsive Layout on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
          {/* CÁCH 1: NHẬP MÃ MỜI 6 SỐ */}
          <div className="bg-[#fafafc] p-5 md:p-6 rounded-2xl border border-[#e5e5e7] shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#0066cc] text-white flex items-center justify-center text-xs font-semibold">1</div>
              <h3 className="text-sm font-semibold text-[#1d1d1f]">Nhập mã mời 6 chữ số</h3>
            </div>

            <form onSubmit={handleJoinStore} className="space-y-4">
              <div className="flex justify-center gap-2 sm:gap-2.5">
                {inviteCodeDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`digit-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                    className="w-11 h-13 text-center text-xl font-bold font-mono rounded-xl bg-white border border-[#d2d2d7] focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 text-[#1d1d1f] shadow-xs focus:outline-none transition"
                  />
                ))}
              </div>

              {joinFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    joinFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                      : 'bg-rose-50 text-rose-800 border border-rose-200/60'
                  }`}
                >
                  {joinFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{joinFeedback.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={joining}
                className="w-full py-3 bg-[#0066cc] hover:bg-[#0071e3] text-white font-medium text-sm rounded-full shadow-xs transition active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {joining ? 'Đang xác thực...' : 'Xác nhận mã mời'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/60 text-xs text-[#1d1d1f] flex gap-2.5">
              <Info className="w-4 h-4 text-[#0066cc] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#6e6e73]">
                Mã mời có hiệu lực trong <b>60 phút</b>. Nếu hết hạn, hãy nhờ Chủ quán tạo lại mã mới.
              </p>
            </div>
          </div>

          {/* CÁCH 2: GỬI EMAIL CHO CHỦ QUÁN */}
          <div className="bg-[#fafafc] p-5 md:p-6 rounded-2xl border border-[#e5e5e7] shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center text-xs font-semibold">2</div>
              <h3 className="text-sm font-semibold text-[#1d1d1f]">Hoặc gửi Email cho Chủ quán</h3>
            </div>

            <div className="space-y-3">
              <div>
                <span className="block text-[11px] font-medium text-[#6e6e73] mb-1">Email đăng ký của bạn:</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2.5 bg-white border border-[#d2d2d7] rounded-xl font-mono text-xs font-medium text-[#1d1d1f] select-all truncate">
                    {user?.email || 'N/A'}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUserEmail}
                    className="px-4 py-2.5 bg-white hover:bg-[#f5f5f7] border border-[#e5e5e7] text-[#0066cc] font-medium text-xs rounded-full flex items-center gap-1.5 shrink-0 transition active:scale-[0.98] cursor-pointer"
                  >
                    {copiedEmail ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép Email</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-xs text-amber-900 flex gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Bạn chỉ cần gửi <b>Email ({user?.email})</b> này cho Chủ quán để được thêm vào danh sách nhân sự ngay lập tức!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom user logout */}
      <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500">Đang đăng nhập: <b className="text-slate-800">{user?.name}</b></span>
        <button
          type="button"
          onClick={logout}
          className="text-red-600 font-bold hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

