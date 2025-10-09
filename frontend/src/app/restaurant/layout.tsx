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

export default function RestaurantLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Use restaurant auth hook
  const { isAuthenticated, isLoading, user } = useRestaurantAuth();
  
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
        // Cookie-based: luôn lấy từ /restaurants/mine cho an toàn
        const r = await fetch(`${api}/api/v1/restaurants/mine`, { credentials: 'include' });
        if (r.ok) {
          const data = await r.json();
          setRestaurant(data || null);
        } else {
          setRestaurant(null);
        }
      } catch (error) {
        console.error('Load restaurant data error:', error);
      }
    };

    loadRestaurantData();
  }, [isAuthenticated, user, api]);

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

            {/* Restaurant status */}
            <Box sx={{ px: 2, py: 2, borderBottom: theme => `1px solid ${theme.palette.divider}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle2" noWrap>{restaurant?.name || 'Chưa thiết lập'}</Typography>
                  <Typography variant="caption" color="text.secondary">Nhà hàng của bạn</Typography>
                </Box>
                <Chip size="small" color={restaurant?.isOpen ? 'success' : 'error'} label={restaurant?.isOpen ? 'Đang mở' : 'Đã đóng'} />
              </Box>
              {restaurant?.address && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }} noWrap>{restaurant.address}</Typography>
              )}
            </Box>

            {/* Quick Stats */}
            <Box sx={{ px: 2, py: 2, borderBottom: theme => `1px solid ${theme.palette.divider}` }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="warning.main">{stats?.todayOrders || 0}</Typography>
                  <Typography variant="caption" color="text.secondary">Đơn hôm nay</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="success.main">₫{stats?.todayRevenue?.toLocaleString() || 0}</Typography>
                  <Typography variant="caption" color="text.secondary">Doanh thu</Typography>
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
              sx={{ display: { xs: 'none', lg: 'block' }, '& .MuiDrawer-paper': { position: 'relative', height: '100vh' } }}
            >
              {SidebarContent}
            </Drawer>
          </>
        );
      })()}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
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
              {/* Notifications */}
              <IconButton aria-label="Thông báo">
                <Badge color="error" badgeContent={stats?.unreadNotifications || 0}>
                  <BellIcon width={20} />
                </Badge>
              </IconButton>

              {/* Restaurant toggle */}
              <FormControlLabel
                sx={{ ml: 1 }}
                control={
                  <MuiSwitch
                    checked={Boolean(restaurant?.isOpen)}
                    onChange={async () => {
                      try {
                        const next = !restaurant?.isOpen;
                        const res = await fetch(`${api}/api/v1/restaurants/mine`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ isOpen: next })
                        });
                        if (res.ok) {
                          const updated = await res.json();
                          setRestaurant((prev: any) => ({ ...(prev||{}), ...updated }));
                        }
                      } catch {}
                    }}
                    inputProps={{ 'aria-label': 'Trạng thái mở cửa' }}
                  />
                }
                label={<Typography variant="body2" color="text.secondary">Trạng thái</Typography>}
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


