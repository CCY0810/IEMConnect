import api from "./api";

// Get unverified users (admin only)
export const getUnverifiedUsers = async () => {
  const response = await api.get("/auth/unverified-users");
  return response.data;
};

// Verify a user (admin only)
export const verifyUser = async (userId: number) => {
  const response = await api.post("/auth/verify-user", { userId });
  return response.data;
};

// ========== ADMIN INVITE FUNCTIONS ==========

// Create admin invite
export const createAdminInvite = async (email: string, name?: string) => {
  const response = await api.post('/admin/invite', { email, name });
  return response.data;
};

// Validate invite token (public)
export const validateInviteToken = async (token: string) => {
  const response = await api.get(`/admin/invite/${token}`);
  return response.data;
};

// Register with admin invite (public)
export const registerWithInvite = async (data: {
  token: string;
  name: string;
  password: string;
  membership_number: string;
  matric_number: string;
  faculty: string;
}) => {
  const response = await api.post('/admin/register', data);
  return response.data;
};

// Get all users (admin only)
export const getAllUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

// Get pending admin invites
export const getPendingInvites = async () => {
  const response = await api.get('/admin/invites');
  return response.data;
};

// ========== ROLE MANAGEMENT FUNCTIONS ==========

// Promote member to admin
export const promoteToAdmin = async (userId: number) => {
  const response = await api.post('/admin/promote', { userId });
  return response.data;
};

// Demote admin to member
export const demoteToMember = async (userId: number) => {
  const response = await api.post('/admin/demote', { userId });
  return response.data;
};

// Revoke admin invite
export const revokeInvite = async (inviteId: number) => {
  const response = await api.delete(`/admin/invite/${inviteId}`);
  return response.data;
};
