// Simple date utility functions to replace moment.js
// This provides basic date formatting without external dependencies

export const formatDate = (dateString, format = 'YYYY-MM-DD') => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'MMM D, YYYY':
      return `${getMonthName(date.getMonth())} ${day}, ${year}`;
    case 'MMMM D, YYYY':
      return `${getMonthName(date.getMonth())} ${day}, ${year}`;
    case 'dddd, MMMM D, YYYY':
      return `${getDayName(date.getDay())}, ${getMonthName(date.getMonth())} ${day}, ${year}`;
    case 'hh:mm A':
      const hour12 = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes} ${ampm}`;
    case 'hh:mm:ss A':
      const hour12_2 = hours % 12 || 12;
      const ampm2 = hours >= 12 ? 'PM' : 'AM';
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${hour12_2}:${minutes}:${seconds} ${ampm2}`;
    default:
      return `${year}-${month}-${day}`;
  }
};

export const getMonthName = (monthIndex) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex] || '';
};

export const getDayName = (dayIndex) => {
  const days = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];
  return days[dayIndex] || '';
};

export const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const getCurrentDate = () => new Date();

export const isSameMonth = (date1, date2) => {
  if (!date1 || !date2) return false;
  
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth();
};

export const isBefore = (date1, date2) => {
  if (!date1 || !date2) return false;
  return new Date(date1) < new Date(date2);
};

export const clone = (date) => new Date(date);
