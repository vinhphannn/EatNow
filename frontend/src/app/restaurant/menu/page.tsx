"use client";
import { useEffect, useState, useMemo } from "react";
import ImageUpload from "../../../components/ImageUpload";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, FormControlLabel, Checkbox, Stack, Typography, IconButton, Box, Card, CardContent, CardActions, Chip, Tooltip, FormControl } from "@mui/material";
import { PlusIcon, ChartBarIcon, XMarkIcon, PencilSquareIcon, TrashIcon, PauseIcon, PlayIcon, PhotoIcon } from "@heroicons/react/24/outline";
import StatCard from "@/components/ui/StatCard";
import ItemCard from "@/components/restaurant/ItemCard";
import CategoryManager from "@/components/restaurant/CategoryManager";

type Item = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  type?: 'food'|'drink';
  description?: string;
  categoryId?: string;
  isActive?: boolean;
  quantityRemaining?: number | null;
};

type ApiError = { message?: string } | string | null;

export default function RestaurantMenuPage() {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<ApiError>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<ApiError>(null);
  const [form, setForm] = useState<{ 
    name: string; 
    basePrice: number; 
    description?: string; 
    imageUrl?: string; 
    categoryId?: string; 
    subCategoryId?: string;
    isActive?: boolean; 
    position?: number;
    preparationTime?: number;
    options?: any[];
  }>({ 
    name: "", 
    basePrice: 0, 
    isActive: true,
    preparationTime: 15,
    options: []
  });

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<ApiError>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    basePrice: number;
    description?: string;
    imageUrl?: string;
    categoryId?: string;
    subCategoryId?: string;
    isActive?: boolean;
    position?: number;
    preparationTime?: number;
    options?: any[];
  }>({ 
    name: "", 
    basePrice: 0, 
    description: "", 
    imageUrl: "", 
    categoryId: "", 
    subCategoryId: "",
    isActive: true, 
    preparationTime: 15,
    options: []
  });

  const [restaurantId, setRestaurantId] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [subCategories, setSubCategories] = useState<Array<{ id: string; name: string; categoryId: string }>>([]);
  const [subCategorySearch, setSubCategorySearch] = useState('');
  const [debouncedSubCategorySearch, setDebouncedSubCategorySearch] = useState('');
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSubCategorySearch(subCategorySearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [subCategorySearch]);
  
  // Filter subcategories based on search
  const filteredSubCategories = useMemo(() => {
    if (!debouncedSubCategorySearch.trim()) return subCategories; // Show all when no search
    return subCategories.filter(sc => 
      sc.name.toLowerCase().includes(debouncedSubCategorySearch.toLowerCase())
    );
  }, [subCategories, debouncedSubCategorySearch]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: typeof items } = {};
    
    items.forEach(item => {
      const categoryId = (item as any).categoryId || 'other';
      if (!groups[categoryId]) {
        groups[categoryId] = [];
      }
      groups[categoryId].push(item);
    });
    
    return groups;
  }, [items]);
  
  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    if (categoryId === 'other') return 'Khác';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Không xác định';
  };
  
  // Get sorted category IDs (categories first, then 'other')
  const sortedCategoryIds = useMemo(() => {
    const categoryIds = Object.keys(groupedItems);
    const otherIndex = categoryIds.indexOf('other');
    if (otherIndex > -1) {
      categoryIds.splice(otherIndex, 1);
      categoryIds.push('other');
    }
    return categoryIds;
  }, [groupedItems]);
  
  // Category management modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState<ApiError>(null);
  const [categoryForm, setCategoryForm] = useState<{ name: string; description?: string; icon?: string; color?: string }>({ 
    name: "", 
    description: "", 
    icon: "🍽️", 
    color: "from-gray-400 to-gray-500" 
  });

  // Category management modal state
  const [categoryManageModalOpen, setCategoryManageModalOpen] = useState(false);
  const [categoryList, setCategoryList] = useState<Array<{ id: string; name: string; description?: string; icon?: string; color?: string; position: number; isActive: boolean }>>([]);
  const [categoryListLoading, setCategoryListLoading] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryForm, setEditCategoryForm] = useState<{ name: string; description?: string; icon?: string; color?: string; isActive: boolean }>({ 
    name: "", 
    description: "", 
    icon: "🍽️", 
    color: "from-gray-400 to-gray-500",
    isActive: true
  });
  const [editCategorySaving, setEditCategorySaving] = useState(false);
  const [editCategoryError, setEditCategoryError] = useState<ApiError>(null);

  async function parseError(res: Response) {
    try {
      const j = await res.json();
      if (Array.isArray((j as any)?.message)) return (j as any).message.join(", ");
      return (j as any)?.message || `HTTP ${res.status}`;
    } catch {
      try { return await res.text(); } catch { return `HTTP ${res.status}`; }
    }
  }

  async function resolveRestaurant(): Promise<string | null> {
    // If already in state, return
    if (restaurantId) return restaurantId;

    try {
      // 1) Try from localStorage and validate
      if (typeof localStorage !== 'undefined') {
        const rid = localStorage.getItem('eatnow_restaurant_id') || '';
        if (rid) {
          const check = await fetch(`${api}/api/v1/restaurants/${rid}`, { credentials: 'include' });
          if (check.ok) {
            setRestaurantId(rid);
            return rid;
          }
          // Invalid or not owned → clear
          localStorage.removeItem('eatnow_restaurant_id');
        }
      }

      // 2) Resolve by current authenticated owner
      const mine = await fetch(`${api}/api/v1/restaurants/mine`, { credentials: 'include' });
      if (mine.ok) {
        const rest = await mine.json();
        const resolvedId = rest?.id || rest?._id || rest?._id?.$oid || '';
        if (resolvedId) {
          if (typeof localStorage !== 'undefined') localStorage.setItem('eatnow_restaurant_id', resolvedId);
          setRestaurantId(resolvedId);
          return resolvedId;
        }
      }

      // 3) Final fallback: try ownerUserId from cached user if exists
      if (typeof localStorage !== 'undefined') {
        const u = localStorage.getItem('eatnow_user');
        if (u) {
          const user = JSON.parse(u);
          if (user?.id) {
            const r = await fetch(`${api}/api/v1/restaurants?ownerUserId=${user.id}`, { credentials: 'include' });
            if (r.ok) {
              const list = await r.json();
              const first = Array.isArray(list) && list.length ? list[0] : null;
              const fbId = first?.id || first?._id || first?._id?.$oid || null;
              if (fbId) {
                localStorage.setItem('eatnow_restaurant_id', fbId);
                setRestaurantId(fbId);
                return fbId;
              }
            }
          }
        }
      }
    } catch {}
    return null;
  }

  async function load() {
    const rid = await resolveRestaurant();
    if (!rid) {
      setItems([]);
      setLoading(false);
      setLoadError(null); // Không chặn bằng banner, chỉ để trống danh sách
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${api}/api/v1/restaurants/${rid}/items?sortBy=position&order=asc`, { cache: 'no-store', credentials: 'include' });
      if (!res.ok) {
        setLoadError(await parseError(res));
        setItems([]);
      } else {
        const data = await res.json();
        console.log('=== LOADED ITEMS ===');
        console.log('Items count:', Array.isArray(data) ? data.length : 0);
        console.log('Items with options:', Array.isArray(data) ? data.filter(item => item.options && item.options.length > 0).length : 0);
        console.log('Items details:', Array.isArray(data) ? data.map(item => ({
          id: item.id,
          name: item.name,
          options: item.options,
          optionsCount: item.options?.length || 0
        })) : []);
        setItems(Array.isArray(data) ? data : []);
      }
      // Load restaurant categories
      try {
        const c = await fetch(`${api}/api/v1/restaurants/${rid}/categories`, { credentials: 'include' });
        if (c.ok) {
          const list = await c.json();
          const mapped = Array.isArray(list) ? list.map((x: any) => ({ id: String(x._id || x.id), name: x.name })) : [];
          setCategories(mapped);
        }
      } catch {}
      
      // Load subcategories (global)
      try {
        const sc = await fetch(`${api}/api/v1/subcategories`, { credentials: 'include' });
        if (sc.ok) {
          const subList = await sc.json();
          const subMapped = Array.isArray(subList) ? subList.map((x: any) => ({ 
            id: String(x._id || x.id), 
            name: x.name,
            categoryId: String(x.categoryId)
          })) : [];
          setSubCategories(subMapped);
        }
      } catch {}
    } catch (e: any) {
      setLoadError("Không thể tải danh sách món. Kiểm tra kết nối mạng.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Cookie-based: không phụ thuộc localStorage
    resolveRestaurant();
  }, []);

  useEffect(() => { load(); }, [restaurantId]);

  function openCreate() {
    setForm({ name: "", basePrice: 0, isActive: true, categoryId: categories[0]?.id, preparationTime: 15, options: [] });
    setSaveError(null);
    setModalOpen(true);
  }

  function openEdit(item: Item) {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      basePrice: Number((item as any).basePrice || (item as any).price || 0),
      description: item.description || "",
      imageUrl: item.imageUrl || "",
      categoryId: (item as any).categoryId || "",
      subCategoryId: (item as any).subCategoryId || "",
      isActive: typeof (item as any).isActive === 'boolean' ? (item as any).isActive : true,
      preparationTime: (item as any).preparationTime || 15,
      options: (item as any).options || [],
    });
    setEditError(null);
    setEditOpen(true);
  }

  async function save() {
    setSaveError(null);
    let rid = restaurantId;
    if (!rid) {
      rid = await resolveRestaurant() || '';
    }
    if (!rid) { setSaveError("Thiếu mã nhà hàng. Vui lòng đăng nhập lại."); return; }
    if (!form.name?.trim()) { setSaveError("Tên món không được để trống"); return; }
    if (!form.basePrice || form.basePrice <= 0) { setSaveError("Giá món phải lớn hơn 0"); return; }
    setSaving(true);
    try {
      // Debug log: payload before sending
      try { 
        console.log('[Menu] POST create item payload', { 
          restaurantId: rid, 
          body: form, 
          hasToken: Boolean(token),
          options: form.options,
          optionsCount: form.options?.length || 0,
          optionsDetails: form.options?.map(opt => ({
            name: opt.name,
            type: opt.type,
            required: opt.required,
            choicesCount: opt.choices?.length || 0,
            choices: opt.choices?.map(choice => ({
              name: choice.name,
              price: choice.price,
              isDefault: choice.isDefault
            }))
          }))
        }); 
      } catch {}
      const requestUrl = `${api}/api/v1/restaurants/${rid}/items`;
      // Filter out options with empty names and clean up payload
      const validOptions = (form.options || [])
        .filter(option => {
          // Keep options that have name OR have choices with names
          const hasName = option.name && option.name.trim() !== '';
          const hasValidChoices = option.choices && option.choices.some(choice => 
            choice.name && choice.name.trim() !== ''
          );
          return hasName || hasValidChoices;
        })
        .map(option => ({
          name: option.name.trim() || 'Option chưa đặt tên',
          type: option.type,
          required: Boolean(option.required),
          position: Number(option.position) || 0,
          isActive: Boolean(option.isActive !== false),
          choices: (option.choices || [])
            .filter(choice => choice.name && choice.name.trim() !== '')
            .map(choice => ({
              name: choice.name.trim(),
              price: Number(choice.price) || 0,
              isDefault: Boolean(choice.isDefault),
              isActive: Boolean(choice.isActive !== false),
              position: Number(choice.position) || 0
            }))
        }));

      const requestBody = {
          name: form.name.trim(),
        basePrice: Number(form.basePrice),
          description: form.description?.trim() || undefined,
          imageUrl: form.imageUrl || undefined,
          categoryId: form.categoryId || undefined,
        subCategoryId: form.subCategoryId || undefined,
          isActive: typeof form.isActive === 'boolean' ? form.isActive : undefined,
          position: typeof form.position === 'number' ? form.position : undefined,
        preparationTime: form.preparationTime || 15,
        options: validOptions,
      };

      console.log('=== FRONTEND SENDING REQUEST ===');
      console.log('Request URL:', requestUrl);
      console.log('Request Body:', requestBody);
      console.log('API Base URL:', api);

      const res = await fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      console.log('=== FRONTEND RECEIVED RESPONSE ===');
      console.log('Response Status:', res.status);
      console.log('Response OK:', res.ok);
      console.log('Response Headers:', Object.fromEntries(res.headers.entries()));
      
      // Get response body
      const responseText = await res.clone().text();
      console.log('Response Body:', responseText);
      
      try {
        const responseJson = JSON.parse(responseText);
        console.log('Response JSON:', responseJson);
      } catch (e) {
        console.log('Response is not JSON:', e);
      }
      if (!res.ok) {
        try { const text = await res.clone().text(); console.warn('[Menu] POST create item error', res.status, text); } catch {}
        setSaveError(await parseError(res));
        return;
      }
      setModalOpen(false);
      console.log('=== RELOADING ITEMS AFTER CREATE ===');
      await load();
    } catch (e: any) {
      setSaveError("Không thể lưu món. Kiểm tra kết nối mạng.");
    } finally {
      setSaving(false);
    }
  }



  // Calculate final price
  const calculateFinalPrice = () => {
    let finalPrice = form.basePrice || 0;
    if (form.options && form.options.length > 0) {
      form.options.forEach(option => {
        if (option.choices && option.choices.length > 0) {
          option.choices.forEach(choice => {
            if (choice.isDefault) {
              finalPrice += choice.price || 0;
            }
          });
        }
      });
    }
    return finalPrice;
  };

  async function submitEdit() {
    if (!editingId) return;
    setEditError(null);
    setEditSaving(true);
    try {
      // Filter out options with empty names and clean up payload
      const validOptions = (editForm.options || [])
        .filter(option => option.name && option.name.trim() !== '')
        .map(option => ({
          name: option.name.trim(),
          type: option.type,
          required: Boolean(option.required),
          position: Number(option.position) || 0,
          isActive: Boolean(option.isActive !== false),
          choices: (option.choices || [])
            .filter(choice => choice.name && choice.name.trim() !== '')
            .map(choice => ({
              name: choice.name.trim(),
              price: Number(choice.price) || 0,
              isDefault: Boolean(choice.isDefault),
              isActive: Boolean(choice.isActive !== false),
              position: Number(choice.position) || 0
            }))
        }));

      const requestBody = {
        ...editForm,
        options: validOptions,
      };

      const res = await fetch(`${api}/api/v1/restaurants/items/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });
      if (!res.ok) {
        setEditError(await parseError(res));
        return;
      }
      setEditOpen(false);
      await load();
    } catch {
      setEditError('Không thể lưu chỉnh sửa');
    } finally {
      setEditSaving(false);
    }
  }

  async function toggleActive(it: Item) {
    const id = it.id;
    try {
      await fetch(`${api}/api/v1/restaurants/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !(it as any).isActive }),
      });
      await load();
    } catch {}
  }

  async function removeItem(it: Item) {
    const id = it.id;
    if (!confirm('Xóa món này?')) return;
    try {
      await fetch(`${api}/api/v1/restaurants/items/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      await load();
    } catch {}
  }

  // Category management functions
  function openCreateCategory() {
    setCategoryForm({ name: "", description: "", icon: "🍽️", color: "from-gray-400 to-gray-500" });
    setCategoryError(null);
    setCategoryModalOpen(true);
  }

  async function loadCategoryList() {
    const rid = await resolveRestaurant();
    if (!rid) return;
    
    console.log('Loading categories for restaurant:', rid);
    console.log('Token:', token ? 'Present' : 'Missing');
    
    setCategoryListLoading(true);
    try {
      const res = await fetch(`${api}/api/v1/restaurant-categories/restaurant/${rid}`, { 
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Categories response status:', res.status);
      console.log('Categories response ok:', res.ok);
      
      if (res.ok) {
        const list = await res.json();
        console.log('Raw categories response:', list);
        const mapped = Array.isArray(list) ? list.map((x: any) => ({
          id: String(x._id || x.id),
          name: x.name,
          description: x.description || '',
          icon: x.icon || '🍽️',
          color: x.color || 'from-gray-400 to-gray-500',
          position: x.position || 0,
          isActive: x.isActive !== false
        })) : [];
        console.log('Mapped categories:', mapped);
        setCategoryList(mapped.sort((a, b) => a.position - b.position));
      } else {
        const errorText = await res.text();
        console.error('Failed to load categories:', res.status, res.statusText, errorText);
        setCategoryList([]);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading category list:', error);
      setCategoryList([]);
      setCategories([]);
    } finally {
      setCategoryListLoading(false);
    }
  }

  function openCategoryManage() {
    setCategoryManageModalOpen(true);
    loadCategoryList();
  }


  async function saveEditCategory() {
    if (!editingCategoryId) return;
    setEditCategoryError(null);
    setEditCategorySaving(true);
    
    try {
      const slug = editCategoryForm.name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      const res = await fetch(`${api}/api/v1/restaurant-categories/${editingCategoryId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          name: editCategoryForm.name.trim(),
          slug: slug,
          description: editCategoryForm.description?.trim() || '',
          icon: editCategoryForm.icon || '🍽️',
          color: editCategoryForm.color || 'from-gray-400 to-gray-500',
          isActive: editCategoryForm.isActive,
        }),
      });
      
      if (!res.ok) {
        setEditCategoryError(await parseError(res));
        return;
      }
      
      setEditingCategoryId(null);
      await loadCategoryList();
      await load(); // Reload main categories
    } catch (e: any) {
      setEditCategoryError("Không thể cập nhật danh mục. Kiểm tra kết nối mạng.");
    } finally {
      setEditCategorySaving(false);
    }
  }

  async function deleteCategory(categoryId: string, categoryName: string) {
    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${categoryName}"? Các món ăn trong danh mục này sẽ không còn được phân loại.`)) return;
    
    try {
      const res = await fetch(`${api}/api/v1/restaurant-categories/${categoryId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
      });
      
      if (!res.ok) {
        alert('Không thể xóa danh mục. Có thể danh mục đang được sử dụng.');
        return;
      }
      
      await loadCategoryList();
      await load(); // Reload main categories
    } catch (error) {
      alert('Không thể xóa danh mục. Kiểm tra kết nối mạng.');
    }
  }

  async function toggleCategoryActive(categoryId: string, currentStatus: boolean) {
    try {
      const res = await fetch(`${api}/api/v1/restaurant-categories/${categoryId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      
      if (res.ok) {
        await loadCategoryList();
        await load(); // Reload main categories
      }
    } catch (error) {
      console.error('Error toggling category status:', error);
    }
  }

  async function saveCategory() {
    setCategoryError(null);
    let rid = restaurantId;
    if (!rid) {
      rid = await resolveRestaurant() || '';
    }
    if (!rid) { setCategoryError("Thiếu mã nhà hàng. Vui lòng đăng nhập lại."); return; }
    if (!categoryForm.name?.trim()) { setCategoryError("Tên danh mục không được để trống"); return; }
    
    setCategorySaving(true);
    try {
      const slug = categoryForm.name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      const requestData = {
        name: categoryForm.name.trim(),
        slug: slug,
        description: categoryForm.description?.trim() || '',
        icon: categoryForm.icon || '🍽️',
        color: categoryForm.color || 'from-gray-400 to-gray-500',
        restaurantId: rid,
        position: categories.length,
        isActive: true,
      };

      console.log('Creating category with data:', requestData);
      console.log('Restaurant ID:', rid);
      console.log('Token:', token ? 'Present' : 'Missing');

      const res = await fetch(`${api}/api/v1/restaurant-categories/restaurant/${rid}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });
      
      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        setCategoryError(await parseError(res));
        return;
      }
      
      const result = await res.json();
      console.log('Category created successfully:', result);
      
      setCategoryModalOpen(false);
      await load(); // Reload to get new category
    } catch (e: any) {
      console.error('Error creating category:', e);
      setCategoryError("Không thể tạo danh mục. Kiểm tra kết nối mạng.");
    } finally {
      setCategorySaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý thực đơn</h1>
          <p className="text-gray-600 mt-1">Quản lý món ăn, giá cả và trạng thái bán hàng</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outlined" startIcon={<ChartBarIcon width={18} />}>Xem báo cáo</Button>
          <Button 
            variant="outlined" 
            onClick={openCategoryManage}
            sx={{ textTransform: 'none' }}
          >
            Quản lý danh mục
          </Button>
          <Button variant="contained" disableElevation onClick={openCreate} startIcon={<PlusIcon width={18} />} sx={{ textTransform: 'none' }}>Thêm món ăn</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        <StatCard label="Tổng món ăn" value={items.length} icon={<PhotoIcon width={20} />} colorBoxBg="rgba(249,115,22,0.12)" />
        <StatCard label="Đang bán" value={items.filter(it => (it as any).isActive !== false).length} icon={<PlayIcon width={20} />} colorBoxBg="rgba(34,197,94,0.12)" />
        <StatCard label="Tạm dừng" value={items.filter(it => (it as any).isActive === false).length} icon={<PauseIcon width={20} />} colorBoxBg="rgba(239,68,68,0.12)" />
        <StatCard label="Giá TB" value={`₫${(items.length > 0 ? Math.round(items.reduce((sum, it) => sum + ((it as any).price || 0), 0) / items.length) : 0).toLocaleString()}`} icon={<ChartBarIcon width={20} />} colorBoxBg="rgba(59,130,246,0.12)" />
      </Box>

      {/* Error Message */}
      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-center">
            <span className="mr-2">⚠️</span>
            {String(loadError)}
          </div>
        </div>
      )}

      {/* Menu Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="flex justify-between items-center">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có món ăn nào</h3>
          <p className="text-gray-600 mb-6">Hãy thêm món ăn đầu tiên để bắt đầu bán hàng</p>
          <button onClick={openCreate} className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
            Thêm món ăn đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedCategoryIds.map(categoryId => (
            <div key={categoryId} className="space-y-4">
              {/* Category Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {getCategoryName(categoryId)}
                  </h3>
                  <Chip 
                    label={`${groupedItems[categoryId].length} món`} 
                    size="small" 
                    color="primary"
                    variant="outlined"
                  />
                </div>
              </div>

              {/* Items Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
                {groupedItems[categoryId].map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    subCategories={subCategories}
                    onEdit={openEdit}
                    onToggleActive={toggleActive}
                    onDelete={removeItem}
                  />
          ))}
        </Box>
            </div>
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      <Dialog open={modalOpen} onClose={() => { if (!saving) setModalOpen(false); }} fullWidth maxWidth="lg" aria-describedby="add-item-desc">
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6">Thêm món ăn mới</Typography>
              <Typography variant="caption" color="text.secondary" id="add-item-desc">Tạo món ăn mới cho thực đơn</Typography>
            </Box>
            <IconButton aria-label="Đóng" disabled={saving} onClick={() => { if (!saving) setModalOpen(false); }}>
              <XMarkIcon width={18} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {saveError && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>{String(saveError)}</Typography>
          )}
          <Box sx={{ display: { xs: 'block', md: 'grid' }, gridTemplateColumns: { md: '1fr 1fr' }, gap: 2 }}>
            <Stack spacing={2}>
              <TextField label="Tên món ăn" required value={form.name} onChange={(e)=>setForm(prev => ({...prev, name: e.target.value}))} placeholder="Ví dụ: Cơm tấm sườn nướng" />
              <TextField label="Giá gốc (VNĐ)" type="number" required value={form.basePrice} onChange={(e)=>setForm(prev => ({...prev, basePrice: Number(e.target.value)}))} />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, alignItems: 'start' }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      📁 Danh mục nhà hàng
                    </Typography>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: 'help',
                        '&:hover': { opacity: 0.7 }
                      }}
                      title="Danh mục riêng của nhà hàng để phân loại món ăn (Món chính, Món thêm, etc.)"
                    >
                      💡
                    </Box>
                  </Box>
                  <FormControl fullWidth size="small">
                    <Select value={form.categoryId || ''} onChange={(e)=>{
                      if (e.target.value === '__create_new__') {
                        openCreateCategory();
                    } else {
                      setForm(prev => ({...prev, categoryId: e.target.value || undefined}));
                    }
                    }} displayEmpty>
                      <MenuItem value="">-- Restaurant Category --</MenuItem>
                  {categories.map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                      <MenuItem value="__create_new__" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                        ➕ Tạo danh mục mới
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      🏷️ Danh mục hệ thống
                    </Typography>
                    <Tooltip title="Danh mục hệ thống để phân loại món ăn theo loại (Phở, Bún, Burger, etc.)" arrow>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          cursor: 'help',
                          '&:hover': { opacity: 0.7 }
                        }}
                      >
                        💡
                      </Box>
                    </Tooltip>
                  </Box>
                  <Box sx={{ position: 'relative' }}>
                    <TextField
                      placeholder="Tìm kiếm hoặc chọn subcategory..."
                      value={subCategorySearch || (form.subCategoryId ? subCategories.find(sc => sc.id === form.subCategoryId)?.name || '' : '')}
                      onChange={(e) => {
                        setSubCategorySearch(e.target.value);
                        if (!e.target.value) {
                          setForm(prev => ({...prev, subCategoryId: undefined}));
                        }
                      }}
                      onFocus={() => {
                        if (!subCategorySearch) {
                          setSubCategorySearch(' ');
                        }
                      }}
                      size="small"
                      fullWidth
                      InputProps={{
                        endAdornment: subCategorySearch !== debouncedSubCategorySearch ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
                            <Box sx={{ 
                              width: 16, 
                              height: 16, 
                              border: '2px solid #ccc', 
                              borderTop: '2px solid #1976d2', 
                              borderRadius: '50%', 
                              animation: 'spin 1s linear infinite',
                              '@keyframes spin': {
                                '0%': { transform: 'rotate(0deg)' },
                                '100%': { transform: 'rotate(360deg)' }
                              }
                            }} />
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
                            <Box sx={{ 
                              width: 0, 
                              height: 0, 
                              borderLeft: '4px solid transparent',
                              borderRight: '4px solid transparent',
                              borderTop: '4px solid #666'
                            }} />
                          </Box>
                        )
                      }}
                    />
                    {(debouncedSubCategorySearch || subCategorySearch) && (
                      <Box sx={{ 
                        position: 'absolute', 
                        top: '100%', 
                        left: 0, 
                        right: 0, 
                        backgroundColor: 'white', 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 1, 
                        boxShadow: 2, 
                        zIndex: 1000,
                        maxHeight: 200,
                        overflow: 'auto',
                        backdropFilter: 'blur(10px)'
                      }}>
                        {filteredSubCategories.length > 0 ? (
                          filteredSubCategories.map(sc => (
                            <MenuItem 
                              key={sc.id} 
                              value={sc.id}
                              onClick={() => {
                                setForm(prev => ({...prev, subCategoryId: sc.id}));
                                setSubCategorySearch('');
                              }}
                              sx={{ 
                                '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' },
                                fontWeight: sc.name.toLowerCase().includes(debouncedSubCategorySearch.toLowerCase()) ? 'bold' : 'normal'
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>
                                  {debouncedSubCategorySearch ? (
                                    sc.name.split(new RegExp(`(${debouncedSubCategorySearch})`, 'gi')).map((part, index) => 
                                      part.toLowerCase() === debouncedSubCategorySearch.toLowerCase() ? (
                                        <span 
                                          key={index}
                                          style={{ 
                                            backgroundColor: '#fff3cd',
                                            color: '#856404',
                                            padding: '1px 2px',
                                            borderRadius: '2px',
                                            fontWeight: 'bold'
                                          }}
                                        >
                                          {part}
                                        </span>
                                      ) : part
                                    )
                                  ) : sc.name}
                                </span>
                              </Box>
                            </MenuItem>
                          ))
                        ) : (
                    <MenuItem disabled>
                            <Typography variant="body2" color="text.secondary">
                              Không tìm thấy subcategory nào
                            </Typography>
                    </MenuItem>
                  )}
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
              
              {/* New fields */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField 
                  label="Thời gian chuẩn bị (phút)" 
                  type="number" 
                  value={form.preparationTime || 15} 
                  onChange={(e)=>setForm(prev => ({...prev, preparationTime: Number(e.target.value)}))} 
                  placeholder="15" 
                  fullWidth 
                />
                <TextField 
                  label="Vị trí hiển thị" 
                  type="number" 
                  value={typeof form.position === 'number' ? form.position : ''} 
                  onChange={(e)=>setForm(prev => ({...prev, position: e.target.value === '' ? undefined : Number(e.target.value)}))} 
                  placeholder="Ví dụ: 1" 
                  fullWidth 
                />
              </Box>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr' }, gap: 2 }}>
              </Box>

              {/* Options Section */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Options & Toppings</Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<PlusIcon width={16} />}
                    onClick={() => {
                      const newOption = {
                        id: `option_${Date.now()}`,
                        name: '',
                        type: 'single' as const,
                        required: false,
                        position: (form.options?.length || 0),
                        isActive: true,
                        choices: [{
                          id: `choice_${Date.now()}`,
                          name: '',
                          price: 0,
                          isDefault: true,
                          isActive: true,
                          position: 0
                        }]
                      };
                      setForm(prev => ({...prev, options: [...(prev.options || []), newOption]}));
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    Thêm Option
                  </Button>
                </Box>
                
                {form.options && form.options.length > 0 ? (
                  <Stack spacing={2}>
                    {form.options.map((option, index) => (
                      <Card key={option.id} variant="outlined" sx={{ p: 2 }}>
                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1">
                              Option {index + 1}: {option.name || 'Chưa đặt tên'}
                            </Typography>
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => {
                                const updatedOptions = (form.options || []).filter(opt => opt.id !== option.id);
                                setForm({ ...form, options: updatedOptions });
                              }}
                            >
                              <XMarkIcon width={16} />
                            </IconButton>
                          </Box>
                          
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 2 }}>
                            <TextField
                              label="Tên option"
                              value={option.name}
                              onChange={(e) => {
                                const updatedOption = { ...option, name: e.target.value };
                                const updatedOptions = (form.options || []).map(opt => 
                                  opt.id === option.id ? updatedOption : opt
                                );
                                setForm({ ...form, options: updatedOptions });
                              }}
                              placeholder="Ví dụ: Size, Topping"
                            />
                            <Select
                              value={option.type}
                              onChange={(e) => {
                                const updatedOption = { ...option, type: e.target.value as 'single' | 'multiple' };
                                const updatedOptions = (form.options || []).map(opt => 
                                  opt.id === option.id ? updatedOption : opt
                                );
                                setForm({ ...form, options: updatedOptions });
                              }}
                            >
                              <MenuItem value="single">Chọn một</MenuItem>
                              <MenuItem value="multiple">Chọn nhiều</MenuItem>
                </Select>
              </Box>
                          
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={option.required}
                                  onChange={(e) => {
                                    const updatedOption = { ...option, required: e.target.checked };
                                    const updatedOptions = (form.options || []).map(opt => 
                                      opt.id === option.id ? updatedOption : opt
                                    );
                                    setForm({ ...form, options: updatedOptions });
                                  }}
                                />
                              }
                              label="Bắt buộc"
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={option.isActive}
                                  onChange={(e) => {
                                    const updatedOption = { ...option, isActive: e.target.checked };
                                    const updatedOptions = (form.options || []).map(opt => 
                                      opt.id === option.id ? updatedOption : opt
                                    );
                                    setForm({ ...form, options: updatedOptions });
                                  }}
                                />
                              }
                              label="Kích hoạt"
                            />
                          </Box>
                          
                          {/* Choices */}
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">Lựa chọn:</Typography>
                              <Button 
                                size="small" 
                                variant="outlined"
                                onClick={() => {
                                  const newChoice = {
                                    id: `choice_${Date.now()}`,
                                    name: '',
                                    price: 0,
                                    isDefault: false,
                                    isActive: true,
                                    position: (option.choices?.length || 0)
                                  };
                                  const updatedOption = { ...option, choices: [...(option.choices || []), newChoice] };
                                  const updatedOptions = (form.options || []).map(opt => 
                                    opt.id === option.id ? updatedOption : opt
                                  );
                                  setForm({ ...form, options: updatedOptions });
                                }}
                                sx={{ textTransform: 'none' }}
                              >
                                Thêm lựa chọn
                              </Button>
                            </Box>
                            
                            {option.choices && option.choices.length > 0 ? (
                              <Stack spacing={1}>
                                {option.choices.map((choice, choiceIndex) => (
                                  <Box key={choice.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr auto auto' }, gap: 1, alignItems: 'center' }}>
                                    <TextField
                                      size="small"
                                      placeholder="Tên lựa chọn"
                                      value={choice.name}
                                      onChange={(e) => {
                                        const updatedChoice = { ...choice, name: e.target.value };
                                        const updatedChoices = (option.choices || []).map(ch => 
                                          ch.id === choice.id ? updatedChoice : ch
                                        );
                                        const updatedOption = { ...option, choices: updatedChoices };
                                        const updatedOptions = (form.options || []).map(opt => 
                                          opt.id === option.id ? updatedOption : opt
                                        );
                                        setForm({ ...form, options: updatedOptions });
                                      }}
                                    />
                                    <TextField
                                      size="small"
                                      type="number"
                                      placeholder="Giá (VNĐ)"
                                      value={choice.price}
                                      onChange={(e) => {
                                        const updatedChoice = { ...choice, price: Number(e.target.value) || 0 };
                                        const updatedChoices = (option.choices || []).map(ch => 
                                          ch.id === choice.id ? updatedChoice : ch
                                        );
                                        const updatedOption = { ...option, choices: updatedChoices };
                                        const updatedOptions = (form.options || []).map(opt => 
                                          opt.id === option.id ? updatedOption : opt
                                        );
                                        setForm({ ...form, options: updatedOptions });
                                      }}
                                    />
                                    {option.type === 'single' && (
                                      <FormControlLabel
                                        control={
                                          <Checkbox
                                            size="small"
                                            checked={choice.isDefault}
                                            onChange={(e) => {
                                              const updatedChoice = { ...choice, isDefault: e.target.checked };
                                              const updatedChoices = (option.choices || []).map(ch => 
                                                ch.id === choice.id ? updatedChoice : ch
                                              );
                                              const updatedOption = { ...option, choices: updatedChoices };
                                              const updatedOptions = (form.options || []).map(opt => 
                                                opt.id === option.id ? updatedOption : opt
                                              );
                                              setForm({ ...form, options: updatedOptions });
                                            }}
                                          />
                                        }
                                        label="Mặc định"
                                        sx={{ fontSize: '0.75rem' }}
                                      />
                                    )}
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => {
                                        const updatedChoices = (option.choices || []).filter(ch => ch.id !== choice.id);
                                        const updatedOption = { ...option, choices: updatedChoices };
                                        const updatedOptions = (form.options || []).map(opt => 
                                          opt.id === option.id ? updatedOption : opt
                                        );
                                        setForm({ ...form, options: updatedOptions });
                                      }}
                                    >
                                      <XMarkIcon width={14} />
                                    </IconButton>
                                  </Box>
                                ))}
                              </Stack>
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                Chưa có lựa chọn nào. Nhấn "Thêm lựa chọn" để bắt đầu.
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    <Typography variant="body2">Chưa có option nào. Nhấn "Thêm Option" để bắt đầu.</Typography>
                  </Box>
                )}
              </Box>

              {/* Price Calculator */}
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Tính giá cuối cùng
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">
                    Giá gốc: ₫{(form.basePrice || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="h6" color="primary">
                    Giá cuối: ₫{calculateFinalPrice().toLocaleString()}
                  </Typography>
                </Box>
              </Box>
              
              <FormControlLabel control={<Checkbox checked={form.isActive !== false} onChange={(e)=>setForm(prev => ({...prev, isActive: e.target.checked}))} />} label="Đang bán" />
            </Stack>
            <Stack spacing={2}>
              <div>
                <Typography variant="body2" sx={{ mb: 1 }}>Hình ảnh món ăn</Typography>
                <ImageUpload 
                  value={form.imageUrl} 
                  onChange={(imageUrl) => {
                    console.log('ImageUpload onChange called with:', imageUrl);
                    setForm(prev => {
                      console.log('Previous form state:', prev);
                      const newForm = {...prev, imageUrl};
                      console.log('New form state:', newForm);
                      return newForm;
                    });
                  }} 
                  placeholder="Nhấp để chọn hình ảnh món ăn" 
                />
              </div>
              <div className="border rounded-xl p-4">
                <div className="text-sm text-gray-600 mb-2">Xem trước</div>
                <div className="rounded-lg border overflow-hidden">
                  <div className="h-36 bg-gray-100 flex items-center justify-center">
                    {form.imageUrl ? (
                      <img src={form.imageUrl} alt={form.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl text-gray-400">🍽️</span>
                    )}
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div className="font-medium text-gray-900 truncate max-w-[60%]">{form.name || 'Tên món'}</div>
                    <div className="text-orange-600 font-semibold">{form.basePrice ? `₫${Number(form.basePrice).toLocaleString()}` : '₫0'}</div>
                  </div>
                </div>
              </div>
            </Stack>
          </Box>
          <Box sx={{ mt: 2 }}>
            <TextField label="Mô tả món ăn" multiline rows={3} value={form.description} onChange={(e)=>setForm(prev => ({...prev, description: e.target.value}))} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => { if (!saving) setModalOpen(false); }} disabled={saving}>Hủy bỏ</Button>
          <Button variant="contained" disableElevation onClick={save} disabled={saving} sx={{ textTransform: 'none' }}>{saving ? 'Đang lưu...' : 'Lưu món ăn'}</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Item Modal */}
      <Dialog open={editOpen} onClose={() => { if (!editSaving) setEditOpen(false); }} fullWidth maxWidth="md" aria-describedby="edit-item-desc">
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6">Chỉnh sửa món ăn</Typography>
              <Typography variant="caption" color="text.secondary" id="edit-item-desc">Cập nhật thông tin món ăn</Typography>
            </Box>
            <IconButton aria-label="Đóng" disabled={editSaving} onClick={() => { if (!editSaving) setEditOpen(false); }}>
              <XMarkIcon width={18} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {editError && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>{String(editError)}</Typography>
          )}
          <Box sx={{ display: { xs: 'block', md: 'grid' }, gridTemplateColumns: { md: '1fr 1fr' }, gap: 2 }}>
            <Stack spacing={2}>
              <TextField label="Tên món ăn" required value={editForm.name} onChange={(e)=>setEditForm(prev => ({...prev, name: e.target.value}))} />
              <TextField label="Giá bán (VNĐ)" type="number" required value={editForm.basePrice} onChange={(e)=>setEditForm(prev => ({...prev, basePrice: Number(e.target.value)}))} />
              <Select value={editForm.isActive ? 'true' : 'false'} onChange={(e)=>setEditForm(prev => ({...prev, isActive: e.target.value === 'true'}))} displayEmpty>
                <MenuItem value={'true'}>Đang bán</MenuItem>
                <MenuItem value={'false'}>Tạm dừng</MenuItem>
              </Select>
            </Stack>
            <Stack spacing={2}>
              <div>
                <Typography variant="body2" sx={{ mb: 1 }}>Hình ảnh món ăn</Typography>
                <ImageUpload 
                  value={editForm.imageUrl} 
                  onChange={(imageUrl) => {
                    console.log('EditForm ImageUpload onChange called with:', imageUrl);
                    setEditForm(prev => {
                      console.log('Previous editForm state:', prev);
                      const newEditForm = {...prev, imageUrl};
                      console.log('New editForm state:', newEditForm);
                      return newEditForm;
                    });
                  }} 
                  placeholder="Nhấp để chọn hình ảnh món ăn" 
                  className="h-32" 
                />
              </div>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, alignItems: 'start' }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      📁 Danh mục nhà hàng
                    </Typography>
                    <Tooltip title="Danh mục riêng của nhà hàng để phân loại món ăn (Món chính, Món thêm, etc.)" arrow>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          cursor: 'help',
                          '&:hover': { opacity: 0.7 }
                        }}
                      >
                        💡
                      </Box>
                    </Tooltip>
                  </Box>
                  <FormControl fullWidth size="small">
                    <Select value={editForm.categoryId || ''} onChange={(e)=>{
                      if (e.target.value === '__create_new__') {
                        openCreateCategory();
                      } else {
                        setEditForm(prev => ({...prev, categoryId: e.target.value || undefined}));
                      }
                    }} displayEmpty>
                      <MenuItem value="">-- Restaurant Category --</MenuItem>
                {categories.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
                      <MenuItem value="__create_new__" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                        ➕ Tạo danh mục mới
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      🏷️ Danh mục hệ thống
                    </Typography>
                    <Tooltip title="Danh mục hệ thống để phân loại món ăn theo loại (Phở, Bún, Burger, etc.)" arrow>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          cursor: 'help',
                          '&:hover': { opacity: 0.7 }
                        }}
                      >
                        💡
                      </Box>
                    </Tooltip>
                  </Box>
                  <Box sx={{ position: 'relative' }}>
                    <TextField
                      placeholder="Tìm kiếm hoặc chọn subcategory..."
                      value={subCategorySearch || (editForm.subCategoryId ? subCategories.find(sc => sc.id === editForm.subCategoryId)?.name || '' : '')}
                      onChange={(e) => {
                        setSubCategorySearch(e.target.value);
                        if (!e.target.value) {
                          setEditForm(prev => ({...prev, subCategoryId: undefined}));
                        }
                      }}
                      onFocus={() => {
                        if (!subCategorySearch) {
                          setSubCategorySearch(' ');
                        }
                      }}
                      size="small"
                      fullWidth
                      InputProps={{
                        endAdornment: subCategorySearch !== debouncedSubCategorySearch ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
                            <Box sx={{ 
                              width: 16, 
                              height: 16, 
                              border: '2px solid #ccc', 
                              borderTop: '2px solid #1976d2', 
                              borderRadius: '50%', 
                              animation: 'spin 1s linear infinite',
                              '@keyframes spin': {
                                '0%': { transform: 'rotate(0deg)' },
                                '100%': { transform: 'rotate(360deg)' }
                              }
                            }} />
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
                            <Box sx={{ 
                              width: 0, 
                              height: 0, 
                              borderLeft: '4px solid transparent',
                              borderRight: '4px solid transparent',
                              borderTop: '4px solid #666'
                            }} />
                          </Box>
                        )
                      }}
                    />
                    {(debouncedSubCategorySearch || subCategorySearch) && (
                      <Box sx={{ 
                        position: 'absolute', 
                        top: '100%', 
                        left: 0, 
                        right: 0, 
                        backgroundColor: 'white', 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 1, 
                        boxShadow: 2, 
                        zIndex: 1000,
                        maxHeight: 200,
                        overflow: 'auto',
                        backdropFilter: 'blur(10px)'
                      }}>
                        {filteredSubCategories.length > 0 ? (
                          filteredSubCategories.map(sc => (
                            <MenuItem 
                              key={sc.id} 
                              value={sc.id}
                              onClick={() => {
                                setEditForm(prev => ({...prev, subCategoryId: sc.id}));
                                setSubCategorySearch('');
                              }}
                              sx={{ 
                                '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' },
                                fontWeight: sc.name.toLowerCase().includes(debouncedSubCategorySearch.toLowerCase()) ? 'bold' : 'normal'
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>
                                  {debouncedSubCategorySearch ? (
                                    sc.name.split(new RegExp(`(${debouncedSubCategorySearch})`, 'gi')).map((part, index) => 
                                      part.toLowerCase() === debouncedSubCategorySearch.toLowerCase() ? (
                                        <span 
                                          key={index}
                                          style={{ 
                                            backgroundColor: '#fff3cd',
                                            color: '#856404',
                                            padding: '1px 2px',
                                            borderRadius: '2px',
                                            fontWeight: 'bold'
                                          }}
                                        >
                                          {part}
                                        </span>
                                      ) : part
                                    )
                                  ) : sc.name}
                                </span>
                              </Box>
                            </MenuItem>
                          ))
                        ) : (
                  <MenuItem disabled>
                            <Typography variant="body2" color="text.secondary">
                              Không tìm thấy subcategory nào
                            </Typography>
                  </MenuItem>
                )}
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            </Stack>
          </Box>
          <Box sx={{ mt: 2 }}>
            <TextField label="Mô tả món ăn" multiline rows={3} value={editForm.description} onChange={(e)=>setEditForm(prev => ({...prev, description: e.target.value}))} fullWidth />
          </Box>
          
          {/* Options Section */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Options & Toppings</Typography>
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<PlusIcon width={16} />}
                onClick={() => {
                  const newOption = {
                    id: `option_${Date.now()}`,
                    name: '',
                    type: 'single' as const,
                    required: false,
                    position: (editForm.options?.length || 0),
                    isActive: true,
                    choices: [{
                      id: `choice_${Date.now()}`,
                      name: '',
                      price: 0,
                      isDefault: true,
                      isActive: true,
                      position: 0
                    }]
                  };
                  setEditForm(prev => ({...prev, options: [...(prev.options || []), newOption]}));
                }}
                sx={{ textTransform: 'none' }}
              >
                Thêm Option
              </Button>
            </Box>
            
            {editForm.options && editForm.options.length > 0 ? (
              <Stack spacing={2}>
                {editForm.options.map((option, index) => (
                  <Card key={option.id} variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1">
                          Option {index + 1}: {option.name || 'Chưa đặt tên'}
                        </Typography>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => {
                            const updatedOptions = (editForm.options || []).filter(opt => opt.id !== option.id);
                            setEditForm(prev => ({...prev, options: updatedOptions}));
                          }}
                        >
                          <XMarkIcon width={16} />
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                        <TextField
                          label="Tên option"
                          value={option.name}
                          onChange={(e) => {
                            const updatedOption = { ...option, name: e.target.value };
                            const updatedOptions = (editForm.options || []).map(opt => 
                              opt.id === option.id ? updatedOption : opt
                            );
                            setEditForm(prev => ({...prev, options: updatedOptions}));
                          }}
                          placeholder="Ví dụ: Size, Topping"
                        />
                        <Select
                          value={option.type}
                          onChange={(e) => {
                            const updatedOption = { ...option, type: e.target.value as 'single' | 'multiple' };
                            const updatedOptions = (editForm.options || []).map(opt => 
                              opt.id === option.id ? updatedOption : opt
                            );
                            setEditForm(prev => ({...prev, options: updatedOptions}));
                          }}
                        >
                          <MenuItem value="single">Chọn một</MenuItem>
                          <MenuItem value="multiple">Chọn nhiều</MenuItem>
                        </Select>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={option.required}
                              onChange={(e) => {
                                const updatedOption = { ...option, required: e.target.checked };
                                const updatedOptions = (editForm.options || []).map(opt => 
                                  opt.id === option.id ? updatedOption : opt
                                );
                                setEditForm(prev => ({...prev, options: updatedOptions}));
                              }}
                            />
                          }
                          label="Bắt buộc"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={option.isActive}
                              onChange={(e) => {
                                const updatedOption = { ...option, isActive: e.target.checked };
                                const updatedOptions = (editForm.options || []).map(opt => 
                                  opt.id === option.id ? updatedOption : opt
                                );
                                setEditForm(prev => ({...prev, options: updatedOptions}));
                              }}
                            />
                          }
                          label="Kích hoạt"
                        />
                      </Box>
                      
                      {/* Choices */}
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">Lựa chọn:</Typography>
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => {
                              const newChoice = {
                                id: `choice_${Date.now()}`,
                                name: '',
                                price: 0,
                                isDefault: false,
                                isActive: true,
                                position: (option.choices?.length || 0)
                              };
                              const updatedOption = { ...option, choices: [...(option.choices || []), newChoice] };
                              const updatedOptions = (editForm.options || []).map(opt => 
                                opt.id === option.id ? updatedOption : opt
                              );
                              setEditForm(prev => ({...prev, options: updatedOptions}));
                            }}
                            sx={{ textTransform: 'none' }}
                          >
                            Thêm lựa chọn
                          </Button>
                        </Box>
                        
                        <Stack spacing={1}>
                          {option.choices?.map((choice, choiceIndex) => (
                            <Box key={choice.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr auto' }, gap: 1, alignItems: 'center' }}>
                              <TextField
                                size="small"
                                placeholder="Tên lựa chọn"
                                value={choice.name}
                                onChange={(e) => {
                                  const updatedChoice = { ...choice, name: e.target.value };
                                  const updatedChoices = (option.choices || []).map(ch => 
                                    ch.id === choice.id ? updatedChoice : ch
                                  );
                                  const updatedOption = { ...option, choices: updatedChoices };
                                  const updatedOptions = (editForm.options || []).map(opt => 
                                    opt.id === option.id ? updatedOption : opt
                                  );
                                  setEditForm(prev => ({...prev, options: updatedOptions}));
                                }}
                              />
                              <TextField
                                size="small"
                                type="number"
                                placeholder="Giá (VNĐ)"
                                value={choice.price}
                                onChange={(e) => {
                                  const updatedChoice = { ...choice, price: Number(e.target.value) || 0 };
                                  const updatedChoices = (option.choices || []).map(ch => 
                                    ch.id === choice.id ? updatedChoice : ch
                                  );
                                  const updatedOption = { ...option, choices: updatedChoices };
                                  const updatedOptions = (editForm.options || []).map(opt => 
                                    opt.id === option.id ? updatedOption : opt
                                  );
                                  setEditForm(prev => ({...prev, options: updatedOptions}));
                                }}
                              />
                              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                {option.type === 'single' && (
                                  <FormControlLabel
                                    control={
                                      <Checkbox
                                        size="small"
                                        checked={choice.isDefault}
                                        onChange={(e) => {
                                          const updatedChoices = (option.choices || []).map(ch => ({
                                            ...ch,
                                            isDefault: ch.id === choice.id ? e.target.checked : false
                                          }));
                                          const updatedOption = { ...option, choices: updatedChoices };
                                          const updatedOptions = (editForm.options || []).map(opt => 
                                            opt.id === option.id ? updatedOption : opt
                                          );
                                          setEditForm(prev => ({...prev, options: updatedOptions}));
                                        }}
                                      />
                                    }
                                    label="Mặc định"
                                    sx={{ m: 0 }}
                                  />
                                )}
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => {
                                    const updatedChoices = (option.choices || []).filter(ch => ch.id !== choice.id);
                                    const updatedOption = { ...option, choices: updatedChoices };
                                    const updatedOptions = (editForm.options || []).map(opt => 
                                      opt.id === option.id ? updatedOption : opt
                                    );
                                    setEditForm(prev => ({...prev, options: updatedOptions}));
                                  }}
                                >
                                  <XMarkIcon width={14} />
                                </IconButton>
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <Typography variant="body2">Chưa có option nào. Nhấn "Thêm Option" để bắt đầu.</Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => { if (!editSaving) setEditOpen(false); }} disabled={editSaving}>Hủy bỏ</Button>
          <Button variant="contained" disableElevation onClick={submitEdit} disabled={editSaving} sx={{ textTransform: 'none' }}>{editSaving ? 'Đang lưu...' : 'Cập nhật món ăn'}</Button>
        </DialogActions>
      </Dialog>

      {/* Create Category Modal */}
      <Dialog open={categoryModalOpen} onClose={() => { if (!categorySaving) setCategoryModalOpen(false); }} fullWidth maxWidth="sm">
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6">Tạo danh mục mới</Typography>
              <Typography variant="caption" color="text.secondary">Tạo danh mục riêng cho nhà hàng</Typography>
            </Box>
            <IconButton aria-label="Đóng" disabled={categorySaving} onClick={() => { if (!categorySaving) setCategoryModalOpen(false); }}>
              <XMarkIcon width={18} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {categoryError && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>{String(categoryError)}</Typography>
          )}
          <Stack spacing={2}>
            <TextField 
              label="Tên danh mục" 
              required 
              value={categoryForm.name} 
              onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})} 
              placeholder="Ví dụ: Món đặc biệt, Combo giảm giá"
            />
            <TextField 
              label="Mô tả" 
              multiline 
              rows={2}
              value={categoryForm.description} 
              onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})} 
              placeholder="Mô tả ngắn về danh mục này"
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField 
                label="Icon" 
                value={categoryForm.icon} 
                onChange={(e) => setCategoryForm({...categoryForm, icon: e.target.value})} 
                placeholder="🍽️"
                inputProps={{ maxLength: 2 }}
              />
              <Select 
                value={categoryForm.color} 
                onChange={(e) => setCategoryForm({...categoryForm, color: e.target.value})}
                displayEmpty
              >
                <MenuItem value="from-gray-400 to-gray-500">Xám</MenuItem>
                <MenuItem value="from-orange-400 to-red-500">Cam-Đỏ</MenuItem>
                <MenuItem value="from-blue-400 to-cyan-500">Xanh dương</MenuItem>
                <MenuItem value="from-green-400 to-emerald-500">Xanh lá</MenuItem>
                <MenuItem value="from-purple-400 to-pink-500">Tím-Hồng</MenuItem>
                <MenuItem value="from-yellow-400 to-orange-500">Vàng-Cam</MenuItem>
              </Select>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => { if (!categorySaving) setCategoryModalOpen(false); }} disabled={categorySaving}>
            Hủy bỏ
          </Button>
          <Button variant="contained" disableElevation onClick={saveCategory} disabled={categorySaving} sx={{ textTransform: 'none' }}>
            {categorySaving ? 'Đang tạo...' : 'Tạo danh mục'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Management Modal */}
      <CategoryManager
        open={categoryManageModalOpen}
        onClose={() => setCategoryManageModalOpen(false)}
        categories={categoryList}
        loading={categoryListLoading}
        onSave={saveCategory}
        onUpdate={saveEditCategory}
        onDelete={(id) => {
          const category = categoryList.find(c => c.id === id);
          if (category) {
            deleteCategory(id, category.name);
          }
        }}
        onToggleActive={toggleCategoryActive}
      />

    </div>
  );
}
