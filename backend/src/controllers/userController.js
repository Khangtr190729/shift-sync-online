import bcrypt from 'bcryptjs';
import User from '../models/User.js';

/**
 * @desc    Cập nhật thông tin cá nhân (Họ tên, giới tính, tuổi, avatar)
 * @route   PUT /api/users/profile
 * @access  Private (Cần Token)
 */
export const updateProfile = async (req, res) => {
  try {
    const { fullName, gender, age, avatar } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng.',
      });
    }

    if (fullName) user.fullName = fullName.trim();
    if (gender) user.gender = gender;
    if (age !== undefined) user.age = Number(age);
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công!',
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        gender: user.gender,
        age: user.age,
        systemRole: user.systemRole,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Lỗi cập nhật profile:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi máy chủ khi cập nhật thông tin: ${error.message}`,
    });
  }
};

/**
 * @desc    Đổi mật khẩu tài khoản
 * @route   PUT /api/users/change-password
 * @access  Private (Cần Token)
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng.',
      });
    }

    // Kiểm tra mật khẩu hiện tại có đúng không
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác.',
      });
    }

    // Băm mật khẩu mới và lưu
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    // Thu hồi các phiên đăng nhập cũ trên thiết bị khác để đảm bảo an toàn
    user.refreshTokens = [];
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công! Vui lòng dùng mật khẩu mới cho các lần đăng nhập sau.',
    });
  } catch (error) {
    console.error('Lỗi đổi mật khẩu:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi máy chủ khi đổi mật khẩu: ${error.message}`,
    });
  }
};
