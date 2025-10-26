"use client";

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faEye,
  faEyeSlash,
  faTags
} from '@fortawesome/free-solid-svg-icons';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, Typography, IconButton, Box, Card, CardContent, CardActions, Chip, Tooltip, FormControlLabel, Checkbox } from '@mui/material';

interface Category {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<Partial<Category>>({
    name: '',
    description: '',
    icon: '',
    position: 0,
    isActive: true
  });

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        // Mock data for now - replace with real API calls
        const mockCategories: Category[] = [
          {
            _id: '1',
            name: 'Món chính',
            description: 'Các món ăn chính',
            icon: 'faUtensils',
            position: 1,
            isActive: true,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z'
          },
          {
            _id: '2',
            name: 'Đồ uống',
            description: 'Các loại đồ uống',
            icon: 'faGlassWater',
            position: 2,
            isActive: true,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z'
          }
        ];
        setCategories(mockCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleSave = async () => {
    try {
      // Mock save - replace with real API call
      console.log('Saving category:', form);
      setModalOpen(false);
      setEditingCategory(null);
      setForm({
        name: '',
        description: '',
        icon: '',
        position: 0,
        isActive: true
      });
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setForm(category);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa danh mục này?')) {
      try {
        // Mock delete - replace with real API call
        console.log('Deleting category:', id);
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh mục món ăn</h1>
          <p className="text-gray-600">Quản lý các danh mục món ăn hiển thị trên trang chủ</p>
        </div>
        <Button
          variant="contained"
          startIcon={<FontAwesomeIcon icon={faPlus} />}
          onClick={() => setModalOpen(true)}
          sx={{ bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' } }}
        >
          Tạo danh mục
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card key={category._id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {category.icon && (
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon 
                        icon={faTags} 
                        className="text-lg text-orange-600" 
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-500">Vị trí: {category.position}</p>
                  </div>
                </div>
                <Chip
                  label={category.isActive ? 'Hoạt động' : 'Tạm dừng'}
                  color={category.isActive ? 'success' : 'default'}
                  size="small"
                />
              </div>

              {category.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {category.description}
                </p>
              )}

              <div className="text-sm text-gray-500">
                Icon: {category.icon || 'Chưa có'}
              </div>
            </CardContent>

            <CardActions className="px-6 pb-6">
              <div className="flex items-center space-x-2">
                <IconButton
                  size="small"
                  onClick={() => handleEdit(category)}
                  color="primary"
                >
                  <FontAwesomeIcon icon={faEdit} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(category._id)}
                  color="error"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </IconButton>
              </div>
            </CardActions>
          </Card>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} className="mt-4">
            <TextField
              label="Tên danh mục"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="Mô tả"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />

            <TextField
              label="Icon (FontAwesome)"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              placeholder="faTags"
              fullWidth
            />

            <TextField
              label="Vị trí hiển thị"
              type="number"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
              fullWidth
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
              }
              label="Kích hoạt"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Hủy</Button>
          <Button onClick={handleSave} variant="contained">
            {editingCategory ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}



