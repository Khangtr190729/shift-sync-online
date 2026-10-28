// Utility formatters for Ca Làm Online

/**
 * Format currency to Vietnamese Đồng: e.g. 240.000 VNĐ
 */
export const formatVND = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 VNĐ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
};

/**
 * Get ISO week number and year for a given date
 */
export const getWeekNumberAndYear = (dateInput = new Date()) => {
  const date = new Date(dateInput);
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  // January 4 is always in week 1.
  const week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks
  const week =
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    );
  return { week, year: date.getFullYear() };
};

/**
 * Get the Monday of the week for a given date (or today) formatted as YYYY-MM-DD
 */
export const getMondayOfWeek = (dateInput = new Date()) => {
  const d = new Date(dateInput);
  const day = d.getDay();
  // In JS: 0 is Sunday, 1 is Monday...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return formatDateToISO(monday);
};

/**
 * Format Date object to YYYY-MM-DD
 */
export const formatDateToISO = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Add weeks to a date string YYYY-MM-DD
 */
export const addWeeks = (dateString, weeks = 1) => {
  const d = new Date(dateString);
  d.setDate(d.getDate() + weeks * 7);
  return formatDateToISO(d);
};

/**
 * Get 7 days of the week starting from Monday (YYYY-MM-DD)
 */
export const getDaysOfWeek = (mondayStr) => {
  const days = [];
  const vietnameseDays = [
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
    'Chủ Nhật'
  ];

  const base = new Date(mondayStr);

  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const isoDate = formatDateToISO(d);
    const dayOfMonth = d.getDate();
    const month = d.getMonth() + 1;

    days.push({
      dateStr: isoDate,
      dayName: vietnameseDays[i],
      shortDayName: i === 6 ? 'CN' : `T${i + 2}`,
      displayDate: `${String(dayOfMonth).padStart(2, '0')}/${String(month).padStart(2, '0')}`,
      fullDisplay: `${vietnameseDays[i]}, ${String(dayOfMonth).padStart(2, '0')}/${String(month).padStart(2, '0')}`,
      isToday: formatDateToISO(new Date()) === isoDate,
      isPast: isoDate < formatDateToISO(new Date()),
      rawDate: d
    });
  }

  return days;
};

/**
 * Format week range display: e.g. "20/10/2026 - 26/10/2026"
 */
export const formatWeekRange = (mondayStr) => {
  if (!mondayStr) return '';
  const mon = new Date(mondayStr);
  const sun = new Date(mondayStr);
  sun.setDate(mon.getDate() + 6);

  const formatD = (d) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

  return `${formatD(mon)} — ${formatD(sun)}`;
};

/**
 * Role badge labels & colors
 */
export const getRoleLabel = (role) => {
  switch (role) {
    case 'ADMIN':
      return { text: 'Chủ cửa hàng', color: 'bg-blue-50 text-[#0066cc] border-blue-200/70' };
    case 'MANAGER':
      return { text: 'Quản lý', color: 'bg-indigo-50 text-indigo-700 border-indigo-200/70' };
    case 'EMPLOYEE':
    default:
      return { text: 'Nhân viên', color: 'bg-emerald-50 text-emerald-700 border-emerald-200/70' };
  }
};

/**
 * Employment type labels
 */
export const getEmploymentTypeLabel = (type) => {
  switch (type) {
    case 'FULL_TIME':
      return { text: 'Toàn thời gian (Full-time)', badge: 'bg-purple-100 text-purple-700 border-purple-200' };
    case 'PART_TIME':
    default:
      return { text: 'Bán thời gian (Part-time)', badge: 'bg-amber-100 text-amber-700 border-amber-200' };
  }
};

/**
 * Convert time string "HH:MM" to minutes from 00:00
 */
export const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/**
 * Check if two shifts overlap in time:
 * Overlaps if and only if start1 < end2 && start2 < end1
 */
export const checkShiftOverlap = (shift1, shift2) => {
  if (!shift1 || !shift2) return false;
  let start1 = timeToMinutes(shift1.startTime);
  let end1 = timeToMinutes(shift1.endTime);
  let start2 = timeToMinutes(shift2.startTime);
  let end2 = timeToMinutes(shift2.endTime);

  // If overnight shift (ends next day)
  if (end1 <= start1) end1 += 1440;
  if (end2 <= start2) end2 += 1440;

  return start1 < end2 && start2 < end1;
};

