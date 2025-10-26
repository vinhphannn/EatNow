'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api.client';
import { useToast } from '@/components/Toast';
import ImageUpload from '@/components/ImageUpload';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faEdit, 
  faTrash, 
  faSearch, 
  faEye, 
  faEyeSlash,
  faSort,
  faFilter,
  faChevronDown,
  faChevronRight,
  faList,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';

// Add all FontAwesome icons to library
library.add(fas, far, fab);

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  color?: string;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subCategories?: SubCategory[];
}

interface SubCategory {
  _id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { user, isAdmin } = useAdminAuth();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'position' | 'createdAt'>('position');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearchTerm, setIconSearchTerm] = useState('');
  const [selectedIconType, setSelectedIconType] = useState<'solid' | 'regular' | 'brands'>('solid');

  // Form state for Category
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '🍽️',
    color: 'from-gray-400 to-gray-500',
    imageUrl: '',
    position: 0,
    isActive: true,
  });

  // Form state for SubCategory
  const [subCategoryFormData, setSubCategoryFormData] = useState({
    categoryId: '',
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    position: 0,
    isActive: true,
  });

  useEffect(() => {
    if (!isAdmin) {
      router.push('/admin/login');
      return;
    }
    loadCategories();
  }, [isAdmin, router]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      console.log('Loading categories with subcategories...');
      const response = await apiClient.get('/api/v1/categories/with-subcategories');
      console.log('Raw response:', response);
      console.log('Response type:', typeof response);
      console.log('Response length:', Array.isArray(response) ? response.length : 'Not an array');
      
      if (Array.isArray(response)) {
        response.forEach((cat, index) => {
          console.log(`Category ${index}:`, {
            id: cat._id,
            name: cat.name,
            subCategories: cat.subCategories,
            subCategoriesLength: cat.subCategories?.length || 0
          });
        });
      }
      
      setCategories(response as Category[]);
    } catch (error) {
      console.error('Error loading categories:', error);
      showToast('Không thể tải danh sách danh mục', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSubCategories = async (categoryId?: string) => {
    try {
      const url = categoryId 
        ? `/api/v1/subcategories?categoryId=${categoryId}`
        : '/api/v1/subcategories';
      const response = await apiClient.get(url) as SubCategory[];
      setSubCategories(response);
    } catch (error) {
      console.error('Error loading subcategories:', error);
      showToast('Không thể tải danh sách danh mục con', 'error');
    }
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadCategories();
  }, [debouncedSearchTerm]);

  const handleCreateCategory = async () => {
    try {
      await apiClient.post('/api/v1/categories', categoryFormData);
      showToast('Tạo danh mục thành công', 'success');
      setShowCreateModal(false);
      resetCategoryForm();
      loadCategories();
    } catch (error) {
      console.error('Error creating category:', error);
      showToast('Không thể tạo danh mục', 'error');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    
    try {
      await apiClient.put(`/api/v1/categories/${editingCategory._id}`, categoryFormData);
      showToast('Cập nhật danh mục thành công', 'success');
      setEditingCategory(null);
      resetCategoryForm();
      loadCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      showToast('Không thể cập nhật danh mục', 'error');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    
    try {
      setDeletingId(id);
      await apiClient.delete(`/api/v1/categories/${id}`);
      showToast('Xóa danh mục thành công', 'success');
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast('Không thể xóa danh mục', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateSubCategory = async () => {
    try {
      console.log('Creating subcategory with data:', subCategoryFormData);
      console.log('CategoryId type:', typeof subCategoryFormData.categoryId);
      console.log('CategoryId value:', subCategoryFormData.categoryId);
      
      await apiClient.post('/api/v1/subcategories', subCategoryFormData);
      showToast('Tạo danh mục con thành công', 'success');
      setShowSubCategoryModal(false);
      resetSubCategoryForm();
      loadCategories();
    } catch (error) {
      console.error('Error creating subcategory:', error);
      showToast('Không thể tạo danh mục con', 'error');
    }
  };

  const handleUpdateSubCategory = async () => {
    if (!editingSubCategory) return;
    
    try {
      await apiClient.patch(`/api/v1/subcategories/${editingSubCategory._id}`, subCategoryFormData);
      showToast('Cập nhật danh mục con thành công', 'success');
      setEditingSubCategory(null);
      resetSubCategoryForm();
      loadCategories();
    } catch (error) {
      console.error('Error updating subcategory:', error);
      showToast('Không thể cập nhật danh mục con', 'error');
    }
  };

  const handleDeleteSubCategory = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục con này?')) return;
    
    try {
      setDeletingId(id);
      await apiClient.delete(`/api/v1/subcategories/${id}`);
      showToast('Xóa danh mục con thành công', 'success');
      loadCategories();
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      showToast('Không thể xóa danh mục con', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Function to create slug from name
  const createSlug = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      slug: '',
      description: '',
      icon: '🍽️',
      color: 'from-gray-400 to-gray-500',
      imageUrl: '',
      position: 0,
      isActive: true,
    });
  };

  const resetSubCategoryForm = () => {
    setSubCategoryFormData({
      categoryId: '',
      name: '',
      slug: '',
      description: '',
      imageUrl: '',
      position: 0,
      isActive: true,
    });
  };

  const openEditCategoryModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '🍽️',
      color: category.color || 'from-gray-400 to-gray-500',
      imageUrl: category.imageUrl || '',
      position: category.position,
      isActive: category.isActive,
    });
  };

  const openEditSubCategoryModal = (subCategory: SubCategory) => {
    setEditingSubCategory(subCategory);
    setSubCategoryFormData({
      categoryId: subCategory.categoryId,
      name: subCategory.name,
      slug: subCategory.slug,
      description: subCategory.description || '',
      imageUrl: subCategory.imageUrl || '',
      position: subCategory.position,
      isActive: subCategory.isActive,
    });
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Get all available icons from FontAwesome library
  const getAllIcons = () => {
    const icons: Array<{ name: string; type: 'solid' | 'regular' | 'brands' }> = [];
    
    // Get solid icons
    Object.keys(fas).forEach(iconName => {
      if (iconName.startsWith('fa')) {
        icons.push({ name: iconName, type: 'solid' });
      }
    });
    
    // Get regular icons
    Object.keys(far).forEach(iconName => {
      if (iconName.startsWith('fa')) {
        icons.push({ name: iconName, type: 'regular' });
      }
    });
    
    // Get brand icons
    Object.keys(fab).forEach(iconName => {
      if (iconName.startsWith('fa')) {
        icons.push({ name: iconName, type: 'brands' });
      }
    });
    
    return icons;
  };

  const allIcons = getAllIcons();

  // Filter icons based on search term and type
  const filteredIcons = allIcons.filter(icon => {
    const matchesSearch = icon.name.toLowerCase().includes(iconSearchTerm.toLowerCase());
    const matchesType = icon.type === selectedIconType;
    return matchesSearch && matchesType;
  }).slice(0, 200); // Limit to 200 icons for performance

  const selectIcon = (iconName: string, iconType: 'solid' | 'regular' | 'brands') => {
    setCategoryFormData({ ...categoryFormData, icon: `${iconType}:${iconName}` });
    setShowIconPicker(false);
  };

  const getIconFromString = (iconString: string) => {
    if (!iconString) return faPlus;
    
    const [type, name] = iconString.split(':');
    if (type === 'solid' && fas[name as keyof typeof fas]) {
      return fas[name as keyof typeof fas];
    } else if (type === 'regular' && far[name as keyof typeof far]) {
      return far[name as keyof typeof far];
    } else if (type === 'brands' && fab[name as keyof typeof fab]) {
      return fab[name as keyof typeof fab];
    }
    return faPlus;
  };

  // Function to highlight search terms
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  // Memoized filtered categories for better performance
  const filteredCategories = useMemo(() => {
    return categories
      .filter(category => {
        if (debouncedSearchTerm) {
          const searchLower = debouncedSearchTerm.toLowerCase();
          
          // Search in category fields
          const categoryMatches = category.name.toLowerCase().includes(searchLower) ||
                                category.description?.toLowerCase().includes(searchLower) ||
                                category.slug.toLowerCase().includes(searchLower);
          
          // Search in subcategories
          const subCategoryMatches = category.subCategories?.some(subCat => 
            subCat.name.toLowerCase().includes(searchLower) ||
            subCat.description?.toLowerCase().includes(searchLower) ||
            subCat.slug.toLowerCase().includes(searchLower)
          ) || false;
          
          if (!categoryMatches && !subCategoryMatches) return false;
        }
        
        if (filterStatus === 'active') return category.isActive;
        if (filterStatus === 'inactive') return !category.isActive;
        return true;
      })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'position':
          comparison = a.position - b.position;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [categories, debouncedSearchTerm, filterStatus, sortBy, sortOrder]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Không có quyền truy cập</h1>
          <p className="text-gray-600">Bạn cần đăng nhập với tài khoản admin để truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý danh mục</h1>
              <p className="text-gray-600 mt-2">Quản lý các danh mục và danh mục con món ăn</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              Thêm danh mục
            </button>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm danh mục, mô tả, slug..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sắp xếp theo</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="position">Vị trí</option>
                  <option value="name">Tên</option>
                  <option value="createdAt">Ngày tạo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thứ tự</label>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faSort} />
                  {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                </button>
              </div>
            </div>
          </div>

          {/* Search Results Info */}
          {debouncedSearchTerm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-blue-800">
                <FontAwesomeIcon icon={faSearch} className="w-4 h-4" />
                <span className="font-medium">
                  Tìm thấy {filteredCategories.length} danh mục cho "{debouncedSearchTerm}"
                </span>
              </div>
            </div>
          )}

          {/* Categories List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Đang tải danh sách danh mục...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCategories.map((category) => (
                  <div key={category._id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    {/* Category Row */}
                    <div className="p-6 bg-white hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => toggleCategoryExpansion(category._id)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <FontAwesomeIcon 
                              icon={expandedCategories.has(category._id) ? faChevronDown : faChevronRight} 
                              className="w-4 h-4 text-gray-500"
                            />
                          </button>
                          
                          <div className="flex-shrink-0 h-12 w-12">
                            {category.imageUrl ? (
                              <img
                                className="h-12 w-12 rounded-lg object-cover"
                                src={category.imageUrl}
                                alt={category.name}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                <FontAwesomeIcon 
                                  icon={getIconFromString(category.icon)} 
                                  className="w-6 h-6 text-gray-600"
                                />
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <div className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              <span className="text-orange-500"></span>
                              {highlightText(category.name, debouncedSearchTerm)}
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                category.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {category.isActive ? 'Hoạt động' : 'Không hoạt động'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">{category.description}</div>
                            <div className="text-xs text-gray-400">/{category.slug} • Vị trí: {category.position}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">
                            {category.subCategories?.length || 0} danh mục con
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditCategoryModal(category)}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Chỉnh sửa danh mục"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category._id)}
                              disabled={deletingId === category._id}
                              className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                              title="Xóa danh mục"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SubCategories */}
                    {expandedCategories.has(category._id) && (
                      <div className="bg-gray-50 border-t border-gray-200">
                        {!category.subCategories || category.subCategories.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            <div className="mb-3">Chưa có danh mục con nào</div>
                            <button
                              onClick={() => {
                                setSubCategoryFormData({ ...subCategoryFormData, categoryId: category._id });
                                setShowSubCategoryModal(true);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
                            >
                              <FontAwesomeIcon icon={faPlus} />
                              Thêm danh mục con
                            </button>
                          </div>
                        ) : (
                          <>
                            {category.subCategories.map((subCategory) => (
                            <div key={subCategory._id} className="p-4 pl-8 border-b border-gray-200 last:border-b-0 hover:bg-gray-100 transition-colors relative">
                              {/* Visual indicator for subcategory */}
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400"></div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="flex-shrink-0 h-8 w-8">
                                    {subCategory.imageUrl ? (
                                      <img
                                        className="h-8 w-8 rounded object-cover"
                                        src={subCategory.imageUrl}
                                        alt={subCategory.name}
                                      />
                                    ) : (
                                      <div className="h-8 w-8 rounded bg-gray-300 flex items-center justify-center">
                                        <FontAwesomeIcon 
                                          icon={faList} 
                                          className="w-4 h-4 text-gray-600"
                                        />
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div>
                                    <div className="text-sm font-medium text-gray-800 flex items-center gap-2">
                                      <span className="text-blue-600 font-bold"></span>
                                      <span className="text-blue-500"></span>
                                      {highlightText(subCategory.name, debouncedSearchTerm)}
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        subCategory.isActive 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {subCategory.isActive ? 'Hoạt động' : 'Không hoạt động'}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500">{subCategory.description}</div>
                                    <div className="text-xs text-gray-400">
                                      /{subCategory.slug} • Vị trí: {subCategory.position}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => openEditSubCategoryModal(subCategory)}
                                    className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                    title="Chỉnh sửa danh mục con"
                                  >
                                    <FontAwesomeIcon icon={faEdit} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSubCategory(subCategory._id)}
                                    disabled={deletingId === subCategory._id}
                                    className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                    title="Xóa danh mục con"
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                  </button>
                                </div>
                              </div>
                            </div>
                            ))}
                            
                            {/* Add SubCategory Button at the end */}
                            <div className="p-4 pl-8 border-t border-gray-200 bg-white">
                              <button
                                onClick={() => {
                                  setSubCategoryFormData({ ...subCategoryFormData, categoryId: category._id });
                                  setShowSubCategoryModal(true);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                              >
                                <FontAwesomeIcon icon={faPlus} />
                                Thêm danh mục con
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {filteredCategories.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    Không tìm thấy danh mục nào
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Create/Edit Category Modal */}
          {(showCreateModal || editingCategory) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">
                  {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên danh mục *</label>
                    <input
                      type="text"
                      value={categoryFormData.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        const slug = createSlug(name);
                        setCategoryFormData({ ...categoryFormData, name, slug });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập tên danh mục"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Slug (tự động tạo)</label>
                    <input
                      type="text"
                      value={categoryFormData.slug}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      placeholder="slug-sẽ-được-tạo-tự-động"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                    <textarea
                      value={categoryFormData.description}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Mô tả danh mục"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 flex items-center gap-2">
                        <FontAwesomeIcon 
                          icon={getIconFromString(categoryFormData.icon)} 
                          className="w-4 h-4"
                        />
                        <span className="text-sm">
                          {categoryFormData.icon ? categoryFormData.icon.split(':')[1] : 'Chọn icon'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowIconPicker(true)}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Chọn
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Màu gradient</label>
                    <select
                      value={categoryFormData.color}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="from-gray-400 to-gray-500">Xám</option>
                      <option value="from-orange-400 to-red-500">Cam - Đỏ</option>
                      <option value="from-yellow-400 to-orange-500">Vàng - Cam</option>
                      <option value="from-blue-400 to-cyan-500">Xanh dương - Cyan</option>
                      <option value="from-pink-400 to-purple-500">Hồng - Tím</option>
                      <option value="from-green-400 to-emerald-500">Xanh lá - Emerald</option>
                      <option value="from-red-400 to-pink-500">Đỏ - Hồng</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vị trí</label>
                    <input
                      type="number"
                      value={categoryFormData.position}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, position: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh</label>
                    <ImageUpload
                      value={categoryFormData.imageUrl}
                      onChange={(url) => setCategoryFormData({ ...categoryFormData, imageUrl: url })}
                      placeholder="Tải lên hình ảnh danh mục"
                      className="w-full"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={categoryFormData.isActive}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, isActive: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Hoạt động</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingCategory(null);
                      resetCategoryForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingCategory ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create/Edit SubCategory Modal */}
          {(showSubCategoryModal || editingSubCategory) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">
                  {editingSubCategory ? 'Chỉnh sửa danh mục con' : 'Thêm danh mục con mới'}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục cha *</label>
                    <select
                      value={subCategoryFormData.categoryId}
                      onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, categoryId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Chọn danh mục cha</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên danh mục con *</label>
                    <input
                      type="text"
                      value={subCategoryFormData.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        const slug = createSlug(name);
                        setSubCategoryFormData({ ...subCategoryFormData, name, slug });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập tên danh mục con"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Slug (tự động tạo)</label>
                    <input
                      type="text"
                      value={subCategoryFormData.slug}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      placeholder="slug-sẽ-được-tạo-tự-động"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                    <textarea
                      value={subCategoryFormData.description}
                      onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Mô tả danh mục con"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vị trí</label>
                    <input
                      type="number"
                      value={subCategoryFormData.position}
                      onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, position: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh</label>
                    <ImageUpload
                      value={subCategoryFormData.imageUrl}
                      onChange={(url) => setSubCategoryFormData({ ...subCategoryFormData, imageUrl: url })}
                      placeholder="Tải lên hình ảnh danh mục con"
                      className="w-full"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={subCategoryFormData.isActive}
                        onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, isActive: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Hoạt động</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowSubCategoryModal(false);
                      setEditingSubCategory(null);
                      resetSubCategoryForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={editingSubCategory ? handleUpdateSubCategory : handleCreateSubCategory}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {editingSubCategory ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Icon Picker Modal */}
          {showIconPicker && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Chọn Icon FontAwesome</h2>
                  <button
                    onClick={() => setShowIconPicker(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Search and Filter */}
                <div className="mb-4 space-y-3">
                  <div className="relative">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={iconSearchTerm}
                      onChange={(e) => setIconSearchTerm(e.target.value)}
                      placeholder="Tìm kiếm icon (ví dụ: food, coffee, pizza...)"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedIconType('solid')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        selectedIconType === 'solid'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Solid ({Object.keys(fas).length})
                    </button>
                    <button
                      onClick={() => setSelectedIconType('regular')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        selectedIconType === 'regular'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Regular ({Object.keys(far).length})
                    </button>
                    <button
                      onClick={() => setSelectedIconType('brands')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        selectedIconType === 'brands'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Brands ({Object.keys(fab).length})
                    </button>
                  </div>
                </div>
                
                {/* Icons Grid */}
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-2">
                    {filteredIcons.map((iconData) => {
                      const iconObject = iconData.type === 'solid' 
                        ? fas[iconData.name as keyof typeof fas]
                        : iconData.type === 'regular'
                        ? far[iconData.name as keyof typeof far]
                        : fab[iconData.name as keyof typeof fab];
                      
                      return (
                        <button
                          key={`${iconData.type}-${iconData.name}`}
                          onClick={() => selectIcon(iconData.name, iconData.type)}
                          className={`p-2 rounded-lg border-2 transition-all hover:bg-gray-50 ${
                            categoryFormData.icon === `${iconData.type}:${iconData.name}`
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200'
                          }`}
                          title={iconData.name}
                        >
                          <FontAwesomeIcon 
                            icon={iconObject} 
                            className="w-4 h-4 text-gray-700 mx-auto" 
                          />
                        </button>
                      );
                    })}
                  </div>
                  
                  {filteredIcons.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Không tìm thấy icon nào phù hợp
                    </div>
                  )}
                  
                  {filteredIcons.length >= 200 && (
                    <div className="text-center py-4 text-sm text-gray-500">
                      Hiển thị 200 icon đầu tiên. Hãy tìm kiếm cụ thể hơn để xem thêm.
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end mt-4 pt-4 border-t">
                  <button
                    onClick={() => setShowIconPicker(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
