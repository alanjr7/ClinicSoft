import { useState, useMemo, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
  Package, AlertTriangle, CheckCircle, Search, Plus, Loader2,
  Boxes, Tags, Trash2, Pencil, ArrowUpDown, ArrowDown, ArrowUp,
  SlidersHorizontal, ShoppingCart, Printer,
} from 'lucide-react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import PosSaleSystem, {
  PatientOption,
  AccountOption,
  ClinicInfo,
} from '../components/PosSaleSystem';
import PosThermalTicketModal, { SaleReceipt } from '../components/PosThermalTicketModal';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Category { id: string; name: string; description?: string | null; }

interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  unit: string;
  current_stock: number;
  min_stock_level: number;
  unit_cost: number | null;
  is_active: boolean;
  category?: Category | null;
}

interface Props {
  items: InventoryItem[];
  categories: Category[];
  patients?: PatientOption[];
  accounts?: AccountOption[];
  sales?: SaleReceipt[];
  clinic?: ClinicInfo | null;
  filters: { search: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function stockStatus(item: InventoryItem): 'out' | 'low' | 'ok' {
  if (item.current_stock <= 0) return 'out';
  if (item.current_stock <= item.min_stock_level) return 'low';
  return 'ok';
}

const STATUS_CFG = {
  ok: { label: 'En Stock', className: 'bg-[#F0F9FF] dark:bg-sky-950/40 text-[#0284C7] dark:text-[#38BDF8] hover:bg-[#F0F9FF]' },
  low: { label: 'Stock Bajo', className: 'bg-[#FEF3C7] dark:bg-amber-950/40 text-[#F59E0B] dark:text-amber-400 hover:bg-[#FEF3C7]' },
  out: { label: 'Agotado', className: 'bg-[#FEE2E2] dark:bg-red-950/40 text-[#EF4444] dark:text-red-400 hover:bg-[#FEE2E2]' },
} as const;

function emptyForm() {
  return { name: '', category_id: '', sku: '', unit_of_measure: 'pza', min_stock_level: '0', current_stock: '0', unit_cost: '' };
}

function emptyMovement() {
  return { item_id: '', movement_type: 'in' as 'in' | 'out' | 'adjustment', quantity: '', notes: '' };
}

export default function Inventory({
  items = [],
  categories: initialCategories = [],
  patients = [],
  accounts = [],
  sales = [],
  clinic = null,
  filters = { search: '' },
}: Props) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'pos'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'pos' || localStorage.getItem('inventory_active_tab') === 'pos') {
        return 'pos';
      }
    }
    return 'inventory';
  });

  const handleTabChange = (tab: 'inventory' | 'pos') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('inventory_active_tab', tab);
    }
  };
  const [search, setSearch] = useState(filters?.search ?? '');
  const [categories, setCategories] = useState<Category[]>(initialCategories ?? []);

  // ── Thermal Print / Sales modal ──
  const [showThermalModal, setShowThermalModal] = useState(false);
  const [selectedThermalSale, setSelectedThermalSale] = useState<SaleReceipt | null>(null);

  // ── Create modal ──
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  // ── Edit modal ──
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ── Movement modal ──
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementForm, setMovementForm] = useState(emptyMovement);
  const [movementSaving, setMovementSaving] = useState(false);
  const [movementError, setMovementError] = useState<string | null>(null);

  // ── Category modal ──
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  useEffect(() => {
    setCategories(initialCategories ?? []);
  }, [initialCategories]);

  // ── Client-side search ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = (search || '').toLowerCase();
    return (items || []).filter(i =>
      (i.name || '').toLowerCase().includes(q) ||
      (i.sku ?? '').toLowerCase().includes(q) ||
      (i.category?.name ?? '').toLowerCase().includes(q)
    );
  }, [items, search]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalItems = (items || []).length;
  const lowCount = (items || []).filter(i => stockStatus(i) !== 'ok').length;
  const okCount = (items || []).filter(i => stockStatus(i) === 'ok').length;
  const lowItems = (items || []).filter(i => stockStatus(i) !== 'ok');

  // ── Create handlers ───────────────────────────────────────────────────────
  function openModal() { setForm(emptyForm()); setSaveError(null); setIsCreatingCategory(false); setShowModal(true); }
  function closeModal() { setShowModal(false); setSaveError(null); }

  function handleSubmit(e?: React.FormEvent | React.MouseEvent) {
    if (e) e.preventDefault();
    if (!form.name || !form.category_id || !form.unit_of_measure) {
      setSaveError('Nombre, categoría y unidad son obligatorios.');
      return;
    }
    setSaving(true);
    router.post('/inventory/items', {
      name: form.name,
      category_id: form.category_id,
      sku: form.sku || null,
      unit_of_measure: form.unit_of_measure,
      min_stock_level: Number(form.min_stock_level),
      current_stock: Number(form.current_stock),
      unit_cost: form.unit_cost ? Number(form.unit_cost) : null,
    }, {
      onSuccess: closeModal,
      onError: () => setSaveError('No se pudo crear el artículo. Verifica los datos.'),
      onFinish: () => setSaving(false),
    });
  }

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })); }

  // ── Edit handlers ─────────────────────────────────────────────────────────
  function openEditModal(item: InventoryItem) {
    setEditItem(item);
    setEditForm({
      name: item.name,
      category_id: item.category?.id ?? '',
      sku: item.sku ?? '',
      unit_of_measure: item.unit,
      min_stock_level: String(item.min_stock_level),
      current_stock: String(item.current_stock),
      unit_cost: item.unit_cost != null ? String(item.unit_cost) : '',
    });
    setEditError(null);
    setShowEditModal(true);
  }

  function handleEditSubmit(e?: React.FormEvent | React.MouseEvent) {
    if (e) e.preventDefault();
    if (!editItem || !editForm.name || !editForm.unit_of_measure) {
      setEditError('Nombre y unidad son obligatorios.');
      return;
    }
    setEditSaving(true);
    const payload: Record<string, any> = {
      name: editForm.name,
      sku: editForm.sku || null,
      unit_of_measure: editForm.unit_of_measure,
      min_stock_level: Number(editForm.min_stock_level),
      unit_cost: editForm.unit_cost ? Number(editForm.unit_cost) : null,
    };
    if (editForm.category_id) payload.category_id = editForm.category_id;

    router.put(`/inventory/items/${editItem.id}`, payload, {
      onSuccess: () => setShowEditModal(false),
      onError: () => setEditError('No se pudo actualizar el artículo.'),
      onFinish: () => setEditSaving(false),
    });
  }

  function setEdit(field: string, value: string) { setEditForm(f => ({ ...f, [field]: value })); }

  // ── Delete handler ────────────────────────────────────────────────────────
  function handleDelete(item: InventoryItem) {
    if (!confirm(`¿Eliminar "${item.name}" del inventario? El historial de movimientos se conservará.`)) return;
    router.delete(`/inventory/items/${item.id}`, {
      onError: () => alert('No se pudo eliminar el producto. Intenta de nuevo.'),
    });
  }

  // ── Movement handlers ─────────────────────────────────────────────────────
  function openMovementModal(item?: InventoryItem) {
    setMovementForm({ ...emptyMovement(), item_id: item?.id ?? '' });
    setMovementError(null);
    setShowMovementModal(true);
  }

  function handleMovementSubmit(e?: React.FormEvent | React.MouseEvent) {
    if (e) e.preventDefault();
    if (!movementForm.item_id || !movementForm.quantity || Number(movementForm.quantity) <= 0) {
      setMovementError('Selecciona un producto e ingresa una cantidad válida.');
      return;
    }
    setMovementSaving(true);
    router.post('/inventory/movements', {
      item_id: movementForm.item_id,
      movement_type: movementForm.movement_type,
      quantity: Number(movementForm.quantity),
      notes: movementForm.notes || null,
    }, {
      onSuccess: () => setShowMovementModal(false),
      onError: () => setMovementError('No se pudo registrar el movimiento.'),
      onFinish: () => setMovementSaving(false),
    });
  }

  function setMov(field: string, value: string) { setMovementForm(f => ({ ...f, [field]: value })); }

  // ── Category handlers ─────────────────────────────────────────────────────
  function handleCreateQuickCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCategorySaving(true);
    setCategoryError(null);
    router.post('/inventory/categories', { name: newCategoryName.trim() }, {
      onSuccess: (page) => {
        const updated = (page.props.categories as Category[]) || [];
        setCategories(updated);
        const created = updated.find(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase());
        if (created) set('category_id', created.id);
        setNewCategoryName('');
        setIsCreatingCategory(false);
      },
      onError: () => setCategoryError('No se pudo crear la categoría.'),
      onFinish: () => setCategorySaving(false),
    });
  }

  function handleDeleteCategory(id: string) {
    if (!confirm('¿Eliminar esta categoría?')) return;
    router.delete(`/inventory/categories/${id}`, {
      onError: (errors: any) => alert(errors.error || 'No se pudo eliminar la categoría.'),
    });
  }

  // ── Movement type config ──────────────────────────────────────────────────
  const MOVEMENT_TYPES = [
    { value: 'in', label: 'Entrada de stock', icon: <ArrowDown className="w-4 h-4 text-emerald-500" /> },
    { value: 'out', label: 'Salida de stock', icon: <ArrowUp className="w-4 h-4 text-red-500" /> },
    { value: 'adjustment', label: 'Ajuste de stock', icon: <SlidersHorizontal className="w-4 h-4 text-blue-500" /> },
  ] as const;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={`${activeTab === 'pos' ? 'p-3 sm:p-4 pb-2 h-full flex flex-col overflow-hidden' : 'p-4 sm:p-8 min-h-screen'} bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] transition-colors duration-200`}>

      {/* Header */}
      <div className={`${activeTab === 'pos' ? 'mb-3' : 'mb-8'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`${activeTab === 'pos' ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'} font-bold text-[#111827] dark:text-[#F8FAFC]`}>
              {activeTab === 'pos' ? 'Punto de Venta (POS)' : 'Inventario'}
            </h1>
            {activeTab === 'pos' && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                ● Caja Activa
              </span>
            )}
          </div>
          <p className="text-[#6B7280] dark:text-[#94A3B8] text-xs sm:text-sm">
            {activeTab === 'pos'
              ? 'Módulo de caja y venta directa sin necesidad de scroll'
              : 'Control de materiales odontológicos por clínica (SaaS)'}
          </p>
        </div>

        {/* Action Buttons Top */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {activeTab === 'inventory' ? (
            <>
              {/* Botón Venta POS */}
              <Button
                type="button"
                onClick={() => handleTabChange('pos')}
                className="h-11 bg-gradient-to-r from-[#0284C7] to-[#0369A1] hover:from-[#075985] hover:to-[#0C4A6E] text-white rounded-xl shadow-md shadow-[#0284C7]/20 px-5 gap-2 cursor-pointer transition-all font-semibold"
              >
                <ShoppingCart className="w-4 h-4" />
                Venta POS
              </Button>

              <Button
                variant="outline"
                onClick={() => openMovementModal()}
                className="h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-gray-700 dark:text-gray-200 hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] rounded-xl px-4 gap-2 cursor-pointer transition-colors"
              >
                <ArrowUpDown className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
                Movimiento
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCategoryModal(true)}
                className="h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-gray-700 dark:text-gray-200 hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] rounded-xl px-4 gap-2 cursor-pointer transition-colors"
              >
                <Tags className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
                Categorías ({categories.length})
              </Button>
              <Button
                onClick={openModal}
                className="h-11 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-xl shadow-lg shadow-[#0284C7]/20 px-5 gap-2 cursor-pointer transition-colors font-medium"
              >
                <Plus className="w-5 h-5" /> Nuevo Producto
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setShowThermalModal(true)}
                className="h-9 sm:h-10 border-sky-300/60 dark:border-sky-800 bg-[#F0F9FF] dark:bg-sky-950/40 text-[#0369A1] dark:text-[#38BDF8] hover:bg-[#BAE6FD] dark:hover:bg-sky-900/60 rounded-xl px-3 sm:px-4 gap-1.5 cursor-pointer transition-all font-semibold shadow-sm text-xs sm:text-sm"
              >
                <Printer className="w-4 h-4 text-[#0369A1] dark:text-[#38BDF8]" />
                Imprimir Ventas
              </Button>

              <Button
                variant="outline"
                onClick={() => handleTabChange('inventory')}
                className="h-9 sm:h-10 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-gray-700 dark:text-gray-200 hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] rounded-xl px-3 sm:px-4 gap-1.5 cursor-pointer transition-colors font-semibold text-xs sm:text-sm"
              >
                <Boxes className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
                Inventario
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Body: POS View or Inventory Table */}
      {activeTab === 'pos' ? (
        <PosSaleSystem
          items={items}
          categories={categories}
          patients={patients}
          accounts={accounts}
          clinic={clinic}
          onOpenThermalTickets={() => setShowThermalModal(true)}
          onClose={() => handleTabChange('inventory')}
        />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] shadow-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-[#F0F9FF] dark:bg-[#0284C7]/10 flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-[#0284C7] dark:text-[#38BDF8]" />
                </div>
                <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mb-1">Total de Productos</p>
                <p className="text-3xl font-bold text-[#111827] dark:text-[#F8FAFC]">{totalItems}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] shadow-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] dark:bg-amber-950/40 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-[#F59E0B] dark:text-amber-400" />
                </div>
                <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mb-1">Stock Bajo o Agotado</p>
                <p className="text-3xl font-bold text-[#111827] dark:text-[#F8FAFC]">{lowCount}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] shadow-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-[#F0F9FF] dark:bg-[#0284C7]/10 flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-[#0284C7] dark:text-[#38BDF8]" />
                </div>
                <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mb-1">En Stock</p>
                <p className="text-3xl font-bold text-[#111827] dark:text-[#F8FAFC]">{okCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280] dark:text-[#94A3B8]" />
            <Input
              type="text"
              placeholder="Buscar producto, SKU o categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-12 rounded-xl border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#9CA3AF] dark:placeholder:text-[#64748B] focus:border-[#0284C7] focus:ring-[#0284C7]"
            />
          </div>

          {/* Table */}
          <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#111827] dark:text-[#F8FAFC]">Lista de Productos</CardTitle>
              <CardDescription className="text-[#6B7280] dark:text-[#94A3B8]">Gestión de stock y materiales</CardDescription>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-[#9CA3AF]">
                  <Boxes className="w-12 h-12 text-[#D1D5DB] dark:text-gray-600 mb-3" />
                  <p className="text-sm">No hay productos en el inventario.</p>
                  <Button size="sm" variant="ghost" onClick={openModal} className="mt-3 text-[#0284C7] hover:bg-[#F0F9FF] dark:hover:bg-[#1E293B]">
                    <Plus className="w-4 h-4 mr-1" /> Agregar primer producto
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#F8FAFC] dark:bg-[#111827] border-b border-[#E5E7EB] dark:border-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#111827]">
                        <TableHead className="text-[#111827] dark:text-[#F8FAFC] font-semibold">Producto</TableHead>
                        <TableHead className="text-[#111827] dark:text-[#F8FAFC] font-semibold">Categoría</TableHead>
                        <TableHead className="text-[#111827] dark:text-[#F8FAFC] font-semibold text-center">Stock Actual</TableHead>
                        <TableHead className="text-[#111827] dark:text-[#F8FAFC] font-semibold text-center">Stock Mínimo</TableHead>
                        <TableHead className="text-[#111827] dark:text-[#F8FAFC] font-semibold">Unidad</TableHead>
                        <TableHead className="text-[#111827] dark:text-[#F8FAFC] font-semibold">Estado</TableHead>
                        <TableHead className="text-[#111827] dark:text-[#F8FAFC] font-semibold text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-10 text-[#9CA3AF]">
                            No hay resultados para "{search}"
                          </TableCell>
                        </TableRow>
                      ) : (
                        filtered.map((item) => {
                          const st = stockStatus(item);
                          const cfg = STATUS_CFG[st];
                          const needsRestock = st !== 'ok';
                          return (
                            <TableRow key={item.id} className="border-b border-[#E5E7EB] dark:border-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/60 transition-colors">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${needsRestock ? 'bg-[#FEF3C7] dark:bg-amber-950/40' : 'bg-[#F0F9FF] dark:bg-sky-950/40'}`}>
                                    <Package className={`w-4 h-4 ${needsRestock ? 'text-[#F59E0B] dark:text-amber-400' : 'text-[#0284C7] dark:text-[#38BDF8]'}`} />
                                  </div>
                                  <div>
                                    <p className="text-[#111827] dark:text-[#F8FAFC] text-sm font-medium">{item.name}</p>
                                    {item.sku && <p className="text-xs text-[#9CA3AF]">SKU: {item.sku}</p>}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-[#F8FAFC] dark:bg-[#111827] text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#F8FAFC] border border-[#D1D5DB] dark:border-[#1E293B]">
                                  {item.category?.name ?? '—'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`font-semibold text-base ${needsRestock ? 'text-[#F59E0B] dark:text-amber-400' : 'text-[#111827] dark:text-[#F8FAFC]'}`}>
                                  {item.current_stock}
                                </span>
                              </TableCell>
                              <TableCell className="text-center text-[#6B7280] dark:text-[#94A3B8]">
                                {item.min_stock_level}
                              </TableCell>
                              <TableCell className="text-[#6B7280] dark:text-[#94A3B8] text-sm">{item.unit}</TableCell>
                              <TableCell>
                                <Badge className={`border-0 ${cfg.className}`}>{cfg.label}</Badge>
                              </TableCell>

                              {/* ── Actions column ── */}
                              <TableCell>
                                <div className="flex items-center justify-center gap-1">
                                  {/* Movement */}
                                  <button
                                    type="button"
                                    onClick={() => openMovementModal(item)}
                                    title="Registrar movimiento de stock"
                                    className="p-1.5 rounded-lg text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0284C7] dark:hover:text-[#38BDF8] hover:bg-[#F0F9FF] dark:hover:bg-sky-950/40 transition-colors cursor-pointer"
                                  >
                                    <ArrowUpDown className="w-4 h-4" />
                                  </button>
                                  {/* Edit */}
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(item)}
                                    title="Editar producto"
                                    className="p-1.5 rounded-lg text-[#6B7280] dark:text-[#94A3B8] hover:text-[#3B82F6] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  {/* Delete */}
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(item)}
                                    title="Eliminar producto"
                                    className="p-1.5 rounded-lg text-[#6B7280] dark:text-[#94A3B8] hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alert Card */}
          {lowItems.length > 0 && (
            <Card className="mt-6 rounded-2xl border-[#E5E7EB] dark:border-[#1E293B] bg-gradient-to-br from-[#FEF3C7] to-white dark:from-amber-950/30 dark:to-[#0F172A] shadow-sm">
              <CardHeader>
                <CardTitle className="text-[#111827] dark:text-[#F8FAFC] flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#F59E0B] dark:text-amber-400" />
                  Alertas de Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#6B7280] dark:text-[#94A3B8] mb-4">
                  {lowItems.length} {lowItems.length === 1 ? 'producto necesita' : 'productos necesitan'} ser reabastecido{lowItems.length > 1 ? 's' : ''}.
                </p>
                <div className="space-y-2">
                  {lowItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#111827] border border-[#F59E0B]/20 dark:border-amber-800/40">
                      <span className="text-sm font-medium text-[#111827] dark:text-[#F8FAFC]">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[#FEF3C7] dark:bg-amber-950/50 text-[#F59E0B] dark:text-amber-300 hover:bg-[#FEF3C7] border-0">
                          {item.current_stock} {item.unit}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => openMovementModal(item)}
                          className="text-xs font-semibold text-[#0284C7] dark:text-[#38BDF8] hover:underline cursor-pointer"
                        >
                          Reabastecer →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ─── Create Product Modal ─── */}
      <Dialog open={showModal} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-lg rounded-2xl bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
          <DialogHeader>
            <DialogTitle className="text-[#111827] dark:text-[#F8FAFC]">Nuevo Producto</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {saveError && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl px-4 py-3 border border-red-200 dark:border-red-800/40">{saveError}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Nombre del producto *</Label>
                <Input placeholder="Ej. Guantes de látex (caja)" value={form.name} onChange={(e) => set('name', e.target.value)}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]" />
              </div>

              <div className="col-span-2 sm:col-span-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Categoría *</Label>
                  <button type="button" onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                    className="text-xs text-[#0284C7] dark:text-[#38BDF8] hover:underline cursor-pointer font-medium">
                    {isCreatingCategory ? 'Cancelar' : '+ Nueva'}
                  </button>
                </div>
                {isCreatingCategory ? (
                  <div className="p-2.5 rounded-xl bg-[#F0F9FF] dark:bg-[#0284C7]/10 border border-[#BAE6FD] dark:border-[#0284C7]/30 space-y-2">
                    <Input placeholder="Nombre de nueva categoría..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
                      className="h-9 text-xs rounded-lg border-[#BAE6FD] dark:border-[#0284C7]/40 bg-white dark:bg-[#0F172A]" />
                    {categoryError && <p className="text-xs text-red-500">{categoryError}</p>}
                    <Button type="button" size="sm" disabled={categorySaving || !newCategoryName.trim()} onClick={handleCreateQuickCategory}
                      className="w-full h-8 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs rounded-lg font-medium cursor-pointer">
                      {categorySaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                      Guardar y seleccionar
                    </Button>
                  </div>
                ) : (
                  <Select value={form.category_id} onValueChange={(v) => set('category_id', v)}>
                    <SelectTrigger className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]">
                      <SelectValue placeholder={categories.length ? 'Seleccionar...' : 'Sin categorías'} />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B]">
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="col-span-2 sm:col-span-1 space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">SKU / Código</Label>
                <Input placeholder="Opcional" value={form.sku} onChange={(e) => set('sku', e.target.value)}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Unidad de medida *</Label>
                <Input placeholder="pza, caja, ml..." value={form.unit_of_measure} onChange={(e) => set('unit_of_measure', e.target.value)}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Costo unitario</Label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.unit_cost} onChange={(e) => set('unit_cost', e.target.value)}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Stock inicial</Label>
                <Input type="number" min="0" value={form.current_stock} onChange={(e) => set('current_stock', e.target.value)}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Stock mínimo</Label>
                <Input type="number" min="0" value={form.min_stock_level} onChange={(e) => set('min_stock_level', e.target.value)}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]" />
              </div>
            </div>
          </form>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} className="border-gray-200 dark:border-[#1E293B] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1E293B]">Cancelar</Button>
            <Button disabled={saving} className="bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-[#0284C7]/20 cursor-pointer" onClick={handleSubmit as any}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</> : 'Agregar producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Product Modal ─── */}
      <Dialog open={showEditModal} onOpenChange={(open) => !open && setShowEditModal(false)}>
        <DialogContent className="max-w-lg rounded-2xl bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
          <DialogHeader>
            <DialogTitle className="text-[#111827] dark:text-[#F8FAFC] flex items-center gap-2">
              <Pencil className="w-4 h-4 text-[#0284C7]" />
              Editar Producto
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            {editError && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl px-4 py-3 border border-red-200 dark:border-red-800/40">{editError}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Nombre del producto *</Label>
                <Input value={editForm.name} onChange={(e) => setEdit('name', e.target.value)}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]" />
              </div>

              <div className="col-span-2 sm:col-span-1 space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Categoría</Label>
                <Select value={editForm.category_id} onValueChange={(v) => setEdit('category_id', v)}>
                  <SelectTrigger className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B]">
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 sm:col-span-1 space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">SKU / Código</Label>
                <Input value={editForm.sku} onChange={(e) => setEdit('sku', e.target.value)}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Unidad de medida *</Label>
                <Input value={editForm.unit_of_measure} onChange={(e) => setEdit('unit_of_measure', e.target.value)}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Costo unitario</Label>
                <Input type="number" min="0" step="0.01" value={editForm.unit_cost} onChange={(e) => setEdit('unit_cost', e.target.value)}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Stock mínimo</Label>
                <Input type="number" min="0" value={editForm.min_stock_level} onChange={(e) => setEdit('min_stock_level', e.target.value)}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]" />
              </div>
            </div>
          </form>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)} className="border-gray-200 dark:border-[#1E293B] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1E293B]">Cancelar</Button>
            <Button disabled={editSaving} className="bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-[#0284C7]/20 cursor-pointer" onClick={handleEditSubmit as any}>
              {editSaving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</> : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Stock Movement Modal ─── */}
      <Dialog open={showMovementModal} onOpenChange={(open) => !open && setShowMovementModal(false)}>
        <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
          <DialogHeader>
            <DialogTitle className="text-[#111827] dark:text-[#F8FAFC] flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-[#0284C7]" />
              Registrar Movimiento de Stock
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleMovementSubmit} className="space-y-4 py-2">
            {movementError && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl px-4 py-3 border border-red-200 dark:border-red-800/40">{movementError}</div>
            )}

            {/* Tipo de movimiento */}
            <div className="grid grid-cols-3 gap-2">
              {MOVEMENT_TYPES.map((mt) => (
                <button
                  key={mt.value}
                  type="button"
                  onClick={() => setMov('movement_type', mt.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all cursor-pointer text-sm font-medium ${movementForm.movement_type === mt.value
                      ? 'border-[#0284C7] bg-[#F0F9FF] dark:bg-sky-950/40 text-[#0369A1] dark:text-[#38BDF8]'
                      : 'border-[#E5E7EB] dark:border-[#1E293B] text-[#6B7280] dark:text-[#94A3B8] hover:border-[#0284C7]/40 hover:bg-[#F0F9FF]/50 dark:hover:bg-sky-950/20'
                    }`}
                >
                  {mt.icon}
                  <span className="text-xs leading-tight text-center">{mt.label}</span>
                </button>
              ))}
            </div>

            {/* Producto */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Producto *</Label>
              <Select value={movementForm.item_id} onValueChange={(v) => setMov('item_id', v)}>
                <SelectTrigger className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]">
                  <SelectValue placeholder="Seleccionar producto..." />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B]">
                  {items.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name} ({i.current_stock} {i.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cantidad */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">
                {movementForm.movement_type === 'adjustment' ? 'Nuevo stock total *' : 'Cantidad *'}
              </Label>
              <Input
                type="number"
                min={movementForm.movement_type === 'adjustment' ? '0' : '1'}
                step="1"
                placeholder={movementForm.movement_type === 'adjustment' ? 'Nuevo valor absoluto' : 'Cantidad a mover'}
                value={movementForm.quantity}
                onChange={(e) => setMov('quantity', e.target.value)}
                className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
              />
              {movementForm.movement_type === 'adjustment' && (
                <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">El stock quedará exactamente en el valor que ingreses.</p>
              )}
            </div>

            {/* Notas */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Notas (opcional)</Label>
              <Input
                placeholder="Ej. Compra a proveedor X, uso en procedimiento..."
                value={movementForm.notes}
                onChange={(e) => setMov('notes', e.target.value)}
                className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
              />
            </div>
          </form>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMovementModal(false)} className="border-gray-200 dark:border-[#1E293B] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1E293B]">Cancelar</Button>
            <Button disabled={movementSaving} className="bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-[#0284C7]/20 cursor-pointer" onClick={handleMovementSubmit as any}>
              {movementSaving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Registrando...</> : 'Registrar movimiento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Manage Categories Modal ─── */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
          <DialogHeader>
            <DialogTitle className="text-[#111827] dark:text-[#F8FAFC] flex items-center gap-2">
              <Tags className="w-5 h-5 text-[#0284C7] dark:text-[#38BDF8]" />
              Categorías de Inventario
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <form onSubmit={handleCreateQuickCategory} className="flex gap-2">
              <Input
                placeholder="Nueva categoría (ej. Ortodoncia)..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="h-10 rounded-xl border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-sm"
              />
              <Button type="submit" disabled={categorySaving || !newCategoryName.trim()}
                className="h-10 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-xl px-4 cursor-pointer font-medium text-sm flex-shrink-0">
                {categorySaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </form>
            {categoryError && <p className="text-xs text-red-500">{categoryError}</p>}

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
              {categories.length === 0 ? (
                <p className="text-center text-sm text-[#9CA3AF] py-6">No hay categorías registradas.</p>
              ) : (
                categories.map((c) => {
                  const count = items.filter(i => i.category?.id === c.id || (i as any).category_id === c.id).length;
                  return (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B]">
                      <div>
                        <p className="text-sm font-medium text-[#111827] dark:text-[#F8FAFC]">{c.name}</p>
                        {c.description && <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">{c.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-white dark:bg-[#0F172A] text-[#6B7280] dark:text-[#94A3B8] border border-[#E5E7EB] dark:border-[#1E293B] text-xs">
                          {count} {count === 1 ? 'producto' : 'productos'}
                        </Badge>
                        {count === 0 && (
                          <button type="button" onClick={() => handleDeleteCategory(c.id)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer" title="Eliminar categoría">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryModal(false)}
              className="border-gray-200 dark:border-[#1E293B] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1E293B]">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Thermal Ticket & Sales Print Modal ─── */}
      <PosThermalTicketModal
        open={showThermalModal}
        onOpenChange={setShowThermalModal}
        sales={sales}
        clinic={clinic}
        initialSelectedSale={selectedThermalSale}
      />
    </div>
  );
}

Inventory.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;


