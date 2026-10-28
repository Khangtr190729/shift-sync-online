/**
 * Schedule Service Facade
 * 
 * Re-exports modular schedule domains:
 * 1. scheduleValidation.js: Immutability validation for historical shifts
 * 2. payrollProcessor.js: Wage calculation & cross-branch conflict verification
 * 3. autoScheduleEngine.js: Heuristic greedy auto-scheduling algorithm
 * 4. attendanceService.js: Attendance evaluation, penalties & cascade deletion
 */

export { validatePassedShiftImmutability } from './schedule/scheduleValidation.js';
export {
  processAssignmentsAndSalary,
  calculateSalarySummaryFromAssignments,
} from './schedule/payrollProcessor.js';
export {
  calculateShiftStaffTargets,
  generateAutoSchedule,
} from './schedule/autoScheduleEngine.js';
export {
  evaluateShiftAttendance,
  removeMemberFutureShifts,
} from './schedule/attendanceService.js';
