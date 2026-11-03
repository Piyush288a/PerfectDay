/**
 * Safe, timezone-independent Date Utilities for PerfectDay
 *
 * Ensures calendar dates (e.g. "2026-11-22") are parsed, displayed, and formatted
 * consistently across UTC, IST (UTC+5:30), EST (UTC-5), and all timezones
 * without off-by-one errors or UTC shifts.
 */

/**
 * Parses a date value (Date, ISO string, or "YYYY-MM-DD") into a local Date object
 * at 00:00:00.000 local calendar time.
 * @param {string|Date|null|undefined} val
 * @returns {Date|null}
 */
export const parseLocalDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return new Date(val.getFullYear(), val.getMonth(), val.getDate(), 0, 0, 0, 0);
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    // Handle "YYYY-MM-DD" or "YYYY-MM-DDT..."
    const datePart = trimmed.split("T")[0];
    const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // 0-indexed
      const day = parseInt(match[3], 10);
      return new Date(year, month, day, 0, 0, 0, 0);
    }
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }
  return null;
};

/**
 * Formats a local date or string into "YYYY-MM-DD" without UTC day shifting.
 * @param {Date|string} val
 * @returns {string}
 */
export const formatDateISO = (val) => {
  if (!val) return "";
  const d = parseLocalDate(val);
  if (!d) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Returns today's date normalized to 00:00:00.000 in local time.
 * @returns {Date}
 */
export const getTodayLocal = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
};

/**
 * Returns tomorrow's date normalized to 00:00:00.000 in local time.
 * @returns {Date}
 */
export const getTomorrowLocal = () => {
  const today = getTodayLocal();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
};

/**
 * Formats a date for display (e.g. "Nov 22" or "Nov 22, 2026").
 * @param {string|Date} val
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export const formatDateDisplay = (val, options = { month: "short", day: "numeric" }) => {
  const d = parseLocalDate(val);
  if (!d) return "";
  return d.toLocaleDateString("en-US", options);
};

/**
 * Compares two date values by calendar day.
 * Returns -1 if d1 < d2, 0 if same day, 1 if d1 > d2.
 * @param {string|Date} d1
 * @param {string|Date} d2
 * @returns {number}
 */
export const compareDays = (d1, d2) => {
  const date1 = parseLocalDate(d1);
  const date2 = parseLocalDate(d2);
  if (!date1 || !date2) return 0;
  const t1 = date1.getTime();
  const t2 = date2.getTime();
  return t1 < t2 ? -1 : t1 > t2 ? 1 : 0;
};
