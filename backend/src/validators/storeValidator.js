import { z } from 'zod';

/**
 * Schema tạo cửa hàng mới
 */
export const createStoreSchema = z.object({
  name: z
    .string({ required_error: 'Vui lòng nhập tên cửa hàng.' })
    .trim()
    .min(1, 'Vui lòng nhập tên cửa hàng.'),

  address: z.string().trim().optional(),
});

/**
 * Schema cập nhật thông tin cửa hàng
 */
export const updateStoreSchema = z.object({
  storeId: z.string().trim().optional(),
  name: z
    .string()
    .trim()
    .min(1, 'Tên cửa hàng không được để trống.')
    .optional(),

  address: z.string().trim().optional(),
});

/**
 * Schema nhân viên gia nhập cửa hàng qua mã mời 6 chữ số
 */
export const joinByCodeSchema = z.object({
  inviteCode: z.coerce
    .string({ required_error: 'Vui lòng nhập mã mời 6 chữ số.' })
    .trim()
    .regex(/^\d{6}$/, 'Mã mời không đúng định dạng (Mã mời phải gồm đúng 6 chữ số, ví dụ: 482915).'),

  employmentType: z.enum(['FULL_TIME', 'PART_TIME']).optional().default('PART_TIME'),
});

/**
 * Schema chủ quán mời / thêm trực tiếp nhân viên qua Email hoặc ID
 */
export const inviteEmployeeSchema = z
  .object({
    storeId: z.string().trim().optional(),
    email: z.string().trim().optional(),
    identifier: z.string().trim().optional(),
    targetUserId: z.string().trim().optional(),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME']).optional().default('PART_TIME'),
    hourlyWage: z.coerce
      .number({ invalid_type_error: 'Mức lương theo giờ phải là số.' })
      .min(0, 'Mức lương theo giờ không được âm.')
      .optional()
      .default(0),
  })
  .refine(
    (data) => Boolean(data.email || data.identifier || data.targetUserId),
    {
      message: 'Vui lòng cung cấp Email hoặc ID của nhân viên.',
      path: ['email'],
    }
  );
