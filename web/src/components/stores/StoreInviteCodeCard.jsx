import React from 'react';
import { KeyRound, RefreshCw, Clock, Copy, Check, AlertTriangle } from 'lucide-react';

export const StoreInviteCodeCard = ({
  inviteCode,
  remainingTime,
  hasValidCode,
  generatingCode,
  copied,
  onGenerateCode,
  onCopyCode,
}) => {
  return (
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
          onClick={onGenerateCode}
          className="flex items-center gap-2 px-4 py-2 bg-[#EA701B] text-white text-xs font-bold rounded-xl hover:bg-[#D55E0D] transition shadow-xs disabled:opacity-50 cursor-pointer"
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
                onClick={onCopyCode}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-orange-200 rounded-xl text-xs font-bold text-slate-700 hover:text-[#EA701B] shadow-xs hover:border-orange-300 transition cursor-pointer"
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
              onClick={onGenerateCode}
              className="px-5 py-2.5 bg-[#EA701B] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#D55E0D] transition cursor-pointer"
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
  );
};

