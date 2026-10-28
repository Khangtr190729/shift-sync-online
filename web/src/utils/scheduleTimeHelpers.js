import { formatDateToISO } from './formatters';

// Helpers chuẩn hóa ID về dạng chuỗi an toàn tuyệt đối
export const getUserId = (userOrId) => {
  if (!userOrId) return '';
  if (typeof userOrId === 'object') {
    return String(userOrId._id || userOrId.id || userOrId.userId || '');
  }
  return String(userOrId);
};

export const getShiftId = (shiftOrId) => {
  if (!shiftOrId) return '';
  if (typeof shiftOrId === 'object') {
    return String(shiftOrId._id || shiftOrId.id || shiftOrId.shiftId || '');
  }
  return String(shiftOrId);
};

// Chuyển đổi định dạng giờ "HH:mm" sang số phút
export const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Lấy giờ hiện tại theo định dạng HH:mm chuẩn múi giờ Việt Nam
export const getCurrentVNTime = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
};

// Kiểm tra ca làm việc đã kết thúc/đã qua hay chưa (kể cả ca sáng hôm nay đã làm rồi)
export const isShiftPassedOrCompleted = (dateStr, shift) => {
  if (!dateStr || !shift) return false;
  const todayStr = formatDateToISO(new Date());

  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  // Nếu là ngày hôm nay: so sánh giờ hiện tại với giờ kết thúc của ca
  const currentMinutes = timeToMinutes(getCurrentVNTime());
  const startMinutes = timeToMinutes(shift.startTime);
  let endMinutes = timeToMinutes(shift.endTime);

  if (endMinutes <= startMinutes) {
    // Ca qua đêm của ngày hôm nay (VD: 22:00 -> 06:00):
    return currentMinutes >= startMinutes;
  }

  // Ca trong ngày thông thường (VD: 08:00 -> 12:00):
  return currentMinutes >= endMinutes;
};

// Kiểm tra ca làm việc đã bắt đầu hoặc đã qua hay chưa (ca đang diễn ra hoặc đã kết thúc)
// Ràng buộc: Chỉ ca đang diễn ra hoặc quá khứ mới được quyền đánh giá, ca tương lai không được đánh giá.
export const isShiftStartedOrPassed = (dateStr, shift) => {
  if (!dateStr || !shift) return false;
  const todayStr = formatDateToISO(new Date());

  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  // Nếu là ngày hôm nay: so sánh giờ hiện tại với giờ bắt đầu của ca
  const currentMinutes = timeToMinutes(getCurrentVNTime());
  const startMinutes = timeToMinutes(shift.startTime);

  return currentMinutes >= startMinutes;
};

