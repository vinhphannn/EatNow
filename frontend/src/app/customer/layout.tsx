"use client";

import type { ReactNode } from "react";
import { CustomerNavBar } from "../../components";
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { useCustomerAuth } from "@/contexts/AuthContext";
import { DeliveryAddressProvider, useDeliveryAddress } from "@/contexts/DeliveryAddressContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import BottomNavBar from "@/components/BottomNavBar";
import { useSocket } from "@/hooks/useSocket";
import { useToast } from "@/components";

// Component con để khởi tạo vị trí, đảm bảo nó được gọi bên trong Provider
function LocationInitializer({ children }: { children: ReactNode }) {
    const { setUserLocation, setAddressLabel, userLocation } = useDeliveryAddress();
    const { showToast } = useToast();

    useEffect(() => {
        // Chỉ chạy nếu chưa có vị trí
        if (userLocation) return;

        const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
                );
                const data = await response.json();
                if (data && data.display_name) {
                    const address = data.display_name
                        .split(',')
                        .map((part: string) => part.trim())
                        .filter((part: string) => part.length > 0)
                        .slice(0, -3) // Bỏ các phần không cần thiết
                        .join(', ');
                    return address;
                }
                return '';
            } catch (error) {
                console.error('Reverse geocoding error:', error);
                return '';
            }
        };

        const getCurrentLocation = () => {
            if (navigator.geolocation) {
                showToast('Đang lấy vị trí của bạn...', 'info');
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        console.log('📍 User location (from Layout):', latitude, longitude);
                        setUserLocation({ latitude, longitude });

                        const generatedAddress = await getAddressFromCoordinates(latitude, longitude);
                        if (generatedAddress) {
                            setAddressLabel(generatedAddress);
                            showToast('Đã cập nhật địa chỉ giao hàng', 'success');
                        } else {
                            setAddressLabel('Vị trí hiện tại');
                        }
                    },
                    (error) => {
                        console.error('Geolocation error (from Layout):', error);
                        showToast('Không thể lấy vị trí. Vui lòng chọn địa chỉ thủ công.', 'error');
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 300000
                    }
                );
            } else {
                showToast('Trình duyệt không hỗ trợ định vị.', 'error');
            }
        };

        getCurrentLocation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userLocation]); // Phụ thuộc vào userLocation để chỉ chạy 1 lần

    return <>{children}</>;
}

export default function CustomerLayout({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading, user } = useCustomerAuth();
    const pathname = usePathname();
    const router = useRouter();
    
    const { socket, connected } = useSocket(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001');

    useEffect(() => {
        if (isLoading) return;
        if (pathname === '/customer/login' || pathname === '/customer/register' || pathname.startsWith('/customer/home')) return;
        if (!isAuthenticated) {
            router.push('/customer/login');
            return;
        }
        if (user && user.role !== 'customer') {
            router.push('/unauthorized');
            return;
        }
    }, [isAuthenticated, isLoading, user, pathname, router]);

    useEffect(() => {
        if (isAuthenticated && user && socket && connected) {
            socket.emit('join_user', user.id);
            console.log('Customer Socket connected and joined user room');
        }
    }, [isAuthenticated, user, socket, connected]);

    return (
        <DeliveryAddressProvider>
            <FavoritesProvider>
                <LocationInitializer>
                <div className="min-h-screen bg-gray-50">
                    {pathname !== '/customer/login' && pathname !== '/customer/register' && 
                     pathname !== '/customer/profile' && pathname !== '/customer/orders' && 
                     pathname !== '/customer/search' && !pathname.startsWith('/customer/checkout') && 
                     <CustomerNavBar />}
                    {children}
                    {pathname !== '/customer/login' && pathname !== '/customer/register' && 
                     !pathname.startsWith('/customer/restaurants/') && <BottomNavBar />}
                </div>
            </LocationInitializer>
            </FavoritesProvider>
        </DeliveryAddressProvider>
    );
}
