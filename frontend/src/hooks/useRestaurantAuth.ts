import { useRoleAuth } from './useRoleAuth';

export const useRestaurantAuth = () => {
  return useRoleAuth({
    role: 'restaurant',
    loginPath: '/restaurant/login',
    enableLogging: false
  });
};
