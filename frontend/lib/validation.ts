// Validation utility functions

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === "") {
    return { isValid: false, error: "Email is required" };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }
  
  return { isValid: true };
};

// Password validation
export const validatePassword = (password: string, minLength: number = 6): ValidationResult => {
  if (!password || password.trim() === "") {
    return { isValid: false, error: "Password is required" };
  }
  
  if (password.length < minLength) {
    return { isValid: false, error: `Password must be at least ${minLength} characters` };
  }
  
  return { isValid: true };
};

// Name validation
export const validateName = (name: string): ValidationResult => {
  if (!name || name.trim() === "") {
    return { isValid: false, error: "Name is required" };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: "Name must be at least 2 characters" };
  }
  
  if (name.trim().length > 255) {
    return { isValid: false, error: "Name must be less than 255 characters" };
  }
  
  // Allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(name.trim())) {
    return { isValid: false, error: "Name can only contain letters, spaces, hyphens, and apostrophes" };
  }
  
  return { isValid: true };
};

// Matric number validation (9 characters)
export const validateMatricNumber = (matric: string): ValidationResult => {
  if (!matric || matric.trim() === "") {
    return { isValid: false, error: "Matric number is required" };
  }
  
  if (matric.length !== 9) {
    return { isValid: false, error: "Matric number must be exactly 9 characters" };
  }
  
  // Allow alphanumeric
  const matricRegex = /^[A-Za-z0-9]+$/;
  if (!matricRegex.test(matric)) {
    return { isValid: false, error: "Matric number can only contain letters and numbers" };
  }
  
  return { isValid: true };
};

// Membership number validation (6 characters)
export const validateMembershipNumber = (membership: string): ValidationResult => {
  if (!membership || membership.trim() === "") {
    return { isValid: false, error: "Membership number is required" };
  }
  
  if (membership.length !== 6) {
    return { isValid: false, error: "Membership number must be exactly 6 characters" };
  }
  
  // Allow alphanumeric
  const membershipRegex = /^[A-Za-z0-9]+$/;
  if (!membershipRegex.test(membership)) {
    return { isValid: false, error: "Membership number can only contain letters and numbers" };
  }
  
  return { isValid: true };
};

// Phone number validation
export const validatePhone = (phone: string): ValidationResult => {
  if (!phone || phone.trim() === "") {
    return { isValid: false, error: "Phone number is required" };
  }
  
  // Allow digits, spaces, hyphens, parentheses, and + for international format
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  if (!phoneRegex.test(phone.trim())) {
    return { isValid: false, error: "Please enter a valid phone number" };
  }
  
  // Remove non-digits for length check
  const digitsOnly = phone.replace(/\D/g, "");
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return { isValid: false, error: "Phone number must be between 10 and 15 digits" };
  }
  
  return { isValid: true };
};

// Date validation
export const validateDate = (date: string, fieldName: string = "Date"): ValidationResult => {
  if (!date || date.trim() === "") {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: `Please enter a valid ${fieldName.toLowerCase()}` };
  }
  
  // Check year is 4 digits
  const year = dateObj.getFullYear();
  if (year.toString().length !== 4) {
    return { isValid: false, error: "Year must be 4 digits" };
  }
  
  // Check date is not in the past (for start dates)
  if (dateObj < new Date(new Date().setHours(0, 0, 0, 0))) {
    return { isValid: false, error: `${fieldName} cannot be in the past` };
  }
  
  return { isValid: true };
};

// End date validation (must be after start date)
export const validateEndDate = (startDate: string, endDate: string): ValidationResult => {
  if (!endDate || endDate.trim() === "") {
    return { isValid: false, error: "End date is required" };
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(end.getTime())) {
    return { isValid: false, error: "Please enter a valid end date" };
  }
  
  if (end < start) {
    return { isValid: false, error: "End date must be after start date" };
  }
  
  return { isValid: true };
};

// Time validation
export const validateTime = (time: string, fieldName: string = "Time"): ValidationResult => {
  if (!time || time.trim() === "") {
    return { isValid: true }; // Time is optional
  }
  
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    return { isValid: false, error: `Please enter a valid ${fieldName.toLowerCase()} (HH:MM format)` };
  }
  
  return { isValid: true };
};

// End time validation (must be after start time if same date)
export const validateEndTime = (startDate: string, endDate: string, startTime: string, endTime: string): ValidationResult => {
  if (!endTime || endTime.trim() === "") {
    return { isValid: true }; // Time is optional
  }
  
  if (!startTime || startTime.trim() === "") {
    return { isValid: true }; // If start time is not set, end time is valid
  }
  
  // If dates are the same, end time must be after start time
  if (startDate === endDate) {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (endMinutes <= startMinutes) {
      return { isValid: false, error: "End time must be after start time" };
    }
  }
  
  return { isValid: true };
};

// Cost validation
export const validateCost = (cost: string): ValidationResult => {
  if (!cost || cost.trim() === "") {
    return { isValid: true }; // Cost is optional
  }
  
  const costNum = parseFloat(cost);
  if (isNaN(costNum)) {
    return { isValid: false, error: "Cost must be a valid number" };
  }
  
  if (costNum < 0) {
    return { isValid: false, error: "Cost cannot be negative" };
  }
  
  if (costNum > 999999.99) {
    return { isValid: false, error: "Cost is too large (maximum: 999,999.99)" };
  }
  
  // Check decimal places (max 2)
  const decimalPlaces = cost.split(".")[1]?.length || 0;
  if (decimalPlaces > 2) {
    return { isValid: false, error: "Cost can have maximum 2 decimal places" };
  }
  
  return { isValid: true };
};

// Title validation
export const validateTitle = (title: string): ValidationResult => {
  if (!title || title.trim() === "") {
    return { isValid: false, error: "Title is required" };
  }
  
  if (title.trim().length < 3) {
    return { isValid: false, error: "Title must be at least 3 characters" };
  }
  
  if (title.trim().length > 255) {
    return { isValid: false, error: "Title must be less than 255 characters" };
  }
  
  return { isValid: true };
};

// Description validation
export const validateDescription = (description: string): ValidationResult => {
  if (!description || description.trim() === "") {
    return { isValid: true }; // Description is optional
  }
  
  if (description.length > 5000) {
    return { isValid: false, error: "Description must be less than 5000 characters" };
  }
  
  return { isValid: true };
};

// Targeted participants validation
export const validateTargetedParticipants = (targeted: string): ValidationResult => {
  if (!targeted || targeted.trim() === "") {
    return { isValid: true }; // Optional field
  }
  
  if (targeted.length > 255) {
    return { isValid: false, error: "Targeted participants must be less than 255 characters" };
  }
  
  return { isValid: true };
};

// Attendance code validation
export const validateAttendanceCode = (code: string): ValidationResult => {
  if (!code || code.trim() === "") {
    return { isValid: false, error: "Attendance code is required" };
  }
  
  // Remove hyphens for validation
  const codeWithoutHyphens = code.replace(/-/g, "");
  
  if (codeWithoutHyphens.length !== 8) {
    return { isValid: false, error: "Attendance code must be 8 characters" };
  }
  
  // Allow alphanumeric
  const codeRegex = /^[A-Za-z0-9]+$/;
  if (!codeRegex.test(codeWithoutHyphens)) {
    return { isValid: false, error: "Attendance code can only contain letters and numbers" };
  }
  
  return { isValid: true };
};

// Confirm password validation
export const validateConfirmPassword = (password: string, confirmPassword: string): ValidationResult => {
  if (!confirmPassword || confirmPassword.trim() === "") {
    return { isValid: false, error: "Please confirm your password" };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, error: "Passwords do not match" };
  }
  
  return { isValid: true };
};

// Faculty validation
export const validateFaculty = (faculty: string): ValidationResult => {
  if (!faculty || faculty.trim() === "") {
    return { isValid: false, error: "Faculty is required" };
  }
  
  const validFaculties = [
    "Azman Hashim International Business School (AHIBS)",
    "Faculty of Artificial Intelligence (FAI)",
    "Faculty of Built Environment and Surveying",
    "Faculty of Chemical & Energy Engineering",
    "Faculty of Computing",
    "Faculty of Educational Sciences and Technology (FEST)",
    "Faculty of Electrical Engineering",
    "Faculty of Management",
    "Faculty of Mechanical Engineering",
    "Faculty of Science",
    "Faculty of Social Sciences and Humanities",
    "Malaysia-Japan International Institute of Technology (MJIIT)",
  ];
  
  if (!validFaculties.includes(faculty)) {
    return { isValid: false, error: "Please select a valid faculty" };
  }
  
  return { isValid: true };
};

// File validation
export const validateFile = (
  file: File | null,
  allowedTypes: string[],
  maxSizeMB: number = 10
): ValidationResult => {
  if (!file) {
    return { isValid: true }; // File is optional
  }
  
  const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
  const allowedExtensions = allowedTypes.map(type => type.replace(".", "").toLowerCase());
  
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }
  
  return { isValid: true };
};

// Bio validation
export const validateBio = (bio: string): ValidationResult => {
  if (!bio || bio.trim() === "") {
    return { isValid: true }; // Bio is optional
  }
  
  if (bio.length > 1000) {
    return { isValid: false, error: "Bio must be less than 1000 characters" };
  }
  
  return { isValid: true };
};

// TOTP code validation (6 digits)
export const validateTOTPCode = (code: string): ValidationResult => {
  if (!code || code.trim() === "") {
    return { isValid: false, error: "Verification code is required" };
  }
  
  if (code.length !== 6) {
    return { isValid: false, error: "Verification code must be 6 digits" };
  }
  
  const codeRegex = /^[0-9]{6}$/;
  if (!codeRegex.test(code)) {
    return { isValid: false, error: "Verification code must contain only numbers" };
  }
  
  return { isValid: true };
};

