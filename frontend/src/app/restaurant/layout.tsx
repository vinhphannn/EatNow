"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useRestaurantAuth } from "@/contexts/AuthContext";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Switch as MuiSwitch,
  FormControlLabel,
  Avatar,
  Typography,
    Box,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Chip
} from "@mui/material";
  import { BellIcon, Bars3Icon, ChartBarIcon, InboxStackIcon, Squares2X2Icon, UsersIcon, TagIcon, PresentationChartBarIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import RestaurantStatusToggle from "@/components/restaurant/RestaurantStatusToggle";
import NotificationDropdown from "@/components/NotificationDropdown";
import { useSocket } from "@/hooks/useSocket";

export default function RestaurantLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Use restaurant auth hook
  const { isAuthenticated, isLoading, user } = useRestaurantAuth();
  
  // Socket.IO connection
  const { socket, connected } = useSocket(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001');

  // Debug Socket.IO connection status
  useEffect(() => {
    console.log('🔌 Restaurant Socket.IO Status:', {
      socket: socket ? 'Connected' : 'Not connected',
      connected: connected,
      restaurantId: restaurant?._id || restaurant?.id || restaurant?.restaurantId,
      isAuthenticated: isAuthenticated,
      user: user?.email || 'No user'
    });
  }, [socket, connected, restaurant, isAuthenticated, user]);

  // Join restaurant room when connected
  useEffect(() => {
    if (socket && connected && restaurant) {
      const restaurantId = restaurant._id || restaurant.id || restaurant?.restaurantId;
      if (restaurantId) {
        console.log('🏪 Attempting to join restaurant room:', restaurantId);
        socket.emit('join_restaurant', restaurantId);
        console.log('✅ Restaurant room join request sent');
      } else {
        console.error('❌ Restaurant ID not found:', restaurant);
      }
    } else {
      if (!socket) {
        console.error('❌ Socket not available');
      }
      if (!connected) {
        console.error('❌ Socket not connected');
      }
      if (!restaurant) {
        console.warn('⚠️ Restaurant data not loaded yet');
      }
    }
  }, [socket, connected, restaurant]);

  // Note: New order notifications are now handled by NotificationDropdown component
  
  // Cookie-based auth only
  const token = null as any;

  // Redirect logic: unauthenticated -> login, wrong role -> unauthorized
  useEffect(() => {
    if (isLoading) return;
    if (pathname === '/restaurant/login') return;
    if (!isAuthenticated) {
      router.push('/restaurant/login');
      return;
    }
    if (user && user.role !== 'restaurant') {
      router.push('/unauthorized');
      return;
    }
  }, [isAuthenticated, isLoading, router, pathname, user]);
  
  const isActive = (href: string) => pathname?.startsWith(href) ? "bg-orange-50 text-orange-700 border-r-2 border-orange-500" : "hover:bg-gray-50";

  // Load restaurant data after authentication
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const loadRestaurantData = async () => {
      try {
        console.log('🔍 Loading restaurant data...');
        console.log('🔍 API URL:', `${api}/api/v1/restaurants/mine`);
        
        // Cookie-based: luôn lấy từ /restaurants/mine cho an toàn
        const r = await fetch(`${api}/api/v1/restaurants/mine`, { credentials: 'include' });
        
        console.log('🔍 Restaurant API response:', {
          status: r.status,
          statusText: r.statusText,
          ok: r.ok
        });
        
        if (r.ok) {
          const data = await r.json();
          console.log('🔍 Restaurant data loaded:', data);
          setRestaurant(data || null);
        } else {
          console.error('❌ Restaurant API error:', r.status, r.statusText);
          setRestaurant(null);
        }
      } catch (error) {
        console.error('❌ Load restaurant data error:', error);
        setRestaurant(null);
      }
    };

    loadRestaurantData();
  }, [isAuthenticated, user, api]);

  // Load today's stats
  useEffect(() => {
    if (!restaurant?._id && !restaurant?.id) return;

    const loadTodayStats = async () => {
      try {
        const restaurantId = restaurant._id || restaurant.id;
        console.log('📊 Loading today stats for restaurant:', restaurantId);
        
        const response = await fetch(`${api}/api/v1/restaurants/${restaurantId}/stats/today`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Today stats loaded:', data);
          setStats(data);
        } else if (response.status === 404) {
          // API not implemented yet, set default values
          console.log('📊 Stats API not implemented, using defaults');
          setStats({
            todayOrders: 0,
            todayRevenue: 0,
            pendingOrders: 0
          });
        } else {
          console.error('❌ Failed to load today stats:', response.status);
          setStats({
            todayOrders: 0,
            todayRevenue: 0,
            pendingOrders: 0
          });
        }
      } catch (error) {
        console.error('❌ Error loading today stats:', error);
        setStats({
          todayOrders: 0,
          todayRevenue: 0,
          pendingOrders: 0
        });
      }
    };

    loadTodayStats();
  }, [restaurant, api]);


  const displayName = useMemo(() => restaurant?.name || user?.email || "Nhà hàng", [restaurant, user]);
  const avatarText = useMemo(() => (restaurant?.name || user?.name || user?.email || "?").slice(0,1).toUpperCase(), [restaurant, user]);

  // Navigation menu items
  const navigation = [
    {
      name: 'Tổng quan',
      href: '/restaurant/dashboard',
      icon: '📊',
      description: 'Dashboard tổng quan'
    },
    {
      name: 'Đơn hàng',
      href: '/restaurant/orders',
      icon: '📦',
      description: 'Quản lý đơn hàng',
      badge: stats?.pendingOrders || 0
    },
    {
      name: 'Thực đơn',
      href: '/restaurant/menu',
      icon: '🍽️',
      description: 'Quản lý món ăn'
    },
    {
      name: 'Ví điện tử',
      href: '/restaurant/wallet',
      icon: '💳',
      description: 'Quản lý ví và giao dịch'
    },
    {
      name: 'Khách hàng',
      href: '/restaurant/customers',
      icon: '👥',
      description: 'Quản lý khách hàng'
    },
    {
      name: 'Khuyến mãi',
      href: '/restaurant/promotions',
      icon: '🎉',
      description: 'Quản lý khuyến mãi'
    },
    {
      name: 'Báo cáo',
      href: '/restaurant/stats',
      icon: '📈',
      description: 'Thống kê & báo cáo'
    },
    {
      name: 'Cài đặt',
      href: '/restaurant/profile',
      icon: '⚙️',
      description: 'Cài đặt nhà hàng'
    }
  ];

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // If on login page, render children directly (login page will handle its own UI)
  if (pathname === '/restaurant/login') {
    return <>{children}</>;
  }

  // Don't render layout if not authenticated and not on login page
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang chuyển hướng đến trang đăng nhập...</p>
        </div>
      </div>
    );
  }
  if (user && user.role !== 'restaurant') {
    // Wrong role; show neutral loader while redirect occurs in effect
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang chuyển hướng do không đủ quyền...</p>
        </div>
      </div>
    );
  }

  const theme = createTheme({
    palette: {
      primary: { main: "#f97316" },
    },
    shape: { borderRadius: 12 },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: MUI Drawer */}
      {(() => {
        const NavIcon = (href: string) => {
          if (href.includes("dashboard")) return <ChartBarIcon width={20} />;
          if (href.includes("orders")) return <InboxStackIcon width={20} />;
          if (href.includes("menu")) return <Squares2X2Icon width={20} />;
          if (href.includes("customers")) return <UsersIcon width={20} />;
          if (href.includes("promotions")) return <TagIcon width={20} />;
          if (href.includes("stats") || href.includes("analytics")) return <PresentationChartBarIcon width={20} />;
          if (href.includes("profile")) return <Cog6ToothIcon width={20} />;
          return <Squares2X2Icon width={20} />;
        };

        const SidebarContent = (
          <Box sx={{ width: 280, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Logo & Restaurant Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, px: 2, borderBottom: theme => `1px solid ${theme.palette.divider}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1, background: 'linear-gradient(90deg, #f97316, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="#fff" fontWeight={700}>E</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>EatNow</Typography>
                  <Typography variant="caption" color="text.secondary">Restaurant</Typography>
                </Box>
              </Box>
            </Box>


            {/* Quick Stats */}
            <Box sx={{ px: 2, py: 2, borderBottom: theme => `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                Thống kê hôm nay
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 1.5, 
                  borderRadius: 2, 
                  backgroundColor: 'warning.light',
                  background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)'
                }}>
                  <Typography variant="h5" color="warning.dark" sx={{ fontWeight: 700 }}>
                    {stats?.todayOrders || 0}
                  </Typography>
                  <Typography variant="caption" color="warning.dark" sx={{ fontWeight: 500 }}>
                    Đơn hàng
                  </Typography>
                </Box>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 1.5, 
                  borderRadius: 2, 
                  backgroundColor: 'success.light',
                  background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)'
                }}>
                  <Typography variant="h5" color="success.dark" sx={{ fontWeight: 700 }}>
                    ₫{(stats?.todayRevenue || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="success.dark" sx={{ fontWeight: 500 }}>
                    Doanh thu
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Navigation */}
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              <List sx={{ py: 1 }}>
                {navigation.map((item) => {
                  const active = Boolean(pathname?.startsWith(item.href));
                  return (
                    <ListItemButton key={item.name} component={Link as any} href={item.href} selected={active} sx={{
                      borderRight: active ? theme => `2px solid ${theme.palette.primary.main}` : 'none'
                    }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>{NavIcon(item.href)}</ListItemIcon>
                      <ListItemText primary={item.name} secondary={item.description} primaryTypographyProps={{ variant: 'body2' }} secondaryTypographyProps={{ variant: 'caption' }} />
                      {(item.badge && item.badge > 0) ? (
                        <Chip size="small" color="error" label={item.badge} />
                      ) : null}
                    </ListItemButton>
                  );
                })}
              </List>
            </Box>

            <Divider />
            {/* Footer */}
            <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'warning.light', width: 32, height: 32 }}>
                <Typography variant="caption" color="warning.dark">{avatarText}</Typography>
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" noWrap>{displayName}</Typography>
                <Typography variant="caption" color="text.secondary">Quản lý nhà hàng</Typography>
              </Box>
            </Box>
          </Box>
        );

        return (
          <>
            {/* Mobile temporary drawer */}
            <Drawer
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              ModalProps={{ keepMounted: true }}
              sx={{ display: { xs: 'block', lg: 'none' } }}
            >
              {SidebarContent}
            </Drawer>
            {/* Desktop permanent drawer */}
            <Drawer
              variant="permanent"
              open
              sx={{ 
                display: { xs: 'none', lg: 'block' }, 
                '& .MuiDrawer-paper': { 
                  position: 'fixed', 
                  height: '100vh',
                  overflowY: 'auto'
                } 
              }}
            >
              {SidebarContent}
            </Drawer>
          </>
        );
      })()}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-[280px]">
        {/* Top header */}
        <AppBar color="inherit" position="sticky" elevation={0} sx={{ borderBottom: theme => `1px solid ${theme.palette.divider}` }}>
          <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton aria-label="Mở menu" onClick={() => setSidebarOpen(true)} sx={{ display: { lg: 'none' } }}>
                <Bars3Icon width={20} />
              </IconButton>
              <Box>
                <Typography variant="h6" component="h1">
                  {navigation.find(item => pathname?.startsWith(item.href))?.name || 'Dashboard'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {navigation.find(item => pathname?.startsWith(item.href))?.description || 'Quản lý nhà hàng'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Notifications Dropdown */}
              <NotificationDropdown restaurantId={restaurant?._id || restaurant?.id} />

              {/* Restaurant status toggle */}
              <RestaurantStatusToggle
                restaurant={restaurant}
                onStatusChange={async (newStatus) => {
                  try {
                    const res = await fetch(`${api}/api/v1/restaurants/mine`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ isOpen: newStatus })
                    });
                    if (res.ok) {
                      const updated = await res.json();
                      setRestaurant((prev: any) => ({ ...(prev||{}), ...updated }));
                    } else {
                      throw new Error('Failed to update status');
                    }
                  } catch (error) {
                    throw error;
                  }
                }}
              />

              {/* User menu */}
              {isAuthenticated && user?.role === 'restaurant' ? (
                <Link href="/restaurant/profile" className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100">
                  <Avatar sx={{ bgcolor: 'warning.light', width: 32, height: 32 }}>
                    <Typography variant="caption" color="warning.dark">{avatarText}</Typography>
                  </Avatar>
                  <div className="hidden sm:block">
                    <Typography variant="body2" fontWeight={600}>{displayName}</Typography>
                    <Typography variant="caption" color="text.secondary">Nhà hàng</Typography>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center space-x-2" />
              )}
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Container maxWidth="lg" sx={{ py: 3 }}>
            {children}
          </Container>
        </main>
      </div>
    </div>
    </ThemeProvider>
  );
}


