/**
 * Date Formatting Utility
 * Provides consistent date formatting across the IEM Connect application
 */

/**
 * Format a date string to dd/mm/yyyy format
 * @param dateString - ISO date string, Date object, or any parseable date format
 * @returns Formatted date string as "dd/mm/yyyy" or empty string if invalid
 * 
 * @example
 * formatDateDDMMYYYY("2025-12-24") // "24/12/2025"
 * formatDateDDMMYYYY("2025-12-24T10:30:00Z") // "24/12/2025"
 * formatDateDDMMYYYY(new Date(2025, 11, 24)) // "24/12/2025"
 * formatDateDDMMYYYY(null) // ""
 * formatDateDDMMYYYY(undefined) // ""
 */
export function formatDateDDMMYYYY(dateString: string | Date | null | undefined): string {
  if (!dateString) return "";

  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "";
    }

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return "";
  }
}

/**
 * Format a date string to dd/mm/yyyy with time (HH:mm)
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string as "dd/mm/yyyy HH:mm" or empty string if invalid
 * 
 * @example
 * formatDateTimeDDMMYYYY("2025-12-24T10:30:00Z") // "24/12/2025 10:30"
 */
export function formatDateTimeDDMMYYYY(dateString: string | Date | null | undefined): string {
  if (!dateString) return "";

  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      return "";
    }

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return "";
  }
}

/**
 * Format a date range (e.g., "24/12/2025 - 26/12/2025" or just "24/12/2025" if same day)
 * @param startDate - Start date string
 * @param endDate - End date string
 * @returns Formatted date range string
 */
export function formatDateRange(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined
): string {
  const start = formatDateDDMMYYYY(startDate);
  const end = formatDateDDMMYYYY(endDate);

  if (!start) return "";
  if (!end || start === end) return start;

  return `${start} - ${end}`;
}
