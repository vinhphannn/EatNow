'use client';

import { useState } from 'react';
import { Switch, FormControlLabel, Typography, Box, Chip, CircularProgress } from '@mui/material';
import { useToast } from '@/components/Toast';

interface RestaurantStatusToggleProps {
  restaurant: any;
  onStatusChange: (newStatus: boolean) => void;
  disabled?: boolean;
}

export default function RestaurantStatusToggle({ 
  restaurant, 
  onStatusChange, 
  disabled = false 
}: RestaurantStatusToggleProps) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleToggle = async () => {
    if (loading || disabled) return;
    
    setLoading(true);
    try {
      const newStatus = !restaurant?.isOpen;
      await onStatusChange(newStatus);
      
      showToast(
        newStatus 
          ? 'Nhà hàng đã được mở cửa' 
          : 'Nhà hàng đã được đóng cửa', 
        'success'
      );
    } catch (error) {
      console.error('Error toggling restaurant status:', error);
      showToast('Không thể thay đổi trạng thái nhà hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isOpen = Boolean(restaurant?.isOpen);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* Toggle Switch */}
      <FormControlLabel
        control={
          <Switch
            checked={isOpen}
            onChange={handleToggle}
            disabled={loading || disabled}
            color="success"
            size="small"
            inputProps={{ 'aria-label': 'Trạng thái mở cửa' }}
          />
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {isOpen ? 'Mở cửa' : 'Đóng cửa'}
            </Typography>
            {loading && (
              <CircularProgress size={16} />
            )}
          </Box>
        }
        sx={{ ml: 0 }}
      />
    </Box>
  );
}
