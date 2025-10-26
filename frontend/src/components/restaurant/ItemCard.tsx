"use client";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Stack,
  Box,
  Chip,
  Tooltip
} from "@mui/material";
import { PencilSquareIcon, TrashIcon, PauseIcon, PlayIcon, PhotoIcon } from "@heroicons/react/24/outline";

interface Item {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  type?: 'food'|'drink';
  description?: string;
  categoryId?: string;
  isActive?: boolean;
  quantityRemaining?: number | null;
  basePrice?: number;
  subCategoryId?: string;
  preparationTime?: number;
  position?: number;
  options?: any[];
}

interface ItemCardProps {
  item: Item;
  subCategories: Array<{ id: string; name: string; categoryId: string }>;
  onEdit: (item: Item) => void;
  onToggleActive: (item: Item) => void;
  onDelete: (item: Item) => void;
}

export default function ItemCard({ item, subCategories, onEdit, onToggleActive, onDelete }: ItemCardProps) {
  return (
    <Card 
      elevation={0} 
      sx={{ 
        border: theme => `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      <Box sx={{ position: 'relative', height: 192, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <PhotoIcon width={48} />
        )}
        <Chip 
          size="small" 
          color={item.isActive === false ? 'error' : 'success'} 
          label={item.isActive === false ? 'Tạm dừng' : 'Đang bán'} 
          sx={{ position: 'absolute', top: 12, right: 12 }} 
        />
      </Box>
      
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={600} noWrap>{item.name}</Typography>
            <Chip 
              size="small" 
              color={item.type === 'food' ? 'warning' : 'info'} 
              label={item.type === 'food' ? 'Món ăn' : 'Đồ uống'} 
            />
          </Stack>
        
        {/* SubCategory */}
        {item.subCategoryId && (
          <Box sx={{ mb: 1 }}>
            <Chip 
              size="small" 
              label={`🏷️ ${subCategories.find(sc => sc.id === item.subCategoryId)?.name || 'SubCategory'}`}
              color="secondary"
              variant="outlined"
            />
          </Box>
        )}

        {/* Options/Toppings with Details */}
        {item.options && item.options.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
              🍽️ Options & Toppings:
            </Typography>
            <Stack spacing={1}>
              {item.options.slice(0, 2).map((option: any, index: number) => (
                <Box key={index} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <Typography variant="caption" fontWeight={600} color="primary">
                      {option.name}
                    </Typography>
                    <Chip 
                      size="small" 
                      label={option.required ? 'Bắt buộc' : 'Tùy chọn'}
                      color={option.required ? 'error' : 'default'}
                      variant="outlined"
                      sx={{ fontSize: '0.65rem', height: 16 }}
                    />
                    <Chip 
                      size="small" 
                      label={option.type === 'multiple' ? 'Nhiều lựa chọn' : 'Một lựa chọn'}
                      color="info"
                      variant="outlined"
                      sx={{ fontSize: '0.65rem', height: 16 }}
                    />
                  </Stack>
                  
                  {/* Choices */}
                  {option.choices && option.choices.length > 0 && (
                    <Stack spacing={0.5}>
                      {option.choices.slice(0, 3).map((choice: any, choiceIndex: number) => (
                        <Stack key={choiceIndex} direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            {choice.isDefault && '⭐ '}{choice.name}
                          </Typography>
                          <Typography variant="caption" color="warning.main" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                            {choice.price > 0 ? `+₫${choice.price.toLocaleString()}` : 'Miễn phí'}
                          </Typography>
                        </Stack>
                      ))}
                      {option.choices.length > 3 && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                          +{option.choices.length - 3} lựa chọn khác...
                        </Typography>
                      )}
                    </Stack>
                  )}
                </Box>
              ))}
              {item.options.length > 2 && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontStyle: 'italic' }}>
                  +{item.options.length - 2} options khác...
                </Typography>
              )}
            </Stack>
          </Box>
        )}

        {/* Description */}
        {item.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }} noWrap>
            {item.description}
          </Typography>
        )}

        {/* Price and Details */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6" color="warning.main">₫{(item.price || 0).toLocaleString()}</Typography>
            {(item.basePrice || 0) !== (item.price || 0) && (
              <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                ₫{(item.basePrice || 0).toLocaleString()}
              </Typography>
            )}
          </Stack>
        </Stack>

        {/* Additional Info */}
        <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
          {item.preparationTime && (
            <Typography variant="caption" color="text.secondary">
              ⏱️ {item.preparationTime} phút
            </Typography>
          )}
          {item.position && (
            <Typography variant="caption" color="text.secondary">
              📍 Vị trí: {item.position}
            </Typography>
          )}
        </Stack>
        </Box>
      </CardContent>
      
      <CardActions sx={{ display: 'flex', justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => onEdit(item)} 
          startIcon={<PencilSquareIcon width={16} />} 
          sx={{ textTransform: 'none' }} 
          aria-label="Sửa món"
        >
          Sửa
        </Button>
        <Stack direction="row" spacing={1}>
          <Tooltip title={item.isActive === false ? 'Mở bán' : 'Tạm dừng'}>
            <IconButton 
              aria-label={item.isActive === false ? 'Mở bán' : 'Tạm dừng'} 
              onClick={() => onToggleActive(item)}
              sx={{
                bgcolor: item.isActive === false ? 'success.light' : 'warning.light',
                color: item.isActive === false ? 'success.contrastText' : 'warning.contrastText',
                borderRadius: 2,
                '&:hover': {
                  bgcolor: item.isActive === false ? 'success.main' : 'warning.main',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease-in-out',
                boxShadow: 1,
              }}
            >
              {item.isActive === false ? <PlayIcon width={18} /> : <PauseIcon width={18} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Xóa">
            <IconButton 
              color="error" 
              aria-label="Xóa món" 
              onClick={() => onDelete(item)}
              sx={{
                bgcolor: 'error.light',
                color: 'error.contrastText',
                borderRadius: 2,
                '&:hover': {
                  bgcolor: 'error.main',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease-in-out',
                boxShadow: 1,
              }}
            >
              <TrashIcon width={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      </CardActions>
    </Card>
  );
}
