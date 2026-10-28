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
    <div className="bg-white rounded-2xl border border-[#e5e5e7] shadow-xs p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#e5e5e7]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-blue-50 text-[#0066cc] flex items-center justify-center">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1d1d1f]">Mã mời 6 chữ số cho Nhân viên</h3>
            <p className="text-xs text-[#6e6e73]">
              Nhân viên tải app / mở web chỉ cần nhập 6 số này để tự động gia nhập quán
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={generatingCode}
          onClick={onGenerateCode}
          className="flex items-center gap-2 px-4 py-2 bg-[#0066cc] text-white text-xs font-medium rounded-full hover:bg-[#0071e3] transition shadow-xs active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${generatingCode ? 'animate-spin' : ''}`} />
          <span>{generatingCode ? 'Đang tạo...' : 'Tạo mã mới'}</span>
        </button>
      </div>

      {/* Big 6-digit Code Display */}
      <div className="bg-[#fafafc] p-6 rounded-2xl border border-[#e5e5e7] text-center space-y-3">
        {hasValidCode ? (
          <>
            <div className="text-xs font-medium text-[#0066cc] uppercase tracking-wider">
              Mã mời hiện tại của quán
            </div>
            <div className="text-4xl md:text-5xl font-semibold tracking-widest font-mono text-[#1d1d1f] select-all">
              {inviteCode.slice(0, 3)} {inviteCode.slice(3, 6)}
            </div>

            {/* Expiration countdown pill */}
            <div className="flex items-center justify-center gap-2 text-xs font-medium">
              <Clock className="w-4 h-4 text-[#0066cc]" />
              <span className="text-[#6e6e73]">Thời gian còn lại:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0066cc] border border-blue-200/60 font-mono font-medium">
                {remainingTime || '60 phút'}
              </span>
            </div>

            {/* Copy button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onCopyCode}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#e5e5e7] rounded-full text-xs font-medium text-[#1d1d1f] hover:text-[#0066cc] hover:border-blue-200 shadow-xs transition active:scale-[0.98] cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Đã sao chép mã!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#86868b]" />
                    <span>Sao chép mã 6 số</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="py-4">
            <p className="text-xs text-[#6e6e73] mb-3">
              Chưa có mã mời hoạt động hoặc mã cũ đã hết hạn. Nhấn nút bên dưới để tạo mã 6 chữ số có hiệu lực 60 phút.
            </p>
            <button
              type="button"
              onClick={onGenerateCode}
              className="px-5 py-2.5 bg-[#0066cc] text-white text-xs font-medium rounded-full shadow-xs hover:bg-[#0071e3] transition active:scale-[0.98] cursor-pointer"
            >
              Tạo mã mời 6 chữ số ngay
            </button>
          </div>
        )}

        {/* Warning notice */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200/60 rounded-xl p-2.5 max-w-lg mx-auto">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <b>Lưu ý:</b> Khi tạo mã mới, mã mời trước đó sẽ lập tức bị vô hiệu hóa.
          </span>
        </div>
      </div>
    </div>
  );
};

