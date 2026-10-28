import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Shield,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { memberApi } from '../services/api';
import { formatVND, getRoleLabel, getEmploymentTypeLabel } from '../utils/formatters';
import { EditMemberWageModal } from '../components/employees/EditMemberWageModal';
import { EditMemberRoleModal } from '../components/employees/EditMemberRoleModal';
import { EditMemberTypeModal } from '../components/employees/EditMemberTypeModal';
import { RemoveMemberConfirmModal } from '../components/employees/RemoveMemberConfirmModal';

export const EmployeeManagementPage = () => {
  const { store, roleInStore, user } = useAuth();
  const isAdmin = roleInStore === 'ADMIN' || user?.role === 'ADMIN';

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Sub-modal states
  const [wageModal, setWageModal] = useState({ isOpen: false, member: null, newWage: '' });
  const [roleModal, setRoleModal] = useState({ isOpen: false, member: null, newRole: 'EMPLOYEE' });
  const [typeModal, setTypeModal] = useState({ isOpen: false, member: null, newType: 'PART_TIME' });
  const [removeModal, setRemoveModal] = useState({ isOpen: false, member: null });

  const loadMembers = useCallback(async () => {
    if (!store?._id) return;
    try {
      setLoading(true);
      const res = await memberApi.getMembers(store._id);
      if (res.success) {
        const rawList = res.members || res.data || [];
        const normalized = rawList.map((m) => ({
          ...m,
          _id: m.memberId || m._id,
          role: m.isOwner ? 'ADMIN' : (m.roleInStore || m.role),
          user: {
            _id: m.userId || m.user?._id,
            name: m.fullName || m.user?.fullName || m.user?.name,
            email: m.email || m.user?.email,
            gender: m.gender || m.user?.gender,
            age: m.age || m.user?.age,
            avatar: m.avatar || m.user?.avatar
          }
        }));
        setMembers(normalized);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Không thể tải danh sách nhân viên' });
    } finally {
      setLoading(false);
    }
  }, [store?._id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Filtered members by name or email
  const filteredMembers = members.filter((m) => {
    const q = searchTerm.toLowerCase();
    const name = m.user?.name?.toLowerCase() || '';
    const email = m.user?.email?.toLowerCase() || '';
    return name.includes(q) || email.includes(q);
  });

  // Handle Update Wage
  const handleSaveWage = async () => {
    if (!wageModal.member || !wageModal.newWage) return;
    try {
      const res = await memberApi.updateWage(
        store._id,
        wageModal.member._id,
        Number(wageModal.newWage)
      );
      if (res.success) {
        setFeedback({ type: 'success', message: 'Cập nhật mức lương thành công!' });
        setWageModal({ isOpen: false, member: null, newWage: '' });
        loadMembers();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Lỗi khi cập nhật lương' });
    }
  };

  // Handle Update Role
  const handleSaveRole = async () => {
    if (!roleModal.member) return;
    try {
      const res = await memberApi.updateRole(
        store._id,
        roleModal.member._id,
        roleModal.newRole
      );
      if (res.success) {
        setFeedback({ type: 'success', message: 'Cập nhật quyền hạn thành công!' });
        setRoleModal({ isOpen: false, member: null, newRole: 'EMPLOYEE' });
        loadMembers();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Lỗi khi cập nhật vai trò' });
    }
  };

  // Handle Update Employment Type
  const handleSaveType = async () => {
    if (!typeModal.member) return;
    try {
      const res = await memberApi.updateEmploymentType(
        store._id,
        typeModal.member._id,
        typeModal.newType
      );
      if (res.success) {
        setFeedback({ type: 'success', message: 'Cập nhật hình thức làm việc thành công!' });
        setTypeModal({ isOpen: false, member: null, newType: 'PART_TIME' });
        loadMembers();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Lỗi khi cập nhật loại hợp đồng' });
    }
  };

  // Handle Remove Member
  const handleConfirmRemove = async () => {
    if (!removeModal.member) return;
    try {
      const res = await memberApi.removeMember(store._id, removeModal.member._id);
      if (res.success) {
        setFeedback({ type: 'success', message: 'Đã xóa nhân viên khỏi cửa hàng.' });
        setRemoveModal({ isOpen: false, member: null });
        loadMembers();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Lỗi khi xóa nhân viên' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-[#EA701B]" />
            <span>Danh sách nhân viên cửa hàng</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-[#EA701B] font-bold">
              {members.length} nhân sự
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý mức lương theo giờ, loại hợp đồng và quyền hạn quản lý ca làm.
          </p>
        </div>

        {/* Search bar & Invite shortcut */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA701B] w-56 md:w-64"
            />
          </div>

          {isAdmin && (
            <Link
              to="/store-management"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#EA701B] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#D55E0D] transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Mời nhân viên</span>
            </Link>
          )}
        </div>
      </div>

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
              <CheckCircle className="w-5 h-5 text-emerald-600" />
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

      {/* Employee Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Đang tải danh sách nhân sự...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Không tìm thấy nhân viên phù hợp</p>
            <p className="text-xs text-slate-500 mt-1">
              Hãy thử tìm kiếm với từ khóa khác hoặc chia sẻ mã mời 6 chữ số cho nhân viên mới.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#FFF0E5] border-b border-orange-100 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <th className="p-4">Nhân viên</th>
                  <th className="p-4">Hình thức làm việc</th>
                  <th className="p-4">Vai trò / Quyền</th>
                  <th className="p-4">Lương theo giờ (VNĐ/h)</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredMembers.map((member) => {
                  const roleBadge = getRoleLabel(member.role);
                  const typeBadge = getEmploymentTypeLabel(member.employmentType);
                  const isCurrentSelf = member.user?._id === user?._id;
                  const isStoreOwner = member.isOwner || member.role === 'ADMIN';

                  return (
                    <tr key={member._id} className="hover:bg-orange-50/20 transition">
                      {/* Name & Email */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 text-[#EA701B] font-bold text-sm flex items-center justify-center shrink-0 border border-orange-200">
                            {member.user?.name ? member.user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{member.user?.name}</span>
                              {isCurrentSelf && (
                                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-semibold">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              {member.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Employment Type */}
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() =>
                            setTypeModal({
                              isOpen: true,
                              member,
                              newType: member.employmentType || 'PART_TIME'
                            })
                          }
                          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border hover:opacity-80 transition cursor-pointer"
                        >
                          <span className={`px-2 py-0.5 rounded-md ${typeBadge.badge}`}>
                            {typeBadge.text}
                          </span>
                          <Edit2 className="w-3 h-3 text-slate-400" />
                        </button>
                      </td>

                      {/* Role Badge & Promotion Action */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${roleBadge.color}`}
                          >
                            <Shield className="w-3.5 h-3.5" />
                            {roleBadge.text}
                          </span>

                          {/* Admin can promote/demote if not owner */}
                          {isAdmin && !isStoreOwner && (
                            <button
                              type="button"
                              onClick={() =>
                                setRoleModal({
                                  isOpen: true,
                                  member,
                                  newRole: member.role === 'MANAGER' ? 'EMPLOYEE' : 'MANAGER'
                                })
                              }
                              title="Thay đổi quyền hạn"
                              className="text-xs text-slate-400 hover:text-[#EA701B] p-1 rounded-md hover:bg-orange-50 transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Hourly Wage */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-mono text-sm">
                            {formatVND(member.hourlyWage || 0)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setWageModal({
                                isOpen: true,
                                member,
                                newWage: String(member.hourlyWage || 20000)
                              })
                            }
                            className="p-1 text-slate-400 hover:text-[#EA701B] hover:bg-orange-50 rounded-md transition"
                            title="Sửa mức lương"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        {isAdmin && !isStoreOwner && (
                          <button
                            type="button"
                            onClick={() => setRemoveModal({ isOpen: true, member })}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                            title="Xóa nhân viên khỏi quán"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sub-modals */}
      <EditMemberWageModal
        modalState={wageModal}
        setModalState={setWageModal}
        onSaveWage={handleSaveWage}
      />
      <EditMemberRoleModal
        modalState={roleModal}
        setModalState={setRoleModal}
        onSaveRole={handleSaveRole}
      />
      <EditMemberTypeModal
        modalState={typeModal}
        setModalState={setTypeModal}
        onSaveType={handleSaveType}
      />
      <RemoveMemberConfirmModal
        modalState={removeModal}
        setModalState={setRemoveModal}
        onConfirmRemove={handleConfirmRemove}
      />
    </div>
  );
};

export default EmployeeManagementPage;
