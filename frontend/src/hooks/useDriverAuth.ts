import { useRoleAuth } from './useRoleAuth';

export const useDriverAuth = () => {
  return useRoleAuth({
    role: 'driver',
    loginPath: '/driver/login',
    enableLogging: true // Enable logging for driver auth debugging
  });
};