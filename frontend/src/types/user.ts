// User service request/response types

// Update Profile Request
export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
}

// Update Password Request
export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Generic API Response
export interface ApiResponse {
  success: boolean;
  message: string;
}