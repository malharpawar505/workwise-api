/**
 * Calculate hours between two timestamps
 */
function calculateHours(loginTime, logoutTime) {
  if (!loginTime || !logoutTime) return 0;
  const login = new Date(loginTime);
  const logout = new Date(logoutTime);
  const diffMs = logout - login;
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
}

/**
 * Get status based on hours worked
 */
function getStatus(hours, requiredHours = 9) {
  if (hours === 0) return 'absent';
  if (hours < requiredHours) return 'deficit';
  if (hours === requiredHours) return 'complete';
  return 'extra';
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
function isWeekend(date) {
  const d = new Date(date);
  const day = d.getDay();
  return day === 0 || day === 6;
}

/**
 * Get working days in a month (excluding weekends)
 */
function getWorkingDaysInMonth(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    if (!isWeekend(date)) workingDays++;
  }
  return workingDays;
}

/**
 * Get working days up to today in a month
 */
function getWorkingDaysTillToday(year, month) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  
  let endDay;
  if (year === currentYear && month === currentMonth) {
    endDay = today.getDate();
  } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
    endDay = new Date(year, month, 0).getDate();
  } else {
    endDay = 0; // Future month
  }

  let workingDays = 0;
  for (let day = 1; day <= endDay; day++) {
    const date = new Date(year, month - 1, day);
    if (!isWeekend(date)) workingDays++;
  }
  return workingDays;
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Get today's date in YYYY-MM-DD
 */
function getToday() {
  return formatDate(new Date());
}

module.exports = {
  calculateHours,
  getStatus,
  isWeekend,
  getWorkingDaysInMonth,
  getWorkingDaysTillToday,
  formatDate,
  getToday
};
