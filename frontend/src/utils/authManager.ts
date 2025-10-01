export class AuthManager {
  // Driver Auth
  static setDriverAuth(token: string, user: any) {
    localStorage.setItem('driver_token', token);
    localStorage.setItem('driver_user', JSON.stringify(user));
    localStorage.setItem('driver_role', 'driver');
  }

  static getDriverAuth() {
    return {
      token: localStorage.getItem('driver_token'),
      user: JSON.parse(localStorage.getItem('driver_user') || '{}'),
      role: localStorage.getItem('driver_role')
    };
  }

  static clearDriverAuth() {
    localStorage.removeItem('driver_token');
    localStorage.removeItem('driver_user');
    localStorage.removeItem('driver_role');
  }

  // Customer Auth
  static setCustomerAuth(token: string, user: any) {
    localStorage.setItem('customer_token', token);
    localStorage.setItem('customer_user', JSON.stringify(user));
    localStorage.setItem('customer_role', 'customer');
  }

  static getCustomerAuth() {
    return {
      token: localStorage.getItem('customer_token'),
      user: JSON.parse(localStorage.getItem('customer_user') || '{}'),
      role: localStorage.getItem('customer_role')
    };
  }

  static clearCustomerAuth() {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_user');
    localStorage.removeItem('customer_role');
  }

  // Restaurant Auth
  static setRestaurantAuth(token: string, user: any) {
    localStorage.setItem('restaurant_token', token);
    localStorage.setItem('restaurant_user', JSON.stringify(user));
    localStorage.setItem('restaurant_role', 'restaurant');
  }

  static getRestaurantAuth() {
    return {
      token: localStorage.getItem('restaurant_token'),
      user: JSON.parse(localStorage.getItem('restaurant_user') || '{}'),
      role: localStorage.getItem('restaurant_role')
    };
  }

  static clearRestaurantAuth() {
    localStorage.removeItem('restaurant_token');
    localStorage.removeItem('restaurant_user');
    localStorage.removeItem('restaurant_role');
  }

  // Admin Auth
  static setAdminAuth(token: string, user: any) {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(user));
    localStorage.setItem('admin_role', 'admin');
  }

  static getAdminAuth() {
    return {
      token: localStorage.getItem('admin_token'),
      user: JSON.parse(localStorage.getItem('admin_user') || '{}'),
      role: localStorage.getItem('admin_role')
    };
  }

  static clearAdminAuth() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_role');
  }

  // Clear all auth
  static clearAllAuth() {
    this.clearDriverAuth();
    this.clearCustomerAuth();
    this.clearRestaurantAuth();
    this.clearAdminAuth();
  }
}
