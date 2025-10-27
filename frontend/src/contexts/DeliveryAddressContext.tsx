"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DeliveryAddressContextType {
  addressLabel: string;
  setAddressLabel: (label: string) => void;
  userLocation: { latitude: number; longitude: number } | null;
  setUserLocation: (location: { latitude: number; longitude: number } | null) => void;
}

const DeliveryAddressContext = createContext<DeliveryAddressContextType | undefined>(undefined);

export function DeliveryAddressProvider({ children }: { children: ReactNode }) {
  const [addressLabel, setAddressLabel] = useState<string>('Chưa có địa chỉ');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Load address from localStorage on mount (non-auth data)
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('eatnow_delivery_address') : null;
      if (saved) {
        try {
          const obj = JSON.parse(saved);
          const label = obj?.label || obj?.addressLine || obj?.full || obj?.name;
          if (label) setAddressLabel(label);
        } catch {
          setAddressLabel(saved);
        }
      }
    } catch {}
  }, []);

  // Save address to localStorage when it changes (non-auth data)
  useEffect(() => {
    if (addressLabel && addressLabel !== 'Chưa có địa chỉ') {
      try {
        localStorage.setItem('eatnow_delivery_address', addressLabel);
      } catch {}
    }
  }, [addressLabel]);

  return (
    <DeliveryAddressContext.Provider value={{
      addressLabel,
      setAddressLabel,
      userLocation,
      setUserLocation
    }}>
      {children}
    </DeliveryAddressContext.Provider>
  );
}

export function useDeliveryAddress() {
  const context = useContext(DeliveryAddressContext);
  if (context === undefined) {
    throw new Error('useDeliveryAddress must be used within a DeliveryAddressProvider');
  }
  return context;
}
