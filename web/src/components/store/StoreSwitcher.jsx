import React, { useState, useRef, useEffect } from 'react';
import {
  Store as StoreIcon,
  ChevronDown,
  Check,
  Plus,
  MapPin,
  Building2,
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
      {/* Trigger Button (Apple Clean Capsule) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left transition-all duration-150 group flex items-center justify-between gap-2.5 cursor-pointer ${
          isMobile
            ? 'px-3 py-2 bg-white hover:bg-slate-50 rounded-xl border border-[#E5E5E7] shadow-xs'
            : 'p-3 bg-white hover:bg-slate-50 rounded-2xl border border-[#E5E5E7] shadow-xs'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-[#0066CC] flex items-center justify-center text-white shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <StoreIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-wider">
                Cơ sở
              </span>
              {stores?.length > 1 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-blue-50 text-[#0066CC] rounded-full border border-blue-100">
                  {stores.length}
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-[#1D1D1F] truncate leading-tight">
              {store.name}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center w-5 h-5 rounded-lg text-slate-400 group-hover:text-slate-700 transition-all shrink-0">
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#0066CC]' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 bg-white rounded-2xl shadow-xl border border-[#E5E5E7] overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
            isMobile
              ? 'top-full left-0 right-0 mt-2'
              : 'top-full left-0 w-72 mt-2'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#F5F5F7] border-b border-[#E5E5E7] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#0066CC]" />
              <span className="text-xs font-semibold text-[#1D1D1F]">
                Danh sách chi nhánh ({stores?.length || 1})
              </span>
            </div>
            {isOwner && (
              <span className="text-[10px] font-medium text-[#86868B]">Chủ sở hữu</span>
            )}
          </div>

          {/* Store List */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
            {stores && stores.length > 0 ? (
              stores.map((s) => {
                const isSelected = String(s._id) === String(store._id);
                return (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => handleSelectStore(s._id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 text-[#0066CC] font-semibold'
                        : 'hover:bg-slate-50 text-[#1D1D1F]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <StoreIcon
                          className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#0066CC]' : 'text-slate-400'}`}
                        />
                        <p className="text-xs font-semibold truncate leading-tight">
                          {s.name}
                        </p>
                      </div>
                      {s.address ? (
                        <p className="text-[11px] text-[#86868B] truncate pl-5 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          <span>{s.address}</span>
                        </p>
                      ) : null}
                    </div>

                    {isSelected && (
                      <div className="w-4.5 h-4.5 rounded-full bg-[#0066CC] text-white flex items-center justify-center shrink-0 mt-0.5">
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
            <div className="p-2 bg-[#F5F5F7] border-t border-[#E5E5E7]">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setCreateModalOpen(true);
                }}
                className="w-full py-2 px-3 text-xs font-semibold text-[#0066CC] hover:text-white bg-white hover:bg-[#0066CC] border border-blue-200 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer group"
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
