import mongoose from 'mongoose';
import Store from '../models/Store.js';
import StoreMember from '../models/StoreMember.js';
import { removeMemberFutureShifts } from '../services/scheduleService.js';

/**
 * Hàm kiểm tra quyền hạn của người gọi trong cửa hàng
 * Trả về: { isOwner: boolean, isManager: boolean, store: Object }
 */
const verifyStoreAccess = async (storeId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(storeId)) {
    return { error: 'Mã cửa hàng (storeId) không hợp lệ.' };
  }

  const store = await Store.findById(storeId);
  if (!store) {
    return { error: 'Không tìm thấy cửa hàng.' };
  }

  const isOwner = store.ownerId.toString() === userId;

  const member = await StoreMember.findOne({
    storeId,
    userId,
    status: 'ACTIVE',
  });

  const isManager = isOwner || (member && ['MANAGER', 'ADMIN'].includes(member.roleInStore));

  return { store, isOwner, isManager, currentMember: member };
};

/**
 * @desc    Lấy danh sách thành viên trong cửa hàng kèm thông tin chi tiết và mức lương/h
 * @route   GET /api/stores/:storeId/members
 * @access  Private (Chủ hoặc Quản lý của quán)
 */
export const getStoreMembers = async (req, res) => {
  try {
    const { storeId } = req.params;
    const userId = req.user.id;

    const access = await verifyStoreAccess(storeId, userId);
    if (access.error) {
      return res.status(404).json({ success: false, message: access.error });
    }

    if (!access.isManager) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem danh sách nhân sự của cửa hàng này.',
      });
    }

    // Lấy danh sách thành viên đang hoạt động, populate thông tin người dùng
    const members = await StoreMember.find({ storeId, status: 'ACTIVE' })
      .populate('userId', 'fullName email gender age avatar systemRole')
      .sort({ roleInStore: 1, joinedAt: -1 });

    return res.status(200).json({
      success: true,
      storeName: access.store.name,
      total: members.length,
      members: members.map((m) => {
        const isOwner = access.store.ownerId.toString() === (m.userId ? m.userId._id.toString() : '');
        return {
          memberId: m._id,
          userId: m.userId ? m.userId._id : null,
          fullName: m.userId ? m.userId.fullName : 'N/A',
          email: m.userId ? m.userId.email : 'N/A',
          gender: m.userId ? m.userId.gender : 'N/A',
          age: m.userId ? m.userId.age : 'N/A',
          avatar: m.userId ? m.userId.avatar : '',
          roleInStore: isOwner ? 'ADMIN' : m.roleInStore,
          employmentType: m.employmentType,
          hourlyWage: m.hourlyWage, // Mức lương theo giờ (VNĐ/h)
          joinedAt: m.joinedAt,
          status: m.status,
          isOwner,
        };
      }),
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách nhân viên:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi máy chủ khi lấy danh sách nhân viên: ${error.message}`,
    });
  }
};

/**
 * @desc    Cài đặt hoặc cập nhật mức lương theo giờ (hourlyWage) cho nhân viên
 * @route   PUT /api/stores/:storeId/members/:memberId/wage
 * @access  Private (Chủ hoặc Quản lý)
 */
export const updateMemberWage = async (req, res) => {
  try {
    const { storeId, memberId } = req.params;
    const { hourlyWage } = req.body;
    const userId = req.user.id;

    const access = await verifyStoreAccess(storeId, userId);
    if (access.error) {
      return res.status(404).json({ success: false, message: access.error });
    }

    if (!access.isManager) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ Chủ cửa hàng hoặc Quản lý mới có quyền chỉnh sửa mức lương.',
      });
    }

    const member = await StoreMember.findOne({ _id: memberId, storeId }).populate(
      'userId',
      'fullName email'
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thành viên này trong cửa hàng.',
      });
    }

    member.hourlyWage = Number(hourlyWage);
    await member.save();

    return res.status(200).json({
      success: true,
      message: `Đã cập nhật mức lương cho ${member.userId ? member.userId.fullName : 'nhân viên'} thành ${member.hourlyWage.toLocaleString('vi-VN')} VNĐ/h.`,
      member: {
        memberId: member._id,
        fullName: member.userId ? member.userId.fullName : 'N/A',
        hourlyWage: member.hourlyWage,
      },
    });
  } catch (error) {
    console.error('Lỗi cập nhật mức lương:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi máy chủ khi cập nhật lương: ${error.message}`,
    });
  }
};

/**
 * @desc    Bổ nhiệm nhân viên lên làm Quản lý (MANAGER) hoặc hạ quyền xuống Nhân viên
 * @route   PUT /api/stores/:storeId/members/:memberId/role
 * @access  Private (CHỈ CHỦ CỬA HÀNG - OWNER)
 */
export const updateMemberRole = async (req, res) => {
  try {
    const { storeId, memberId } = req.params;
    const { roleInStore } = req.body;
    const userId = req.user.id;

    const access = await verifyStoreAccess(storeId, userId);
    if (access.error) {
      return res.status(404).json({ success: false, message: access.error });
    }

    // Chỉ Chủ sở hữu mới được quyền bổ nhiệm Quản lý
    if (!access.isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ Chủ cửa hàng mới có quyền phân quyền hoặc bổ nhiệm Quản lý.',
      });
    }

    const member = await StoreMember.findOne({ _id: memberId, storeId }).populate(
      'userId',
      'fullName email'
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thành viên này trong cửa hàng.',
      });
    }

    // Không thể hạ quyền của chính Chủ quán
    if (member.userId && member.userId._id.toString() === access.store.ownerId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Không thể thay đổi quyền hạn của Chủ sở hữu cửa hàng.',
      });
    }

    member.roleInStore = roleInStore;
    await member.save();

    const roleName = roleInStore === 'MANAGER' ? 'Quản lý (MANAGER)' : 'Nhân viên (EMPLOYEE)';

    return res.status(200).json({
      success: true,
      message: `Đã thay đổi chức vụ của ${member.userId ? member.userId.fullName : 'thành viên'} thành ${roleName}.`,
      member: {
        memberId: member._id,
        fullName: member.userId ? member.userId.fullName : 'N/A',
        roleInStore: member.roleInStore,
      },
    });
  } catch (error) {
    console.error('Lỗi phân quyền nhân viên:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi máy chủ khi phân quyền: ${error.message}`,
    });
  }
};

/**
 * @desc    Cập nhật hình thức làm việc (Full-time / Part-time)
 * @route   PUT /api/stores/:storeId/members/:memberId/type
 * @access  Private (Chủ hoặc Quản lý)
 */
export const updateMemberEmploymentType = async (req, res) => {
  try {
    const { storeId, memberId } = req.params;
    const { employmentType } = req.body;
    const userId = req.user.id;

    const access = await verifyStoreAccess(storeId, userId);
    if (access.error) {
      return res.status(404).json({ success: false, message: access.error });
    }

    if (!access.isManager) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền chỉnh sửa hình thức làm việc.',
      });
    }

    const member = await StoreMember.findOne({ _id: memberId, storeId }).populate(
      'userId',
      'fullName'
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thành viên này.',
      });
    }

    member.employmentType = employmentType;
    await member.save();

    return res.status(200).json({
      success: true,
      message: `Đã đổi hình thức làm của ${member.userId ? member.userId.fullName : 'thành viên'} thành ${employmentType === 'FULL_TIME' ? 'Chính thức' : 'Bán thời gian'}.`,
      member: {
        memberId: member._id,
        employmentType: member.employmentType,
      },
    });
  } catch (error) {
    console.error('Lỗi đổi hình thức làm:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi máy chủ: ${error.message}`,
    });
  }
};

/**
 * @desc    Xóa nhân viên khỏi cửa hàng
 * @route   DELETE /api/stores/:storeId/members/:memberId
 * @access  Private (CHỈ CHỦ CỬA HÀNG - OWNER)
 */
export const removeMember = async (req, res) => {
  try {
    const { storeId, memberId } = req.params;
    const userId = req.user.id;

    const access = await verifyStoreAccess(storeId, userId);
    if (access.error) {
      return res.status(404).json({ success: false, message: access.error });
    }

    if (!access.isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ Chủ cửa hàng mới có quyền xóa nhân viên khỏi quán.',
      });
    }

    const member = await StoreMember.findOne({ _id: memberId, storeId }).populate(
      'userId',
      'fullName'
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thành viên này.',
      });
    }

    // Không thể xóa chính chủ quán
    if (member.userId && member.userId._id.toString() === access.store.ownerId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa Chủ sở hữu khỏi cửa hàng.',
      });
    }

    const employeeName = member.userId ? member.userId.fullName : 'Nhân viên';

    // Đổi trạng thái sang INACTIVE để giữ lịch sử phân ca trước đây
    member.status = 'INACTIVE';
    await member.save();

    // Tự động xóa luôn các ca làm việc tương lai / chưa diễn ra của nhân viên này trên lịch làm việc
    // (Bảo toàn tuyệt đối các ca đã diễn ra trong quá khứ để không ảnh hưởng dữ liệu chấm công và lương)
    const targetUserId = member.userId._id ? member.userId._id.toString() : member.userId.toString();
    const removedCount = await removeMemberFutureShifts(storeId, targetUserId);

    return res.status(200).json({
      success: true,
      message: `Đã xóa ${employeeName} khỏi cửa hàng thành công.${
        removedCount > 0
          ? ` Đồng thời đã tự động dọn dẹp ${removedCount} ca làm việc tương lai của nhân viên này trên lịch làm việc.`
          : ''
      }`,
      removedFutureShiftsCount: removedCount,
    });
  } catch (error) {
    console.error('Lỗi xóa nhân viên:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi máy chủ khi xóa nhân viên: ${error.message}`,
    });
  }
};
