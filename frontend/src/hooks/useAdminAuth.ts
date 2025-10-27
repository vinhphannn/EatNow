import { useRoleAuth } from './useRoleAuth';

export const useAdminAuth = () => {
  return useRoleAuth({
    role: 'admin',
    loginPath: '/admin/login',
    enableLogging: false
  });
};
