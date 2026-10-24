/**
 * Iraq Timezone ("Asia/Baghdad") Utilities
 * Ensures consistent, canonical date/time interpretation across doctors and patients
 * regardless of browser or server locale, eliminating off-by-one-day and double-conversion bugs.
 *
 * Designed with universal defensive parsing to prevent RangeError: Invalid time value
 * even when handling raw Firestore Timestamp objects, empty strings, or unformatted dates.
 */

export const IRAQ_TIMEZONE = 'Asia/Baghdad';

/**
 * Arabic months used in Iraq (Mesopotamian solar calendar standard)
 */
export const ARABIC_MONTHS_IRAQ = [
  'كانون الثاني',
  'شباط',
  'آذار',
  'نيسان',
  'أيار',
  'حزيران',
  'تموز',
  'آب',
  'أيلول',
  'تشرين الأول',
  'تشرين الثاني',
  'كانون الأول',
];

export const ARABIC_WEEKDAYS: Record<string, string> = {
  Sunday: 'الأحد',
  Monday: 'الإثنين',
  Tuesday: 'الثلاثاء',
  Wednesday: 'الأربعاء',
  Thursday: 'الخميس',
  Friday: 'الجمعة',
  Saturday: 'السبت',
};

/**
 * Safely parses any input (Date, string, number, Firestore Timestamp) into a valid JS Date.
 * Returns null if the value cannot be parsed into a finite, valid date.
 * NEVER throws RangeError or TypeError.
 */
export function parseAnyToValidDate(input: unknown): Date | null {
  if (input === null || input === undefined) return null;

  try {
    // 1. If already a JS Date
    if (input instanceof Date) {
      return !isNaN(input.getTime()) && isFinite(input.getTime()) ? input : null;
    }

    // 2. If number (epoch ms or epoch seconds)
    if (typeof input === 'number') {
      if (isNaN(input) || !isFinite(input)) return null;
      const ms = input < 1e11 ? input * 1000 : input;
      const d = new Date(ms);
      return !isNaN(d.getTime()) ? d : null;
    }

    // 3. If Firestore Timestamp object (has .toDate() or .seconds)
    if (typeof input === 'object') {
      const obj = input as Record<string, unknown>;
      if (typeof obj.toDate === 'function') {
        try {
          const d = (obj.toDate as () => unknown)();
          if (d instanceof Date && !isNaN(d.getTime())) return d;
        } catch {
          // ignore and continue
        }
      }
      if (typeof obj.seconds === 'number' && isFinite(obj.seconds)) {
        const d = new Date(obj.seconds * 1000);
        if (!isNaN(d.getTime())) return d;
      }
      if (typeof obj._seconds === 'number' && isFinite(obj._seconds)) {
        const d = new Date(obj._seconds * 1000);
        if (!isNaN(d.getTime())) return d;
      }
    }

    // 4. If string
    if (typeof input === 'string') {
      const str = input.trim();
      if (!str || str === 'undefined' || str === 'null' || str === '[object Object]') {
        return null;
      }

      // Check pure YYYY-MM-DD or YYYY/MM/DD
      const dateMatch = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(str);
      if (dateMatch) {
        const y = parseInt(dateMatch[1], 10);
        const m = parseInt(dateMatch[2], 10);
        const d = parseInt(dateMatch[3], 10);
        if (y >= 1970 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
          // Noon UTC guarantees correct calendar day representation in any timezone offset
          return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
        }
      }

      // Check numeric epoch string
      if (/^\d{10,13}$/.test(str)) {
        const num = Number(str);
        return parseAnyToValidDate(num);
      }

      // Attempt native Date parse
      const parsed = new Date(str);
      if (!isNaN(parsed.getTime()) && isFinite(parsed.getTime())) {
        return parsed;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Returns the current date in Iraq (Asia/Baghdad) as YYYY-MM-DD
 */
export function getIraqToday(): string {
  return getIraqDateString(new Date());
}

/**
 * Returns tomorrow's date in Iraq (Asia/Baghdad) as YYYY-MM-DD
 */
export function getIraqTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return getIraqDateString(d);
}

/**
 * Formats any JS Date or date-like input into YYYY-MM-DD string within Asia/Baghdad timezone.
 * Resilient against invalid time values.
 */
export function getIraqDateString(date: unknown = new Date()): string {
  try {
    const validDate = parseAnyToValidDate(date) || new Date();
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: IRAQ_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(validDate);
  } catch {
    const fallback = new Date();
    return fallback.toISOString().split('T')[0];
  }
}

/**
 * Returns the English day-of-week ('Sunday', 'Monday', ...) for a given YYYY-MM-DD,
 * ISO timestamp, Firestore Timestamp, or Date object in Iraq time.
 * Resilient against invalid time values, strings with times, and null/undefined.
 * NEVER throws RangeError.
 */
export function getIraqDayOfWeek(input: unknown): string {
  try {
    const dateObj = parseAnyToValidDate(input);
    if (!dateObj) return 'Sunday';

    return new Intl.DateTimeFormat('en-US', {
      timeZone: IRAQ_TIMEZONE,
      weekday: 'long',
    }).format(dateObj);
  } catch {
    return 'Sunday';
  }
}

/**
 * Checks if a given YYYY-MM-DD date or ISO timestamp is strictly in the past
 * relative to current Iraq time.
 */
export function isIraqDateInPast(input: unknown): boolean {
  if (!input) return false;
  try {
    const todayIraq = getIraqToday();
    const dateObj = parseAnyToValidDate(input);
    if (!dateObj) return false;
    const dateStr = getIraqDateString(dateObj);
    return dateStr < todayIraq;
  } catch {
    return false;
  }
}

/**
 * Formats a date string (YYYY-MM-DD or ISO 8601 timestamp), Firestore Timestamp, or Date object
 * into a user-friendly display in Iraq time.
 * e.g. "الخميس، 15 تشرين الأول 2026" or "Thursday, 15/10/2026"
 * NEVER throws RangeError.
 */
export function formatIraqDate(input: unknown, isAr: boolean = true): string {
  if (input === null || input === undefined || input === '') return '';
  try {
    const dateObj = parseAnyToValidDate(input);
    if (!dateObj) {
      // If it's a non-empty string that couldn't be parsed, safely return it if readable
      if (typeof input === 'string') {
        const s = input.trim();
        if (s && s !== '[object Object]' && s !== 'undefined' && s !== 'null') {
          return s;
        }
      }
      return '';
    }

    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: IRAQ_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(dateObj).split('-');

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return '';
    }

    const weekdayEn = getIraqDayOfWeek(dateObj);

    if (isAr) {
      const weekdayAr = ARABIC_WEEKDAYS[weekdayEn] || weekdayEn;
      const monthAr = ARABIC_MONTHS_IRAQ[month - 1] || String(month);
      return `${weekdayAr}، ${day} ${monthAr} ${year}`;
    } else {
      return `${weekdayEn}, ${day}/${month}/${year}`;
    }
  } catch (err) {
    console.warn('formatIraqDate safe fallback:', err);
    return typeof input === 'string' && input !== '[object Object]' ? input : '';
  }
}

/**
 * Formats time into clear localized Iraqi format (Asia/Baghdad)
 * Supports:
 * - Slot strings e.g. "09:30 AM" -> "09:30 صباحاً"
 * - 24h strings e.g. "14:30" -> "02:30 مساءً"
 * - ISO 8601 timestamps e.g. "2026-10-15T07:34:23.000Z" -> "10:34 صباحاً"
 * - Firestore Timestamps or Date objects
 * NEVER throws RangeError.
 */
export function formatIraqTime(input: unknown, isAr: boolean = true): string {
  if (input === null || input === undefined || input === '') return '';
  try {
    // If input is an object or timestamp or number, try parsing to Date first
    if (typeof input === 'object' || typeof input === 'number') {
      const dateObj = parseAnyToValidDate(input);
      if (dateObj) return formatTimeFromDate(dateObj, isAr);
      return '';
    }

    const str = String(input).trim();
    if (!str || str === '[object Object]' || str === 'undefined' || str === 'null') return '';

    // Check if it's already a 12-hour slot like "09:30 AM" or localized
    if (/\b(AM|PM)\b/i.test(str) || str.includes('صباحاً') || str.includes('مساءً')) {
      if (!isAr) return str.replace('صباحاً', 'AM').replace('مساءً', 'PM');
      return str
        .replace(/\bAM\b/i, 'صباحاً')
        .replace(/\bPM\b/i, 'مساءً');
    }

    // Check if it's 24-hour time like "14:30" or "09:15"
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
      const [hStr, mStr] = str.split(':');
      let hour = parseInt(hStr, 10);
      const minute = mStr;
      const period = hour >= 12 ? (isAr ? 'مساءً' : 'PM') : (isAr ? 'صباحاً' : 'AM');
      if (hour === 0) hour = 12;
      else if (hour > 12) hour -= 12;
      const formattedHour = hour < 10 ? `0${hour}` : `${hour}`;
      return `${formattedHour}:${minute} ${period}`;
    }

    // Check if string is parseable as a date/time
    const parsedDate = parseAnyToValidDate(str);
    if (parsedDate) {
      return formatTimeFromDate(parsedDate, isAr);
    }

    return str;
  } catch {
    return typeof input === 'string' && input !== '[object Object]' ? input : '';
  }
}

function formatTimeFromDate(date: Date, isAr: boolean): string {
  try {
    if (!date || isNaN(date.getTime())) return '';

    const timeFormatted = new Intl.DateTimeFormat('en-US', {
      timeZone: IRAQ_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);

    if (!isAr) return timeFormatted;

    return timeFormatted
      .replace(/\bAM\b/i, 'صباحاً')
      .replace(/\bPM\b/i, 'مساءً');
  } catch {
    return '';
  }
}

/**
 * Formats an ISO 8601 timestamp string or Firestore Timestamp into localized Iraq Date & Time
 */
export function formatIraqTimestamp(input: unknown, isAr: boolean = true): string {
  if (!input) return '';
  try {
    const dateObj = parseAnyToValidDate(input);
    if (!dateObj) return typeof input === 'string' && input !== '[object Object]' ? input : '';

    return new Intl.DateTimeFormat(isAr ? 'ar-IQ' : 'en-US', {
      timeZone: IRAQ_TIMEZONE,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(dateObj);
  } catch {
    return typeof input === 'string' && input !== '[object Object]' ? input : '';
  }
}
