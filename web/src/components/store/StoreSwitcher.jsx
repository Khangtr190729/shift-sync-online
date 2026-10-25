import React, { useState, useRef, useEffect } from 'react';
import {
  Store as StoreIcon,
  ChevronDown,
  Check,
  Plus,
  MapPin,
  Building2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import CreateBranchModal from './CreateBranchModal';

export const StoreSwitcher = ({ isMobile = false }) => {
  const { user, store, stores, roleInStore, switchStore } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isOwner =
    roleInStore === 'ADMIN' ||
    user?.role === 'ADMIN' ||
    (store?.ownerId && String(store.ownerId) === String(user?._id));

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!store) return null;

  const handleSelectStore = async (storeId) => {
    if (String(storeId) === String(store._id)) {
      setIsOpen(false);
      return;
    }
    setIsOpen(false);
    await switchStore(storeId);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left transition-all duration-200 group flex items-center justify-between gap-2.5 ${
          isMobile
            ? 'px-3 py-2 bg-white/90 hover:bg-white rounded-xl border border-orange-200/80 shadow-xs'
            : 'p-3.5 bg-[#FFF0E5]/90 hover:bg-[#FFF0E5] rounded-2xl border border-orange-200/80 hover:border-orange-300 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EA701B] to-[#FF8C38] flex items-center justify-center text-white shrink-0 shadow-sm shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <StoreIcon className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-[#EA701B] uppercase tracking-wider">
                Cơ sở
              </span>
              {stores?.length > 1 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-orange-200/60 text-[#EA701B] rounded-full">
                  {stores.length}
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-slate-800 truncate leading-snug">
              {store.name}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center w-6 h-6 rounded-lg text-slate-400 group-hover:text-slate-700 group-hover:bg-white/60 transition-all shrink-0">
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#EA701B]' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
            isMobile
              ? 'top-full left-0 right-0 mt-2'
              : 'top-full left-0 w-72 mt-2 ml-1'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-[#FFF0E5] to-[#FFF7F0] border-b border-orange-100/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#EA701B]" />
              <span className="text-xs font-bold text-slate-800">
                Danh sách chi nhánh ({stores?.length || 1})
              </span>
            </div>
            {isOwner && (
              <span className="text-[10px] font-medium text-slate-500">Chủ sở hữu</span>
            )}
          </div>

          {/* Store List */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-1 divide-y divide-slate-50">
            {stores && stores.length > 0 ? (
              stores.map((s) => {
                const isSelected = String(s._id) === String(store._id);
                return (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => handleSelectStore(s._id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-2.5 group ${
                      isSelected
                        ? 'bg-[#FFF0E5] text-[#EA701B] font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <StoreIcon
                          className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#EA701B]' : 'text-slate-400'}`}
                        />
                        <p className="text-xs font-bold truncate leading-tight">
                          {s.name}
                        </p>
                      </div>
                      {s.address ? (
                        <p className="text-[11px] text-slate-400 truncate pl-5 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          <span>{s.address}</span>
                        </p>
                      ) : null}
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#EA701B] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">
                Không tìm thấy cơ sở nào.
              </div>
            )}
          </div>

          {/* Add Store Action for ADMIN */}
          {isOwner && (
            <div className="p-2 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setCreateModalOpen(true);
                }}
                className="w-full py-2 px-3 text-xs font-bold text-[#EA701B] hover:text-white bg-white hover:bg-[#EA701B] border border-orange-200 hover:border-transparent rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs group"
              >
                <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                <span>Mở thêm chi nhánh mới</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal create store */}
      <CreateBranchModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
};

export default StoreSwitcher;
