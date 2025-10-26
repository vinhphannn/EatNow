"use client";
import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Stack,
  Typography,
  IconButton,
  Box,
  Card,
  CardContent,
  Chip,
  Tooltip
} from "@mui/material";
import { XMarkIcon, PlusIcon, PauseIcon, PlayIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  position: number;
  isActive: boolean;
}

interface CategoryManagerProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  loading: boolean;
  onSave: (category: Omit<Category, 'id'>) => void;
  onUpdate: (id: string, category: Partial<Category>) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, currentStatus: boolean) => void;
}

export default function CategoryManager({
  open,
  onClose,
  categories,
  loading,
  onSave,
  onUpdate,
  onDelete,
  onToggleActive
}: CategoryManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    icon: '🍽️',
    color: 'from-gray-400 to-gray-500',
    isActive: true
  });

  const handleCreate = () => {
    onSave({ ...form, position: categories.length });
    setForm({ name: '', description: '', icon: '🍽️', color: 'from-gray-400 to-gray-500', isActive: true });
    setShowCreateForm(false);
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '🍽️',
      color: category.color || 'from-gray-400 to-gray-500',
      isActive: category.isActive
    });
  };

  const handleUpdate = () => {
    if (editingId) {
      onUpdate(editingId, form);
      setEditingId(null);
      setForm({ name: '', description: '', icon: '🍽️', color: 'from-gray-400 to-gray-500', isActive: true });
    }
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingId(null);
    setForm({ name: '', description: '', icon: '🍽️', color: 'from-gray-400 to-gray-500', isActive: true });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6">Quản lý danh mục</Typography>
            <Typography variant="caption" color="text.secondary">Quản lý các danh mục món ăn của nhà hàng</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => setShowCreateForm(true)}
              startIcon={<PlusIcon width={16} />}
              sx={{ textTransform: 'none' }}
            >
              Thêm danh mục
            </Button>
            <IconButton aria-label="Đóng" onClick={onClose}>
              <XMarkIcon width={18} />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>
      
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </Box>
        ) : categories.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Chưa có danh mục nào
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Tạo danh mục đầu tiên để phân loại món ăn
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => setShowCreateForm(true)}
              startIcon={<PlusIcon width={16} />}
              sx={{ textTransform: 'none' }}
            >
              Tạo danh mục đầu tiên
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {categories.map((category) => (
              <Card key={category.id} elevation={0} sx={{ border: theme => `1px solid ${theme.palette.divider}` }}>
                <CardContent>
                  {editingId === category.id ? (
                    // Edit mode
                    <Box>
                      <Stack spacing={2}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                          <TextField 
                            label="Tên danh mục" 
                            required 
                            value={form.name} 
                            onChange={(e) => setForm({...form, name: e.target.value})} 
                            fullWidth
                          />
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField 
                              label="Icon" 
                              value={form.icon} 
                              onChange={(e) => setForm({...form, icon: e.target.value})} 
                              inputProps={{ maxLength: 2 }}
                              sx={{ flex: 1 }}
                            />
                            <Select 
                              value={form.color} 
                              onChange={(e) => setForm({...form, color: e.target.value})}
                              sx={{ flex: 1 }}
                            >
                              <MenuItem value="from-gray-400 to-gray-500">Xám</MenuItem>
                              <MenuItem value="from-orange-400 to-red-500">Cam-Đỏ</MenuItem>
                              <MenuItem value="from-blue-400 to-cyan-500">Xanh dương</MenuItem>
                              <MenuItem value="from-green-400 to-emerald-500">Xanh lá</MenuItem>
                              <MenuItem value="from-purple-400 to-pink-500">Tím-Hồng</MenuItem>
                              <MenuItem value="from-yellow-400 to-orange-500">Vàng-Cam</MenuItem>
                            </Select>
                          </Box>
                        </Box>
                        <TextField 
                          label="Mô tả" 
                          multiline 
                          rows={2}
                          value={form.description} 
                          onChange={(e) => setForm({...form, description: e.target.value})} 
                          fullWidth
                        />
                        <FormControlLabel 
                          control={
                            <Checkbox 
                              checked={form.isActive} 
                              onChange={(e) => setForm({...form, isActive: e.target.checked})} 
                            />
                          } 
                          label="Đang hoạt động" 
                        />
                        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                          <Button 
                            variant="outlined" 
                            onClick={handleCancel}
                          >
                            Hủy
                          </Button>
                          <Button 
                            variant="contained" 
                            onClick={handleUpdate}
                          >
                            Lưu
                          </Button>
                        </Stack>
                      </Stack>
                    </Box>
                  ) : (
                    // View mode
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 1, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: `linear-gradient(135deg, ${category.color?.replace('from-', '').replace('to-', '').replace('-400', '').replace('-500', '') || 'gray'})`,
                          opacity: category.isActive ? 1 : 0.5
                        }}>
                          <Typography variant="h6">{category.icon}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {category.name}
                          </Typography>
                          {category.description && (
                            <Typography variant="body2" color="text.secondary">
                              {category.description}
                            </Typography>
                          )}
                          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                            <Chip 
                              size="small" 
                              color={category.isActive ? 'success' : 'default'} 
                              label={category.isActive ? 'Hoạt động' : 'Tạm dừng'} 
                            />
                            <Chip 
                              size="small" 
                              variant="outlined" 
                              label={`Vị trí: ${category.position}`} 
                            />
                          </Stack>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title={category.isActive ? 'Tạm dừng' : 'Kích hoạt'}>
                          <IconButton 
                            onClick={() => onToggleActive(category.id, category.isActive)}
                            color={category.isActive ? 'warning' : 'success'}
                          >
                            {category.isActive ? <PauseIcon width={18} /> : <PlayIcon width={18} />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa">
                          <IconButton onClick={() => handleEdit(category)}>
                            <PencilSquareIcon width={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <IconButton 
                            color="error" 
                            onClick={() => onDelete(category.id)}
                          >
                            <TrashIcon width={18} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
