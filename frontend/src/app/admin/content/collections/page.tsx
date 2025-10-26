"use client";

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faEye,
  faEyeSlash,
  faArrowUp,
  faArrowDown,
  faStore,
  faBars,
  faGripVertical
} from '@fortawesome/free-solid-svg-icons';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, FormControlLabel, Checkbox, Stack, Typography, IconButton, Box, Card, CardContent, CardActions, Chip, Tooltip, FormControl, InputLabel } from '@mui/material';

interface FeaturedCollection {
  _id: string;
  name: string;
  description?: string;
  subtitle?: string;
  layout: 'grid' | 'carousel' | 'list';
  maxItems: number;
  icon?: string;
  color?: string;
  isActive: boolean;
  isFeatured: boolean;
  position: number;
  restaurantIds: string[];
  validFrom?: string;
  validUntil?: string;
  restaurants?: Array<{
    _id: string;
    name: string;
    imageUrl?: string;
    rating?: number;
  }>;
}

export default function FeaturedCollectionsPage() {
  const [collections, setCollections] = useState<FeaturedCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<FeaturedCollection | null>(null);
  const [form, setForm] = useState<Partial<FeaturedCollection>>({
    name: '',
    description: '',
    subtitle: '',
    layout: 'grid',
    maxItems: 6,
    icon: '',
    color: '#f97316',
    isActive: true,
    isFeatured: false,
    position: 0,
    restaurantIds: []
  });

  // Load collections
  useEffect(() => {
    const loadCollections = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/v1/admin/featured-collections');
        const data = await response.json();
        setCollections(data);
      } catch (error) {
        console.error('Error loading collections:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCollections();
  }, []);

  const handleSave = async () => {
    try {
      const url = editingCollection 
        ? `/api/v1/admin/featured-collections/${editingCollection._id}`
        : '/api/v1/admin/featured-collections';
      
      const method = editingCollection ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        setModalOpen(false);
        setEditingCollection(null);
        setForm({
          name: '',
          description: '',
          subtitle: '',
          layout: 'grid',
          maxItems: 6,
          icon: '',
          color: '#f97316',
          isActive: true,
          isFeatured: false,
          position: 0,
          restaurantIds: []
        });
        // Reload collections
        window.location.reload();
      }
    } catch (error) {
      console.error('Error saving collection:', error);
    }
  };

  const handleEdit = (collection: FeaturedCollection) => {
    setEditingCollection(collection);
    setForm(collection);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa collection này?')) {
      try {
        await fetch(`/api/v1/admin/featured-collections/${id}`, {
          method: 'DELETE'
        });
        window.location.reload();
      } catch (error) {
        console.error('Error deleting collection:', error);
      }
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/v1/admin/featured-collections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });
      window.location.reload();
    } catch (error) {
      console.error('Error toggling collection:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">Bộ sưu tập nổi bật</h1>
          <p className="text-gray-600">Quản lý các bộ sưu tập hiển thị trên trang chủ</p>
        </div>
        <Button
          variant="contained"
          startIcon={<FontAwesomeIcon icon={faPlus} />}
          onClick={() => setModalOpen(true)}
          sx={{ bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' } }}
        >
          Tạo bộ sưu tập
        </Button>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <Card key={collection._id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {collection.icon && (
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: collection.color + '20' }}
                    >
                      <FontAwesomeIcon 
                        icon={faStore} 
                        className="text-lg"
                        style={{ color: collection.color }}
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{collection.name}</h3>
                    {collection.subtitle && (
                      <p className="text-sm text-gray-600">{collection.subtitle}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Chip
                    label={collection.isActive ? 'Hoạt động' : 'Tạm dừng'}
                    color={collection.isActive ? 'success' : 'default'}
                    size="small"
                  />
                  {collection.isFeatured && (
                    <Chip label="Nổi bật" color="primary" size="small" />
                  )}
                </div>
              </div>

              {collection.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {collection.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Layout: {collection.layout}</span>
                <span>Max: {collection.maxItems}</span>
                <span>Vị trí: {collection.position}</span>
              </div>

              <div className="text-sm text-gray-500">
                {collection.restaurants?.length || 0} nhà hàng
              </div>
            </CardContent>

            <CardActions className="px-6 pb-6">
              <div className="flex items-center space-x-2">
                <IconButton
                  size="small"
                  onClick={() => handleToggleActive(collection._id, collection.isActive)}
                  color={collection.isActive ? 'default' : 'primary'}
                >
                  <FontAwesomeIcon icon={collection.isActive ? faEyeSlash : faEye} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleEdit(collection)}
                  color="primary"
                >
                  <FontAwesomeIcon icon={faEdit} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(collection._id)}
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
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCollection ? 'Chỉnh sửa bộ sưu tập' : 'Tạo bộ sưu tập mới'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} className="mt-4">
            <TextField
              label="Tên bộ sưu tập"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="Mô tả ngắn"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              fullWidth
            />

            <TextField
              label="Mô tả chi tiết"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />

            <div className="grid grid-cols-2 gap-4">
              <FormControl fullWidth>
                <InputLabel>Layout</InputLabel>
                <Select
                  value={form.layout}
                  onChange={(e) => setForm({ ...form, layout: e.target.value as any })}
                >
                  <MenuItem value="grid">Grid</MenuItem>
                  <MenuItem value="carousel">Carousel</MenuItem>
                  <MenuItem value="list">List</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Số lượng tối đa"
                type="number"
                value={form.maxItems}
                onChange={(e) => setForm({ ...form, maxItems: Number(e.target.value) })}
                fullWidth
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Icon (FontAwesome)"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="faStore"
                fullWidth
              />

              <TextField
                label="Màu sắc"
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                fullWidth
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Vị trí hiển thị"
                type="number"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
                fullWidth
              />
            </div>

            <div className="flex items-center space-x-4">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                }
                label="Kích hoạt"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  />
                }
                label="Nổi bật"
              />
            </div>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Hủy</Button>
          <Button onClick={handleSave} variant="contained">
            {editingCollection ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}



