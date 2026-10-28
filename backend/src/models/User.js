import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['Nam', 'Nữ', 'Nu', 'Khác', 'Khac'],
      required: true,
    },
    age: {
      type: Number,
      required: true,
      min: 15,
      max: 100,
    },
    systemRole: {
      type: String,
      enum: ['ADMIN', 'EMPLOYEE'],
      default: 'EMPLOYEE',
      required: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    resetPasswordOtp: {
      code: {
        type: String,
        default: null,
      },
      expiresAt: {
        type: Date,
        default: null,
      },
    },
    refreshTokens: {
      type: [String], // Danh sách jti (JWT ID) hợp lệ cho cơ chế Refresh Token Rotation & Reuse Detection
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);
export default User;
export { User };

