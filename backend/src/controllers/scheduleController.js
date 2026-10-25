import Schedule from '../models/Schedule.js';
import { sendScheduleEmail } from '../services/emailService.js';
import { verifyStoreAccess } from '../services/storeAccessService.js';
import {
  getTodayDateString,
  getWeekNumberAndYear,
} from '../utils/timeScheduleHelpers.js';
import {
  validatePassedShiftImmutability,
  processAssignmentsAndSalary,
  calculateSalarySummaryFromAssignments,
  generateAutoSchedule,
  evaluateShiftAttendance,
} from '../services/scheduleService.js';

/**
 * @desc    Lấy bảng lịch làm việc của một tuần/năm
 * @route   GET /api/stores/:storeId/schedules?week=43&year=2026
 * @access  Private (Mọi thành viên trong quán)
 */
export const getStoreSchedule = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { week, year } = req.query;
    const userId = req.user.id;

    const access = await verifyStoreAccess(storeId, userId);
    if (access.error) {
      return res.status(404).json({ success: false, message: access.error });
    }

    if (!access.isMember) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không thuộc cửa hàng này.',
      });
    }

    const schedule = await Schedule.findOne({
      storeId,
      week: Number(week),
      year: Number(year),
    })
      .populate('assignments.shiftId', 'name startTime endTime durationHours color')
      .populate('assignments.userId', 'fullName email systemRole');

    if (!schedule) {
      return res.status(200).json({
        success: true,
        hasSchedule: false,
        week: Number(week),
        year: Number(year),
        message: `Chưa có lịch làm việc cho Tuần ${week}/${year}. Bạn có thể bắt đầu tạo bản nháp.`,
        assignments: [],
        salarySummary: [],
      });
    }

    const salarySummary = calculateSalarySummaryFromAssignments(schedule.assignments);

    return res.status(200).json({
      success: true,
      hasSchedule: true,
      storeName: access.store.name,
      schedule,
      salarySummary,
    });
  } catch (error) {
    console.error('Lỗi lấy lịch tuần:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi máy chủ khi lấy lịch: ${error.message}`,
    });
  }
};

/**
 * @desc    Lưu bản nháp lịch làm việc (DRAFT)
 * @route   POST /api/stores/:storeId/schedules/draft
 * @access  Private (Chủ quán hoặc Quản lý)
 */
export const saveDraftSchedule = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { week, year, startDate, endDate, assignments = [] } = req.body;
    const userId = req.user.id;

    const access = await verifyStoreAccess(storeId, userId);
    if (access.error) {
      return res.status(404).json({ success: false, message: access.error });
    }

    if (!access.isManager) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ Chủ cửa hàng hoặc Quản lý mới có quyền lưu lịch làm.',
      });
    }

    const todayStr = getTodayDateString();
    const formattedEndDate = typeof endDate === 'string' ? endDate.split('T')[0] : '';
    if (formattedEndDate && formattedEndDate < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Không thể lưu hoặc chỉnh sửa lịch làm việc cho tuần đã kết thúc trong quá khứ.',
      });
    }

    let schedule = await Schedule.findOne({
      storeId,
      week: Number(week),
      year: Number(year),
    });

    // Xác thực bảo toàn ca đã qua
    await validatePassedShiftImmutability(
      storeId,
      assignments,
      schedule?.assignments || [],
      schedule?.status === 'PUBLISHED'
    );

    const { processedAssignments, salarySummary } = await processAssignmentsAndSalary(
      storeId,
      assignments
    );

    if (schedule) {
      schedule.startDate = new Date(startDate);
      schedule.endDate = new Date(endDate);
      schedule.assignments = processedAssignments;
      schedule.status = 'DRAFT';
      schedule.createdBy = userId;
    } else {
      schedule = new Schedule({
        storeId,
        week: Number(week),
        year: Number(year),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'DRAFT',
        createdBy: userId,
        assignments: processedAssignments,
      });
    }

    await schedule.save();

    await schedule.populate([
      { path: 'assignments.shiftId', select: 'name startTime endTime durationHours color' },
      { path: 'assignments.userId', select: 'fullName email systemRole' },
    ]);

    return res.status(200).json({
      success: true,
      message: 'Đã lưu bản nháp lịch làm việc thành công!',
      schedule,
      salarySummary,
    });
  } catch (error) {
    console.error('Lỗi lưu bản nháp lịch:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi máy chủ khi lưu bản nháp lịch',
    });
  }
};

/**
 * @desc    Xuất bản lịch làm việc (PUBLISHED) & Gửi email tự động cho nhân viên
 * @route   POST /api/stores/:storeId/schedules/publish
 * @access  Private (Chủ quán hoặc Quản lý)
 */
export const publishSchedule = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { week, year, startDate, endDate, assignments } = req.body;
    const userId = req.user.id;

    const access = await verifyStoreAccess(storeId, userId);
    if (access.error) {
      return res.status(404).json({ success: false, message: access.error });
    }

    if (!access.isManager) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ Chủ cửa hàng hoặc Quản lý mới có quyền xuất bản lịch làm.',
      });
    }

    const todayStr = getTodayDateString();
    const formattedEndDate = typeof endDate === 'string' ? endDate.split('T')[0] : '';
    if (formattedEndDate && formattedEndDate < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xuất bản lịch làm việc cho tuần đã kết thúc trong quá khứ.',
      });
    }

    let schedule = await Schedule.findOne({
      storeId,
      week: Number(week),
      year: Number(year),
    });

    let processedData;

    if (Array.isArray(assignments)) {
      await validatePassedShiftImmutability(
        storeId,
        assignments,
        schedule?.assignments || [],
        schedule?.status === 'PUBLISHED'
      );
      processedData = await processAssignmentsAndSalary(storeId, assignments);

      if (!schedule) {
        schedule = new Schedule({
          storeId,
          week: Number(week),
          year: Number(year),
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: endDate ? new Date(endDate) : new Date(),
          createdBy: userId,
        });
      }
      schedule.assignments = processedData.processedAssignments;
    } else {
      if (!schedule || schedule.assignments.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Không có ca làm nào trong tuần này để xuất bản. Vui lòng xếp lịch trước.',
        });
      }
      processedData = await processAssignmentsAndSalary(storeId, schedule.assignments);
    }

    schedule.status = 'PUBLISHED';
    schedule.publishedAt = new Date();
    await schedule.save();

    // Gửi email đến từng nhân viên
    const emailResults = [];
    const recipients = Object.values(processedData.salaryMap);

    for (const emp of recipients) {
      if (emp.email && emp.shifts.length > 0) {
        const sendResult = await sendScheduleEmail({
          toEmail: emp.email,
          employeeName: emp.fullName,
          storeName: access.store.name,
          week: Number(week),
          year: Number(year),
          assignments: emp.shifts,
          totalHours: emp.totalHours,
          hourlyWage: emp.hourlyWage,
          totalSalary: emp.totalSalary,
        });
        emailResults.push(sendResult);
      }
    }

    const failedEmails = emailResults.filter((r) => !r.success);
    const successEmails = emailResults.filter((r) => r.success && !r.simulated);
    const simulatedEmails = emailResults.filter((r) => r.simulated);

    let emailMsg = '';
    if (failedEmails.length > 0) {
      const isAuthError = failedEmails.some(
        (f) =>
          f.error &&
          (f.error.includes('535') ||
            f.error.includes('Username and Password not accepted') ||
            f.error.includes('BadCredentials'))
      );
      if (isAuthError) {
        emailMsg =
          ' (LƯU Ý: Gửi email thất bại do mật khẩu Gmail trong .env là mật khẩu thường. Google yêu cầu dùng "Mật khẩu ứng dụng" - App Password 16 chữ số để gửi thư tự động qua Nodemailer).';
      } else {
        emailMsg = ` (Lưu ý: Có ${failedEmails.length} email gửi thất bại: ${failedEmails[0].error}).`;
      }
    } else if (simulatedEmails.length > 0) {
      emailMsg = ' (Chưa cấu hình EMAIL_USER/EMAIL_PASS trong .env nên hệ thống mô phỏng và bỏ qua gửi thật).';
    } else if (successEmails.length > 0) {
      emailMsg = ` Đã gửi email thông báo chi tiết lịch trực kèm tiền lương đến ${successEmails.length} nhân viên.`;
    }

    return res.status(200).json({
      success: true,
      message: `Xuất bản lịch Tuần ${week}/${year} thành công!${emailMsg}`,
      schedule,
      salarySummary: processedData.salarySummary,
      emailsSent: emailResults,
      hasEmailError: failedEmails.length > 0,
    });
  } catch (error) {
    console.error('Lỗi xuất bản lịch & gửi mail:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi máy chủ khi xuất bản lịch',
    });
  }
};

/**
 * @desc    Nhân viên xem lịch làm việc và tiền lương tuần của riêng mình
 * @route   GET /api/schedules/my-schedule?week=43&year=2026
 * @access  Private (Nhân viên đã đăng nhập)
 */
export const getMySchedule = async (req, res) => {
  try {
    const { week, year, storeId } = req.query;
    const userId = req.user.id;

    if (!week || !year) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tham số week và year (ví dụ: ?week=43&year=2026).',
      });
    }

    const query = {
      week: Number(week),
      year: Number(year),
      'assignments.userId': userId,
    };
    if (storeId) {
      query.storeId = storeId;
    }

    // Tìm tất cả bảng lịch thỏa điều kiện (hỗ trợ nhân viên làm việc tại nhiều chi nhánh)
    const schedules = await Schedule.find(query)
      .populate('storeId', 'name address')
      .populate('assignments.shiftId', 'name startTime endTime durationHours color peakLevel')
      .populate('assignments.userId', 'fullName avatar');

    if (!schedules || schedules.length === 0) {
      return res.status(200).json({
        success: true,
        hasSchedule: false,
        week: Number(week),
        year: Number(year),
        message: 'Bạn không có ca làm việc nào trong tuần này.',
        shifts: [],
        totalHours: 0,
        totalSalary: 0,
      });
    }

    const myShifts = [];
    for (const schedule of schedules) {
      const shiftsInSchedule = schedule.assignments
        .filter((a) => {
          const uId = a.userId?._id ? a.userId._id.toString() : a.userId?.toString();
          return uId === userId;
        })
        .map((a) => {
          const sId = a.shiftId?._id ? a.shiftId._id.toString() : a.shiftId?.toString();
          const coworkers = schedule.assignments
            .filter((other) => {
              const otherUId = other.userId?._id ? other.userId._id.toString() : other.userId?.toString();
              const otherSId = other.shiftId?._id ? other.shiftId._id.toString() : other.shiftId?.toString();
              return other.date === a.date && otherSId === sId && otherUId !== userId;
            })
            .map((other) => ({
              _id: other.userId?._id || other.userId,
              name: other.userId?.fullName || 'Đồng nghiệp',
              avatar: other.userId?.avatar || '',
            }));

          return {
            assignmentId: a._id,
            store: schedule.storeId
              ? {
                  _id: schedule.storeId._id,
                  name: schedule.storeId.name,
                  address: schedule.storeId.address,
                }
              : null,
            date: a.date,
            dayOfWeek: a.dayOfWeek,
            shiftName: a.shiftId ? a.shiftId.name : 'N/A',
            startTime: a.shiftId ? a.shiftId.startTime : '',
            endTime: a.shiftId ? a.shiftId.endTime : '',
            hours: a.hours,
            hourlyWage: a.hourlyWage,
            totalPay: a.totalPay,
            attendanceStatus: a.attendanceStatus || 'COMPLETED',
            penaltyType: a.penaltyType || 'NONE',
            deductedHours: a.deductedHours || 0,
            deductedPay: a.deductedPay || 0,
            missedReason: a.missedReason || '',
            color: a.shiftId ? a.shiftId.color : '#3B82F6',
            coworkers,
            shift: a.shiftId
              ? {
                  _id: a.shiftId._id,
                  name: a.shiftId.name,
                  startTime: a.shiftId.startTime,
                  endTime: a.shiftId.endTime,
                  durationHours: a.hours || a.shiftId.durationHours,
                  color: a.shiftId.color,
                  peakLevel: a.shiftId.peakLevel || 1,
                }
              : null,
          };
        });
      myShifts.push(...shiftsInSchedule);
    }

    myShifts.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

    const totalHours = myShifts.reduce((acc, cur) => {
      if (cur.attendanceStatus === 'MISSED') return acc;
      if (cur.attendanceStatus === 'PARTIAL') return acc + Math.max(0, cur.hours - cur.deductedHours);
      return acc + cur.hours;
    }, 0);
    const totalSalary = myShifts.reduce((acc, cur) => acc + (cur.totalPay || 0), 0);
    const hourlyWage = myShifts.length > 0 ? myShifts[0].hourlyWage : 0;

    return res.status(200).json({
      success: true,
      hasSchedule: true,
      storeName: schedule.storeId ? schedule.storeId.name : 'N/A',
      week: schedule.week,
      year: schedule.year,
      status: schedule.status,
      publishedAt: schedule.publishedAt,
      shifts: myShifts,
      totalHours,
      hourlyWage,
      totalSalary,
    });
  } catch (error) {
    console.error('Lỗi lấy lịch cá nhân:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi máy chủ khi lấy lịch cá nhân: ${error.message}`,
    });
  }
};

/**
 * @desc    Tự động xếp ca làm việc thông minh và tối ưu cho nhân viên (Lưu bản nháp DRAFT)
 * @route   POST /api/stores/:storeId/schedules/auto-generate
 * @access  Private (Chủ quán hoặc Quản lý)
 */
export const autoGenerateSchedule = async (req, res) => {
  try {
    const { storeId } = req.params;
    const {
      week,
      year,
      startDate,
      endDate,
      days,
      staffPerShift = 'AUTO_BY_STARS',
      maxShiftsPerDay = 1,
      preserveExisting = false,
      existingAssignments = [],
    } = req.body;
    const userId = req.user.id;

    const access = await verifyStoreAccess(storeId, userId);
    if (access.error) {
      return res.status(404).json({ success: false, message: access.error });
    }

    if (!access.isManager) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ Chủ cửa hàng hoặc Quản lý mới có quyền sử dụng tính năng tự động xếp lịch.',
      });
    }

    const todayStr = getTodayDateString();
    const formattedEndDate = typeof endDate === 'string' ? endDate.split('T')[0] : '';
    if (formattedEndDate && formattedEndDate < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Không thể tự động xếp lịch cho tuần đã kết thúc trong quá khứ. Vui lòng chọn tuần hiện tại hoặc tương lai.',
      });
    }

    const { schedule, salarySummary } = await generateAutoSchedule({
      storeId,
      week,
      year,
      startDate,
      endDate,
      days,
      staffPerShift,
      maxShiftsPerDay,
      preserveExisting,
      existingAssignments,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: 'Đã tự động xếp ca làm việc thông minh & cân bằng tải thành công (Lưu bản nháp)!',
      schedule,
      salarySummary,
    });
  } catch (error) {
    console.error('Lỗi tự động xếp lịch:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi máy chủ khi tự động xếp lịch',
    });
  }
};

/**
 * @desc    Đánh giá ca làm việc (Hoàn thành hoặc Không hoàn thành/Vắng)
 * @route   PUT /api/stores/:storeId/schedules/evaluate-shift
 * @access  Private (Chủ hoặc Quản lý)
 */
export const evaluateShift = async (req, res) => {
  try {
    const { storeId } = req.params;
    const {
      week,
      year,
      weekStart,
      date,
      shiftId,
      userId,
      attendanceStatus,
      missedReason,
      deductedHours,
      deductedPay,
      penaltyType,
    } = req.body;
    const evaluatorId = req.user.id;

    let targetWeek = week;
    let targetYear = year;
    if ((!targetWeek || !targetYear) && (date || weekStart)) {
      const computed = getWeekNumberAndYear(date || weekStart);
      targetWeek = computed.week;
      targetYear = computed.year;
    }

    if (!targetWeek || !targetYear || !date || !shiftId || !userId || !attendanceStatus) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ: week, year, date, shiftId, userId, attendanceStatus.',
      });
    }

    const access = await verifyStoreAccess(storeId, evaluatorId);
    if (access.error) {
      return res.status(404).json({ success: false, message: access.error });
    }

    if (!access.isManager) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ Chủ cửa hàng hoặc Quản lý mới có quyền đánh giá ca làm việc.',
      });
    }

    const result = await evaluateShiftAttendance({
      storeId,
      week: Number(targetWeek),
      year: Number(targetYear),
      date,
      shiftId,
      userId,
      attendanceStatus,
      missedReason,
      deductedHours,
      deductedPay,
      penaltyType,
      evaluatorId,
    });

    let message = 'Đã khôi phục ca làm việc sang trạng thái Hoàn thành và cộng lại lương thành công!';
    if (attendanceStatus === 'MISSED') {
      message = 'Đã đánh dấu ca làm Không hoàn thành và trừ lương nhân viên thành công! Email thông báo đã được gửi.';
    } else if (attendanceStatus === 'PARTIAL') {
      message = 'Đã ghi nhận đánh giá Chưa hoàn thành tốt và trừ một phần lương thành công! Email thông báo đã được gửi.';
    }

    return res.status(200).json({
      success: true,
      message,
      schedule: result.schedule,
      salarySummary: result.salarySummary,
      emailSent: result.emailResult?.success || false,
    });
  } catch (error) {
    console.error('Lỗi đánh giá ca làm:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi máy chủ khi đánh giá ca làm việc.',
    });
  }
};

/**
 * @desc    Lấy thống kê lịch làm việc & dự toán tiền lương theo tháng (và tổng số ca toàn thời gian)
 * @route   GET /api/stores/:storeId/schedules/monthly-stats?month=10&year=2026
 * @access  Private (Mọi thành viên trong quán)
 */
export const getMonthlyScheduleStats = async (req, res) => {
  try {
    const { storeId } = req.params;
    const userId = req.user.id;

    const access = await verifyStoreAccess(storeId, userId);
    if (access.error) {
      return res.status(404).json({ success: false, message: access.error });
    }

    if (!access.isMember) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không thuộc cửa hàng này.',
      });
    }

    // Xác định tháng và năm truy vấn (mặc định tháng hiện tại theo múi giờ VN UTC+7)
    const now = new Date();
    const vnMonthStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      month: '2-digit',
    }).format(now);
    const vnYearStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
    }).format(now);

    const targetMonth = req.query.month ? Number(req.query.month) : Number(vnMonthStr);
    const targetYear = req.query.year ? Number(req.query.year) : Number(vnYearStr);

    const monthPrefix = `${targetYear}-${String(targetMonth).padStart(2, '0')}`; // VD: "2026-10"

    // Lấy toàn bộ schedules của cửa hàng
    const schedules = await Schedule.find({ storeId }).lean();

    let monthAssignedShifts = 0;
    let monthCompletedShifts = 0;
    let monthMissedShifts = 0;
    let monthTotalHours = 0;
    let monthTotalPayroll = 0;

    let allTimeAssignedShifts = 0;
    let allTimePayroll = 0;

    schedules.forEach((sched) => {
      if (sched.assignments && Array.isArray(sched.assignments)) {
        sched.assignments.forEach((a) => {
          allTimeAssignedShifts += 1;
          const isMissed = a.attendanceStatus === 'MISSED';
          const pay = !isMissed ? (a.totalPay ?? ((a.hours || 4) * (a.hourlyWage || 20000))) : 0;
          allTimePayroll += pay;

          // Kiểm tra xem ca có thuộc tháng đang xét không
          if (a.date && String(a.date).startsWith(monthPrefix)) {
            monthAssignedShifts += 1;
            if (isMissed) {
              monthMissedShifts += 1;
            } else {
              monthCompletedShifts += 1;
              monthTotalHours += (a.hours || 4);
              monthTotalPayroll += pay;
            }
          }
        });
      }
    });

    return res.status(200).json({
      success: true,
      month: targetMonth,
      year: targetYear,
      monthAssignedShifts,
      monthCompletedShifts,
      monthMissedShifts,
      monthTotalHours,
      monthTotalPayroll,
      allTimeAssignedShifts,
      allTimePayroll,
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê tháng:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê tháng.',
      error: error.message,
    });
  }
};

