import { useRoleAuth } from './useRoleAuth';

export const useCustomerAuth = () => {
  return useRoleAuth({
    role: 'customer',
    loginPath: '/customer/login',
    enableLogging: false
  });
};
