import { z } from 'zod';

/**
 * Schema query lấy lịch tuần (?week=43&year=2026)
 */
export const weekScheduleQuerySchema = z.object({
  week: z.coerce
    .number({
      required_error: 'Vui lòng cung cấp tham số tuần (week).',
      invalid_type_error: 'Tuần (week) phải là một số.',
    })
    .int()
    .min(1, 'Tuần phải từ 1 đến 53.')
    .max(53, 'Tuần phải từ 1 đến 53.'),

  year: z.coerce
    .number({
      required_error: 'Vui lòng cung cấp tham số năm (year).',
      invalid_type_error: 'Năm (year) phải là một số.',
    })
    .int()
    .min(2020, 'Năm phải từ 2020 trở đi.')
    .max(2100, 'Năm không hợp lệ.'),
});

/**
 * Schema query thống kê lịch tháng (?month=10&year=2026)
 */
export const monthlyStatsQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});

/**
 * Schema lưu bản nháp lịch làm việc (DRAFT)
 */
export const saveDraftScheduleSchema = z.object({
  week: z.coerce
    .number({ required_error: 'Vui lòng cung cấp tuần (week).' })
    .int()
    .min(1)
    .max(53),

  year: z.coerce
    .number({ required_error: 'Vui lòng cung cấp năm (year).' })
    .int()
    .min(2020)
    .max(2100),

  startDate: z.string({ required_error: 'Vui lòng cung cấp ngày bắt đầu tuần (startDate).' }),
  endDate: z.string({ required_error: 'Vui lòng cung cấp ngày kết thúc tuần (endDate).' }),

  assignments: z.array(z.any()).optional().default([]),
});

/**
 * Schema xuất bản lịch làm việc (PUBLISHED)
 */
export const publishScheduleSchema = z.object({
  week: z.coerce
    .number({ required_error: 'Vui lòng cung cấp tham số tuần (week).' })
    .int()
    .min(1)
    .max(53),

  year: z.coerce
    .number({ required_error: 'Vui lòng cung cấp tham số năm (year).' })
    .int()
    .min(2020)
    .max(2100),

  startDate: z.string().optional(),
  endDate: z.string().optional(),
  assignments: z.array(z.any()).optional(),
});

/**
 * Schema tự động xếp lịch thông minh (Auto Schedule)
 */
export const autoGenerateScheduleSchema = z.object({
  week: z.coerce
    .number({ required_error: 'Vui lòng cung cấp tham số tuần (week).' })
    .int()
    .min(1)
    .max(53),

  year: z.coerce
    .number({ required_error: 'Vui lòng cung cấp tham số năm (year).' })
    .int()
    .min(2020)
    .max(2100),

  startDate: z.string({ required_error: 'Vui lòng cung cấp ngày bắt đầu (startDate).' }),
  endDate: z.string({ required_error: 'Vui lòng cung cấp ngày kết thúc (endDate).' }),

  days: z.array(z.any()).optional(),
  staffPerShift: z.any().optional().default('AUTO_BY_STARS'),
  maxShiftsPerDay: z.coerce.number().int().min(1).optional().default(1),
  preserveExisting: z.boolean().optional().default(false),
  existingAssignments: z.array(z.any()).optional().default([]),
});

/**
 * Schema đánh giá ca làm việc (Evaluation)
 */
export const evaluateShiftSchema = z.object({
  week: z.coerce.number().optional(),
  year: z.coerce.number().optional(),
  weekStart: z.string().optional(),
  date: z.string({ required_error: 'Vui lòng cung cấp ngày diễn ra ca làm (date).' }),
  shiftId: z.string({ required_error: 'Vui lòng cung cấp shiftId của ca làm.' }),
  userId: z.string({ required_error: 'Vui lòng cung cấp userId của nhân viên.' }),

  attendanceStatus: z.enum(['COMPLETED', 'PARTIAL', 'MISSED'], {
    errorMap: () => ({
      message: 'Trạng thái đánh giá chỉ được là "COMPLETED", "PARTIAL" hoặc "MISSED".',
    }),
  }),

  missedReason: z.string().optional(),
  deductedHours: z.coerce.number().min(0).optional(),
  deductedPay: z.coerce.number().min(0).optional(),
  penaltyType: z.string().optional(),
});

/**
 * Schema query lịch cá nhân của nhân viên
 */
export const myScheduleQuerySchema = z.object({
  week: z.coerce.number().int().min(1).max(53).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});
