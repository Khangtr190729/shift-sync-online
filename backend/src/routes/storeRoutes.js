import express from 'express';
import {
  createStore,
  getMyStore,
  getMyStores,
  updateMyStore,
  generateInviteCode,
  joinByCode,
  inviteById,
} from '../controllers/storeController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateBody } from '../middlewares/validateMiddleware.js';
import { joinCodeLimiter } from '../middlewares/rateLimiter/storeLimiter.js';
import {
  createStoreSchema,
  updateStoreSchema,
  joinByCodeSchema,
  inviteEmployeeSchema,
} from '../validators/storeValidator.js';
import memberRoutes from './memberRoutes.js';
import shiftRoutes from './shiftRoutes.js';
import { storeScheduleRouter } from './scheduleRoutes.js';

const router = express.Router();

// Tất cả các routes Store đều yêu cầu đăng nhập
router.use(protect);

// Nhánh con quản lý thành viên và gán lương: /api/stores/:storeId/members
router.use('/:storeId/members', memberRoutes);

// Nhánh con quản lý Slot ca làm việc: /api/stores/:storeId/shifts
router.use('/:storeId/shifts', shiftRoutes);

// Nhánh con xếp lịch và xuất bản gửi email: /api/stores/:storeId/schedules
router.use('/:storeId/schedules', storeScheduleRouter);

// 1. Tạo cửa hàng mới (ADMIN)
router.post('/', validateBody(createStoreSchema), createStore);

// 2. Lấy thông tin cửa hàng của tôi (ADMIN hoặc EMPLOYEE)
router.get('/my-store', getMyStore);

// 2b. Lấy danh sách tất cả các cửa hàng của tôi (ADMIN hoặc EMPLOYEE)
router.get('/my-stores', getMyStores);

// 3. Cập nhật thông tin cửa hàng (ADMIN)
router.put('/my-store', validateBody(updateStoreSchema), updateMyStore);

// 4. Sinh mã mời 6 số ngẫu nhiên (ADMIN) - Hiệu lực 1h, vô hiệu mã cũ
router.post('/generate-invite-code', generateInviteCode);

// 5. Nhân viên nhập mã mời 6 số để gia nhập (EMPLOYEE - Giới hạn 5 lần/15p chống brute-force)
router.post('/join-by-code', joinCodeLimiter, validateBody(joinByCodeSchema), joinByCode);

// 6. Chủ quán mời trực tiếp nhân viên qua ID hoặc Email (ADMIN)
router.post('/invite-by-id', validateBody(inviteEmployeeSchema), inviteById);

export default router;
