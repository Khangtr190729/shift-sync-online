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
    <div className="flex-1 p-6 md:p-8 flex flex-col justify-between bg-white md:rounded-3xl md:border md:border-orange-200/80 md:shadow-md my-auto">
      <div>
        {/* Header branding */}
        <div className="text-center pt-2 pb-6 md:pb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF7F0] shadow-sm mx-auto p-2 flex items-center justify-center mb-3 border border-orange-100">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Tham gia Cửa hàng
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
            Nhập <b>Mã mời 6 chữ số</b> do Chủ quán cấp, hoặc gửi <b>Email tài khoản</b> của bạn để Chủ quán thêm trực tiếp.
          </p>
        </div>

        {/* 2-Column Responsive Layout on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
          {/* CÁCH 1: NHẬP MÃ MỜI 6 SỐ */}
          <div className="bg-[#FFFDFB] p-5 md:p-6 rounded-2xl border border-orange-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#EA701B] text-white flex items-center justify-center text-xs font-bold">1</div>
              <h3 className="text-sm font-bold text-slate-900">Nhập mã mời 6 chữ số</h3>
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
                    className="w-11 h-13 text-center text-xl font-extrabold font-mono rounded-xl bg-white border-2 border-slate-200 focus:border-[#EA701B] focus:ring-2 focus:ring-orange-100 text-slate-800 shadow-xs focus:outline-none transition"
                  />
                ))}
              </div>

              {joinFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    joinFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {joinFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{joinFeedback.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={joining}
                className="w-full py-3 bg-[#EA701B] hover:bg-[#D55E0D] text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {joining ? 'Đang xác thực...' : 'Xác nhận mã mời'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="p-3 bg-[#FFF0E5] rounded-xl border border-orange-200/60 text-xs text-slate-600 flex gap-2.5">
              <Info className="w-4 h-4 text-[#EA701B] shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600">
                Mã mời có hiệu lực trong <b>60 phút</b>. Nếu hết hạn, hãy nhờ Chủ quán tạo lại mã mới.
              </p>
            </div>
          </div>

          {/* CÁCH 2: GỬI EMAIL CHO CHỦ QUÁN */}
          <div className="bg-[#FFFDFB] p-5 md:p-6 rounded-2xl border border-orange-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">2</div>
              <h3 className="text-sm font-bold text-slate-900">Hoặc gửi Email cho Chủ quán</h3>
            </div>

            <div className="space-y-3">
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 mb-1">Email đăng ký của bạn:</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800 select-all truncate">
                    {user?.email || 'N/A'}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUserEmail}
                    className="px-3.5 py-2.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#EA701B] font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition cursor-pointer"
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

