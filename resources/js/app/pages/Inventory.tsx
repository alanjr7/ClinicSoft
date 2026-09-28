import { useState, useMemo, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import {
  Package, AlertTriangle, CheckCircle, Search, Plus, Loader2,
  Boxes, Tags, Trash2, Pencil, ArrowUpDown, ArrowDown, ArrowUp,
  SlidersHorizontal, Pill, ShoppingCart, Receipt, Printer, User,
  DollarSign, CreditCard, QrCode, History, Sparkles, Minus, X, Check, FileText
} from 'lucide-react';
import Layout from '../components/Layout';
import { Button }  from '../components/ui/button';
import { Input }   from '../components/ui/input';
import { Label }   from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge }   from '../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';

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
  category_id?: string | null;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  national_id?: string | null;
  phone?: string | null;
}

interface AccountingAccount {
  id: string;
  code: string;
  name: string;
}

interface PosSaleItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface PosSale {
  id: string;
  ticket_number: string;
  date: string;
  patient_name: string;
  patient_ci?: string | null;
  payment_method: string;
  items: PosSaleItem[];
  subtotal: number;
  discount: number;
  tax_amount: number;
  total: number;
  received_amount: number;
  change_amount: number;
  notes?: string | null;
  cashier: string;
  clinic?: {
    name: string;
    address?: string;
    phone?: string;
    currency?: string;
  };
}

interface Props {
  items:        InventoryItem[];
  categories:   Category[];
  filters:      { search: string };
  patients?:    Patient[];
  accounts?:    AccountingAccount[];
  sales?:       PosSale[];
  clinic?:      {
    name: string;
    address?: string;
    phone?: string;
    currency?: string;
    logo_url?: string;
  };
}

interface CartItem {
  item: InventoryItem;
  quantity: number;
  price: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function stockStatus(item: InventoryItem): 'out' | 'low' | 'ok' {
  if (item.current_stock <= 0)                    return 'out';
  if (item.current_stock <= item.min_stock_level) return 'low';
  return 'ok';
}

const STATUS_CFG = {
  ok:  { label: 'En Stock',   className: 'bg-[#F0FDFA] dark:bg-teal-950/40 text-[#14B8A6] dark:text-[#2DD4BF] hover:bg-[#F0FDFA]' },
  low: { label: 'Stock Bajo', className: 'bg-[#FEF3C7] dark:bg-amber-950/40 text-[#F59E0B] dark:text-amber-400 hover:bg-[#FEF3C7]' },
  out: { label: 'Agotado',    className: 'bg-[#FEE2E2] dark:bg-red-950/40 text-[#EF4444] dark:text-red-400 hover:bg-[#FEE2E2]' },
} as const;

function emptyForm() {
  return { name: '', category_id: '', sku: '', unit_of_measure: 'pza', min_stock_level: '0', current_stock: '0', unit_cost: '' };
}

function emptyMovement() {
  return { item_id: '', movement_type: 'in' as 'in' | 'out' | 'adjustment', quantity: '', notes: '' };
}

Inventory.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

export default function Inventory({
  items = [],
  categories: initialCategories = [],
  filters = { search: '' },
  patients = [],
  accounts = [],
  sales = [],
  clinic,
}: Props) {
  // ── Main view toggle ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab]             = useState<'inventory' | 'pharmacy'>('pharmacy');
  const [pharmacySubTab, setPharmacySubTab]   = useState<'pos' | 'history'>('pos');

  // ── General State ─────────────────────────────────────────────────────────
  const [search, setSearch]                   = useState(filters.search ?? '');
  const [categories, setCategories]           = useState<Category[]>(initialCategories);

  // ── Create modal ──
  const [showModal, setShowModal]             = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [saveError, setSaveError]             = useState<string | null>(null);
  const [form, setForm]                       = useState(emptyForm);

  // ── Edit modal ──
  const [showEditModal, setShowEditModal]     = useState(false);
  const [editItem, setEditItem]               = useState<InventoryItem | null>(null);
  const [editForm, setEditForm]               = useState(emptyForm);
  const [editSaving, setEditSaving]           = useState(false);
  const [editError, setEditError]             = useState<string | null>(null);

  // ── Movement modal ──
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementForm, setMovementForm]           = useState(emptyMovement);
  const [movementSaving, setMovementSaving]       = useState(false);
  const [movementError, setMovementError]         = useState<string | null>(null);

  // ── Category modal ──
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName]       = useState('');
  const [categorySaving, setCategorySaving]         = useState(false);
  const [categoryError, setCategoryError]           = useState<string | null>(null);

  // ── Pharmacy POS State ────────────────────────────────────────────────────
  const [posSearch, setPosSearch]             = useState('');
  const [posCategoryFilter, setPosCategoryFilter] = useState('all');
  const [cart, setCart]                       = useState<CartItem[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('walkin');
  const [walkinName, setWalkinName]           = useState('');
  const [walkinCi, setWalkinCi]               = useState('');
  const [paymentMethod, setPaymentMethod]     = useState<'cash' | 'card' | 'transfer' | 'other'>('cash');
  const [accountId, setAccountId]             = useState<string>(accounts[0]?.id ?? '');
  const [discount, setDiscount]               = useState<string>('0');
  const [receivedAmount, setReceivedAmount]   = useState<string>('');
  const [posNotes, setPosNotes]               = useState('');
  const [posSaving, setPosSaving]             = useState(false);
  const [posError, setPosError]               = useState<string | null>(null);

  // ── Ticket Modal State ────────────────────────────────────────────────────
  const [printedTicket, setPrintedTicket]     = useState<PosSale | null>(null);
  const ticketRef                             = useRef<HTMLDivElement>(null);

  useEffect(() => { setCategories(initialCategories); }, [initialCategories]);

  // ── Currency ──────────────────────────────────────────────────────────────
  const currencySymbol = clinic?.currency === 'USD' ? '$' : 'Bs';

  // ── Client-side search for General Inventory ──────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      (i.sku ?? '').toLowerCase().includes(q) ||
      (i.category?.name ?? '').toLowerCase().includes(q)
    );
  }, [items, search]);

  // ── Pharmacy Items Filter ─────────────────────────────────────────────────
  const pharmacyFiltered = useMemo(() => {
    const q = posSearch.toLowerCase();
    return items.filter(i => {
      const matchSearch = i.name.toLowerCase().includes(q) ||
        (i.sku ?? '').toLowerCase().includes(q) ||
        (i.category?.name ?? '').toLowerCase().includes(q);
      const matchCategory = posCategoryFilter === 'all' || (i.category?.id === posCategoryFilter || i.category_id === posCategoryFilter);
      return matchSearch && matchCategory;
    });
  }, [items, posSearch, posCategoryFilter]);

  // ── General Inventory Stats ───────────────────────────────────────────────
  const totalItems = items.length;
  const lowCount   = items.filter(i => stockStatus(i) !== 'ok').length;
  const okCount    = items.filter(i => stockStatus(i) === 'ok').length;
  const lowItems   = items.filter(i => stockStatus(i) !== 'ok');

  // ── POS Calculations ──────────────────────────────────────────────────────
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const numericDiscount = Number(discount) || 0;
  const cartTotal = Math.max(0, cartSubtotal - numericDiscount);
  const numericReceived = Number(receivedAmount) || (paymentMethod === 'cash' ? cartTotal : cartTotal);
  const changeDue = Math.max(0, numericReceived - cartTotal);

  // ── General Handlers ──────────────────────────────────────────────────────
  function openModal() { setForm(emptyForm()); setSaveError(null); setIsCreatingCategory(false); setShowModal(true); }
  function closeModal() { setShowModal(false); setSaveError(null); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.category_id || !form.unit_of_measure) {
      setSaveError('Nombre, categoría y unidad son obligatorios.');
      return;
    }
    setSaving(true);
    router.post('/inventory/items', {
      name:             form.name,
      category_id:      form.category_id,
      sku:              form.sku || null,
      unit_of_measure:  form.unit_of_measure,
      min_stock_level:  Number(form.min_stock_level),
      current_stock:    Number(form.current_stock),
      unit_cost:        form.unit_cost ? Number(form.unit_cost) : null,
    }, {
      onSuccess: closeModal,
      onError:   () => setSaveError('No se pudo crear el artículo. Verifica los datos.'),
      onFinish:  () => setSaving(false),
    });
  }

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })); }

  function openEditModal(item: InventoryItem) {
    setEditItem(item);
    setEditForm({
      name:            item.name,
      category_id:     item.category?.id ?? (item as any).category_id ?? '',
      sku:             item.sku ?? '',
      unit_of_measure: item.unit,
      min_stock_level: String(item.min_stock_level),
      current_stock:   String(item.current_stock),
      unit_cost:       item.unit_cost != null ? String(item.unit_cost) : '',
    });
    setEditError(null);
    setShowEditModal(true);
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editItem || !editForm.name || !editForm.unit_of_measure) {
      setEditError('Nombre y unidad son obligatorios.');
      return;
    }
    setEditSaving(true);
    const payload: Record<string, any> = {
      name:             editForm.name,
      sku:              editForm.sku || null,
      unit_of_measure:  editForm.unit_of_measure,
      min_stock_level:  Number(editForm.min_stock_level),
      unit_cost:        editForm.unit_cost ? Number(editForm.unit_cost) : null,
    };
    if (editForm.category_id) payload.category_id = editForm.category_id;

    router.put(`/inventory/items/${editItem.id}`, payload, {
      onSuccess: () => setShowEditModal(false),
      onError:   () => setEditError('No se pudo actualizar el artículo.'),
      onFinish:  () => setEditSaving(false),
    });
  }

  function setEdit(field: string, value: string) { setEditForm(f => ({ ...f, [field]: value })); }

  function handleDelete(item: InventoryItem) {
    if (!confirm(`¿Eliminar "${item.name}" del inventario? El historial de movimientos se conservará.`)) return;
    router.delete(`/inventory/items/${item.id}`, {
      onError: () => alert('No se pudo eliminar el producto. Intenta de nuevo.'),
    });
  }

  function openMovementModal(item?: InventoryItem) {
    setMovementForm({ ...emptyMovement(), item_id: item?.id ?? '' });
    setMovementError(null);
    setShowMovementModal(true);
  }

  function handleMovementSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!movementForm.item_id || !movementForm.quantity || Number(movementForm.quantity) <= 0) {
      setMovementError('Selecciona un producto e ingresa una cantidad válida.');
      return;
    }
    setMovementSaving(true);
    router.post('/inventory/movements', {
      item_id:       movementForm.item_id,
      movement_type: movementForm.movement_type,
      quantity:      Number(movementForm.quantity),
      notes:         movementForm.notes || null,
    }, {
      onSuccess: () => setShowMovementModal(false),
      onError:   () => setMovementError('No se pudo registrar el movimiento.'),
      onFinish:  () => setMovementSaving(false),
    });
  }

  function setMov(field: string, value: string) { setMovementForm(f => ({ ...f, [field]: value })); }

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
      onError:  () => setCategoryError('No se pudo crear la categoría.'),
      onFinish: () => setCategorySaving(false),
    });
  }

  function handleDeleteCategory(id: string) {
    if (!confirm('¿Eliminar esta categoría?')) return;
    router.delete(`/inventory/categories/${id}`, {
      onError: (errors: any) => alert(errors.error || 'No se pudo eliminar la categoría.'),
    });
  }

  // ── POS Handlers ──────────────────────────────────────────────────────────
  function addToCart(item: InventoryItem) {
    if (item.current_stock <= 0) {
      alert('Este producto no tiene stock disponible.');
      return;
    }
    setCart((prev) => {
      const existing = prev.find(c => c.item.id === item.id);
      const defaultPrice = item.unit_cost && item.unit_cost > 0 ? item.unit_cost : 10;
      if (existing) {
        if (existing.quantity >= item.current_stock) {
          alert(`No puedes agregar más de ${item.current_stock} unidades disponibles.`);
          return prev;
        }
        return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { item, quantity: 1, price: defaultPrice }];
    });
  }

  function updateCartQty(itemId: string, delta: number) {
    setCart((prev) => {
      return prev.map(c => {
        if (c.item.id === itemId) {
          const newQty = c.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > c.item.current_stock) {
            alert(`Stock máximo alcanzado (${c.item.current_stock} ${c.item.unit})`);
            return c;
          }
          return { ...c, quantity: newQty };
        }
        return c;
      }).filter(Boolean) as CartItem[];
    });
  }

  function updateCartPrice(itemId: string, newPrice: number) {
    setCart(prev => prev.map(c => c.item.id === itemId ? { ...c, price: Math.max(0, newPrice) } : c));
  }

  function removeFromCart(itemId: string) {
    setCart(prev => prev.filter(c => c.item.id !== itemId));
  }

  function handleProcessPosSale(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) {
      setPosError('Agrega al menos un medicamento o producto al carrito.');
      return;
    }

    setPosSaving(true);
    setPosError(null);

    const isPatient = selectedPatientId && selectedPatientId !== 'walkin';
    const patientObj = isPatient ? patients.find(p => p.id === selectedPatientId) : null;

    const payload = {
      patient_id:       isPatient ? selectedPatientId : null,
      patient_name:     isPatient ? (patientObj ? `${patientObj.first_name} ${patientObj.last_name}` : '') : (walkinName.trim() || 'Cliente Mostrador'),
      patient_ci:       isPatient ? (patientObj?.national_id || '') : (walkinCi.trim() || null),
      payment_method:   paymentMethod,
      account_id:       accountId || null,
      discount_amount:  numericDiscount,
      received_amount:  numericReceived,
      notes:            posNotes.trim() || null,
      items:            cart.map(c => ({
        id:       c.item.id,
        quantity: c.quantity,
        price:    c.price,
      })),
    };

    router.post('/inventory/pos-sale', payload, {
      onSuccess: () => {
        // Build receipt object for direct viewing/reprinting
        const newTicketNumber = `POS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
        const receipt: PosSale = {
          id:             String(Date.now()),
          ticket_number:  newTicketNumber,
          date:           new Date().toLocaleString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          patient_name:   payload.patient_name,
          patient_ci:     payload.patient_ci,
          payment_method: paymentMethod,
          items: cart.map(c => ({
            id:         c.item.id,
            name:       c.item.name,
            unit:       c.item.unit,
            quantity:   c.quantity,
            unit_price: c.price,
            total:      c.price * c.quantity,
          })),
          subtotal:        cartSubtotal,
          discount:        numericDiscount,
          tax_amount:      0,
          total:           cartTotal,
          received_amount: numericReceived,
          change_amount:   changeDue,
          notes:           posNotes,
          cashier:         'Cajero / Farmacia',
          clinic: {
            name:     clinic?.name ?? 'ClinicSoft - Farmacia',
            address:  clinic?.address ?? '',
            phone:    clinic?.phone ?? '',
            currency: clinic?.currency ?? 'BOB',
          },
        };

        setPrintedTicket(receipt);
        setCart([]);
        setDiscount('0');
        setReceivedAmount('');
        setPosNotes('');
        setWalkinName('');
        setWalkinCi('');
        setSelectedPatientId('walkin');
      },
      onError: (errs: any) => {
        setPosError(errs.error || 'No se pudo procesar la venta. Verifica el stock disponible.');
      },
      onFinish: () => setPosSaving(false),
    });
  }

  function handlePrintTicket(ticketToPrint?: any) {
    // If called directly from onClick, React passes a SyntheticEvent instead of a ticket
    const ticket: PosSale | null = (ticketToPrint && typeof ticketToPrint === 'object' && 'ticket_number' in ticketToPrint)
      ? (ticketToPrint as PosSale)
      : printedTicket;

    if (!ticket) return;

    const clinicName = ticket.clinic?.name || clinic?.name || 'ClinicSoft';
    const clinicAddress = ticket.clinic?.address || clinic?.address || '';
    const clinicPhone = ticket.clinic?.phone || clinic?.phone || '';
    const curr = currencySymbol;
    const itemsList = Array.isArray(ticket.items) ? ticket.items : [];

    const itemsRows = itemsList.map(it => `
      <tr>
        <td style="padding: 3px 0; vertical-align: top;">
          <div style="font-weight: bold; font-size: 11px;">${it.name || 'Producto'}</div>
          <div style="font-size: 10px; color: #444;">${it.quantity || 1} ${it.unit || 'pza'} x ${curr} ${Number(it.unit_price || 0).toFixed(2)}</div>
        </td>
        <td style="padding: 3px 0; vertical-align: top; text-align: right; font-weight: bold; font-size: 11px;">
          ${curr} ${Number(it.total || 0).toFixed(2)}
        </td>
      </tr>
    `).join('');

    const discountHtml = (ticket.discount && ticket.discount > 0) ? `
      <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
        <span>Descuento:</span>
        <span>-${curr} ${Number(ticket.discount).toFixed(2)}</span>
      </div>
    ` : '';

    const changeHtml = (ticket.change_amount && ticket.change_amount > 0) ? `
      <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: bold; margin-top: 2px;">
        <span>Cambio:</span>
        <span>${curr} ${Number(ticket.change_amount).toFixed(2)}</span>
      </div>
    ` : '';

    const htmlContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Ticket ${ticket.ticket_number}</title>
    <style>
      @page {
        margin: 0;
        size: 80mm auto;
      }
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      body {
        font-family: 'Courier New', Courier, monospace, -apple-system, sans-serif;
        font-size: 11px;
        color: #000;
        background: #fff;
        width: 72mm;
        margin: 0 auto;
        padding: 4mm 2mm 8mm 2mm;
        line-height: 1.3;
      }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .font-bold { font-weight: bold; }
      .uppercase { text-transform: uppercase; }
      .header {
        text-align: center;
        padding-bottom: 6px;
        border-bottom: 1px dashed #000;
        margin-bottom: 6px;
      }
      .title {
        font-size: 13px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .subtitle {
        font-size: 10px;
        margin-top: 2px;
      }
      .section {
        padding-bottom: 5px;
        border-bottom: 1px dashed #000;
        margin-bottom: 5px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        margin-bottom: 2px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      .grand-total {
        font-size: 14px;
        font-weight: bold;
        border-top: 1px dashed #000;
        padding-top: 4px;
        margin-top: 4px;
        display: flex;
        justify-content: space-between;
      }
      .footer {
        text-align: center;
        font-size: 9px;
        margin-top: 8px;
        border-top: 1px dashed #000;
        padding-top: 6px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="title">${clinicName}</div>
      <div class="subtitle font-bold">FARMACIA & DISPENSACIÓN</div>
      ${clinicAddress ? `<div class="subtitle">${clinicAddress}</div>` : ''}
      ${clinicPhone ? `<div class="subtitle">Tel: ${clinicPhone}</div>` : ''}
    </div>

    <div class="section">
      <div class="row">
        <span class="font-bold">Ticket:</span>
        <span class="font-bold">${ticket.ticket_number || 'POS'}</span>
      </div>
      <div class="row">
        <span>Fecha:</span>
        <span>${ticket.date || ''}</span>
      </div>
      <div class="row">
        <span>Cliente:</span>
        <span class="font-bold">${ticket.patient_name || 'Cliente Mostrador'}</span>
      </div>
      ${ticket.patient_ci ? `
        <div class="row">
          <span>CI/NIT:</span>
          <span>${ticket.patient_ci}</span>
        </div>
      ` : ''}
      <div class="row">
        <span>Cajero:</span>
        <span>${ticket.cashier || 'Cajero'}</span>
      </div>
    </div>

    <div class="section">
      <div style="font-size: 9px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase;">Detalle de Medicamentos</div>
      <table>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
    </div>

    <div style="padding-bottom: 4px;">
      <div class="row" style="font-size: 11px;">
        <span>Subtotal:</span>
        <span>${curr} ${Number(ticket.subtotal || 0).toFixed(2)}</span>
      </div>
      ${discountHtml}
      <div class="grand-total">
        <span>TOTAL:</span>
        <span>${curr} ${Number(ticket.total || 0).toFixed(2)}</span>
      </div>
      <div class="row" style="margin-top: 4px;">
        <span>Método:</span>
        <span class="uppercase">${ticket.payment_method || 'EFECTIVO'}</span>
      </div>
      <div class="row">
        <span>Recibido:</span>
        <span>${curr} ${Number(ticket.received_amount || ticket.total || 0).toFixed(2)}</span>
      </div>
      ${changeHtml}
    </div>

    <div class="footer">
      <p>¡Gracias por su compra!</p>
      <p>Conserve este ticket como comprobante</p>
    </div>
  </body>
</html>`;

    let iframe = document.getElementById('ticket-print-frame') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'ticket-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Error printing ticket frame:', e);
        }
      }, 300);
    }
  }

  const MOVEMENT_TYPES = [
    { value: 'in',         label: 'Entrada de stock',  icon: <ArrowDown  className="w-4 h-4 text-emerald-500" /> },
    { value: 'out',        label: 'Salida de stock',   icon: <ArrowUp    className="w-4 h-4 text-red-500" /> },
    { value: 'adjustment', label: 'Ajuste de stock',   icon: <SlidersHorizontal className="w-4 h-4 text-blue-500" /> },
  ] as const;

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col p-3 sm:p-4 bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] overflow-hidden">

      {/* ─── Top Compact Header ─── */}
      <div className="flex items-center justify-between gap-2 shrink-0 pb-2.5 border-b border-[#E5E7EB] dark:border-[#1E293B]">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[#111827] dark:text-[#F8FAFC] tracking-tight">
            {activeTab === 'inventory' ? 'Inventario Clínico' : 'Farmacia & Punto de Venta'}
          </h1>
          <Badge className={`border-0 text-[11px] font-semibold px-2 py-0.5 ${activeTab === 'inventory' ? 'bg-[#F0FDFA] dark:bg-teal-950/50 text-[#14B8A6] dark:text-[#2DD4BF]' : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'}`}>
            {activeTab === 'inventory' ? 'Materiales & Insumos' : 'POS & Medicamentos'}
          </Badge>
        </div>

        {/* ── Main Module Switcher ── */}
        <div className="flex items-center p-1 bg-[#E2E8F0] dark:bg-[#1E293B] rounded-xl border border-[#CBD5E1] dark:border-[#334155]">
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-white dark:bg-[#0F172A] text-[#14B8A6] dark:text-[#2DD4BF] shadow-sm font-bold'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Inventario General</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pharmacy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'pharmacy'
                ? 'bg-[#14B8A6] text-white shadow-sm font-bold'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>Farmacia & POS</span>
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* VISTA 1: INVENTARIO GENERAL / ODONTOLÓGICO                                  */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'inventory' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pt-3 space-y-4 pr-1">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openMovementModal()}
                className="h-9 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-gray-700 dark:text-gray-200 rounded-xl px-3 gap-1.5 cursor-pointer text-xs"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[#14B8A6] dark:text-[#2DD4BF]" />
                Registrar Movimiento
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCategoryModal(true)}
                className="h-9 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-gray-700 dark:text-gray-200 rounded-xl px-3 gap-1.5 cursor-pointer text-xs"
              >
                <Tags className="w-3.5 h-3.5 text-[#14B8A6] dark:text-[#2DD4BF]" />
                Categorías ({categories.length})
              </Button>
            </div>
            <Button
              size="sm"
              onClick={openModal}
              className="h-9 bg-[#14B8A6] hover:bg-[#0F766E] text-white rounded-xl shadow-md shadow-[#14B8A6]/20 px-4 gap-1.5 cursor-pointer text-xs font-medium"
            >
              <Plus className="w-4 h-4" /> Nuevo Producto
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
            <Card className="rounded-xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#F0FDFA] dark:bg-[#14B8A6]/10 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-[#14B8A6] dark:text-[#2DD4BF]" />
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Total Productos</p>
                  <p className="text-xl font-bold text-[#111827] dark:text-[#F8FAFC]">{totalItems}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] dark:bg-amber-950/40 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-[#F59E0B] dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Stock Bajo / Agotado</p>
                  <p className="text-xl font-bold text-[#111827] dark:text-[#F8FAFC]">{lowCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#F0FDFA] dark:bg-[#14B8A6]/10 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-[#14B8A6] dark:text-[#2DD4BF]" />
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">En Stock Normal</p>
                  <p className="text-xl font-bold text-[#111827] dark:text-[#F8FAFC]">{okCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search bar */}
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] dark:text-[#94A3B8]" />
            <Input
              type="text"
              placeholder="Buscar material, código SKU o categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-xs"
            />
          </div>

          {/* Table Card */}
          <Card className="rounded-xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] shadow-sm flex-1 min-h-[300px]">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F8FAFC] dark:bg-[#111827] border-b border-[#E5E7EB] dark:border-[#1E293B]">
                      <TableHead className="text-xs font-semibold">Producto</TableHead>
                      <TableHead className="text-xs font-semibold">Categoría</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Stock Actual</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Stock Mínimo</TableHead>
                      <TableHead className="text-xs font-semibold">Unidad</TableHead>
                      <TableHead className="text-xs font-semibold">Estado</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-xs text-[#9CA3AF]">
                          No hay resultados para "{search}"
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((item) => {
                        const st = stockStatus(item);
                        const cfg = STATUS_CFG[st];
                        const needsRestock = st !== 'ok';
                        return (
                          <TableRow key={item.id} className="border-b border-[#E5E7EB] dark:border-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/60">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${needsRestock ? 'bg-[#FEF3C7] dark:bg-amber-950/40' : 'bg-[#F0FDFA] dark:bg-teal-950/40'}`}>
                                  <Package className={`w-3.5 h-3.5 ${needsRestock ? 'text-[#F59E0B] dark:text-amber-400' : 'text-[#14B8A6] dark:text-[#2DD4BF]'}`} />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-[#111827] dark:text-[#F8FAFC]">{item.name}</p>
                                  {item.sku && <p className="text-[10px] text-[#9CA3AF]">SKU: {item.sku}</p>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-[#F8FAFC] dark:bg-[#111827] text-[#6B7280] dark:text-[#94A3B8] border border-[#D1D5DB] dark:border-[#1E293B] text-[11px]">
                                {item.category?.name ?? '—'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center font-bold text-xs">
                              <span className={needsRestock ? 'text-[#F59E0B] dark:text-amber-400' : 'text-[#111827] dark:text-[#F8FAFC]'}>
                                {item.current_stock}
                              </span>
                            </TableCell>
                            <TableCell className="text-center text-xs text-[#6B7280] dark:text-[#94A3B8]">
                              {item.min_stock_level}
                            </TableCell>
                            <TableCell className="text-xs text-[#6B7280] dark:text-[#94A3B8]">{item.unit}</TableCell>
                            <TableCell>
                              <Badge className={`border-0 text-[11px] ${cfg.className}`}>{cfg.label}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openMovementModal(item)}
                                  title="Movimiento"
                                  className="p-1 rounded text-[#6B7280] hover:text-[#14B8A6] hover:bg-[#F0FDFA] cursor-pointer"
                                >
                                  <ArrowUpDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(item)}
                                  title="Editar"
                                  className="p-1 rounded text-[#6B7280] hover:text-blue-500 hover:bg-blue-50 cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(item)}
                                  title="Eliminar"
                                  className="p-1 rounded text-[#6B7280] hover:text-red-500 hover:bg-red-50 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
            </CardContent>
          </Card>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* VISTA 2: FARMACIA & PUNTO DE VENTA (POS) - 3 COLUMNAS SIN SCROLL           */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'pharmacy' && (
        <div className="flex-1 flex flex-col min-h-0 pt-2.5 overflow-hidden">
          
          {/* Sub Navigation Bar */}
          <div className="flex items-center justify-between gap-2 bg-white dark:bg-[#0F172A] px-3 py-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] shadow-sm shrink-0 mb-2.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPharmacySubTab('pos')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  pharmacySubTab === 'pos'
                    ? 'bg-[#14B8A6] text-white shadow-sm'
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Punto de Venta (POS)</span>
              </button>
              <button
                type="button"
                onClick={() => setPharmacySubTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  pharmacySubTab === 'history'
                    ? 'bg-[#14B8A6] text-white shadow-sm'
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Historial de Tickets ({sales.length})</span>
              </button>
            </div>
          </div>

          {/* ── SUB-VIEW: POS (3 COLUMNAS SIN SCROLL GLOBAL) ── */}
          {pharmacySubTab === 'pos' && (
            <div className="flex-1 grid grid-cols-12 gap-3 min-h-0 overflow-hidden">
              
              {/* ═════════════════════════════════════════════════════════════════ */}
              {/* COLUMNA 1: CATÁLOGO & BÚSQUEDA DE MEDICAMENTOS (4 cols)           */}
              {/* ═════════════════════════════════════════════════════════════════ */}
              <div className="col-span-12 lg:col-span-4 flex flex-col min-h-0 bg-white dark:bg-[#0F172A] rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] p-3 shadow-sm overflow-hidden">
                {/* Search input */}
                <div className="relative shrink-0 mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7280] dark:text-[#94A3B8]" />
                  <Input
                    type="text"
                    placeholder="Buscar fármaco o código..."
                    value={posSearch}
                    onChange={(e) => setPosSearch(e.target.value)}
                    className="pl-8 h-8 rounded-lg border-[#D1D5DB] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#111827] text-xs"
                  />
                </div>

                {/* Category quick chips */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1.5 shrink-0 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPosCategoryFilter('all')}
                    className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      posCategoryFilter === 'all'
                        ? 'bg-[#14B8A6] text-white font-bold'
                        : 'bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8]'
                    }`}
                  >
                    Todas ({items.length})
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setPosCategoryFilter(c.id)}
                      className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        posCategoryFilter === c.id
                          ? 'bg-[#14B8A6] text-white font-bold'
                          : 'bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8]'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>

                {/* Products List (Scrollable inside column) */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 mt-1">
                  {pharmacyFiltered.length === 0 ? (
                    <div className="text-center py-10 text-[#9CA3AF] text-xs">
                      <Pill className="w-8 h-8 mx-auto text-[#CBD5E1] mb-1" />
                      Sin medicamentos que coincidan.
                    </div>
                  ) : (
                    pharmacyFiltered.map((it) => {
                      const inCart = cart.find(c => c.item.id === it.id);
                      const isOutOfStock = it.current_stock <= 0;
                      const price = it.unit_cost && it.unit_cost > 0 ? it.unit_cost : 10;
                      return (
                        <div
                          key={it.id}
                          onClick={() => !isOutOfStock && addToCart(it)}
                          className={`p-2.5 rounded-xl border transition-all select-none flex items-center justify-between gap-2 ${
                            isOutOfStock
                              ? 'opacity-40 bg-[#F1F5F9] dark:bg-[#1E293B]/40 border-[#E2E8F0] dark:border-[#1E293B] cursor-not-allowed'
                              : 'bg-[#F8FAFC] dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1E293B] hover:border-[#14B8A6] hover:bg-white dark:hover:bg-[#0F172A] cursor-pointer shadow-xs'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-[#111827] dark:text-[#F8FAFC] truncate">
                                {it.name}
                              </span>
                              {inCart && (
                                <span className="bg-[#14B8A6] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0">
                                  x{inCart.quantity}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] truncate">
                              {it.category?.name ?? 'Medicamento'} • Stock: <span className={isOutOfStock ? 'text-red-500 font-bold' : 'font-medium'}>{it.current_stock} {it.unit}</span>
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="font-bold text-xs text-[#14B8A6] dark:text-[#2DD4BF]">
                              {currencySymbol} {Number(price).toFixed(2)}
                            </p>
                            <span className="text-[10px] text-[#9CA3AF] bg-white dark:bg-[#0F172A] px-1.5 py-0.5 rounded border border-[#E5E7EB] dark:border-[#1E293B]">
                              + Agregar
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ═════════════════════════════════════════════════════════════════ */}
              {/* COLUMNA 2: DETALLE DE VENTA / CARRITO (4 cols)                     */}
              {/* ═════════════════════════════════════════════════════════════════ */}
              <div className="col-span-12 lg:col-span-4 flex flex-col min-h-0 bg-white dark:bg-[#0F172A] rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] p-3 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9] dark:border-[#1E293B] shrink-0 mb-2">
                  <div className="flex items-center gap-1.5">
                    <ShoppingCart className="w-4 h-4 text-[#14B8A6]" />
                    <span className="font-bold text-xs text-[#111827] dark:text-[#F8FAFC]">
                      Carrito ({cart.length} {cart.length === 1 ? 'producto' : 'productos'})
                    </span>
                  </div>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCart([])}
                      className="text-[11px] text-red-500 hover:underline cursor-pointer"
                    >
                      Vaciar
                    </button>
                  )}
                </div>

                {/* Cart Items List (Scrollable inside column) */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-1.5">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-[#9CA3AF] py-8 text-xs">
                      <ShoppingCart className="w-7 h-7 text-[#CBD5E1] mb-1.5" />
                      <p>Carrito vacío.</p>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">Haz clic en los medicamentos de la izquierda para agregarlos.</p>
                    </div>
                  ) : (
                    cart.map((c) => (
                      <div
                        key={c.item.id}
                        className="p-2 rounded-xl bg-[#F8FAFC] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] flex flex-col gap-1.5"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] truncate flex-1">
                            {c.item.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(c.item.id)}
                            className="text-gray-400 hover:text-red-500 cursor-pointer p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          {/* Unit price input */}
                          <div className="flex items-center gap-1 text-[11px] text-[#6B7280]">
                            <span>P. Unit: {currencySymbol}</span>
                            <input
                              type="number"
                              min="0"
                              step="0.10"
                              value={c.price}
                              onChange={(e) => updateCartPrice(c.item.id, Number(e.target.value))}
                              className="w-14 h-6 px-1 text-xs text-right font-medium rounded border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A]"
                            />
                          </div>

                          {/* Qty and Subtotal */}
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1 bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => updateCartQty(c.item.id, -1)}
                                className="w-5 h-5 rounded flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#1E293B] cursor-pointer"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="text-xs font-bold w-4 text-center">{c.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateCartQty(c.item.id, 1)}
                                className="w-5 h-5 rounded flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#1E293B] cursor-pointer"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            <span className="text-xs font-bold text-[#14B8A6] dark:text-[#2DD4BF] min-w-[50px] text-right">
                              {currencySymbol} {(c.price * c.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Subtotal Footer */}
                {cart.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-[#F1F5F9] dark:border-[#1E293B] flex justify-between items-center text-xs shrink-0">
                    <span className="text-[#6B7280] dark:text-[#94A3B8]">Subtotal acumulado:</span>
                    <span className="font-bold text-sm text-[#111827] dark:text-[#F8FAFC]">
                      {currencySymbol} {cartSubtotal.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* ═════════════════════════════════════════════════════════════════ */}
              {/* COLUMNA 3: PANEL DE COBRO & CLIENTE (4 cols)                       */}
              {/* ═════════════════════════════════════════════════════════════════ */}
              <div className="col-span-12 lg:col-span-4 flex flex-col min-h-0 bg-white dark:bg-[#0F172A] rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] p-3 shadow-sm overflow-y-auto">
                <div className="pb-1.5 border-b border-[#F1F5F9] dark:border-[#1E293B] shrink-0 mb-2">
                  <span className="font-bold text-xs text-[#111827] dark:text-[#F8FAFC] flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-[#14B8A6]" />
                    Datos de Facturación & Cobro
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 flex flex-col justify-between">
                  {posError && (
                    <div className="text-[11px] text-red-600 bg-red-50 dark:bg-red-950/40 p-2 rounded-lg border border-red-200">
                      {posError}
                    </div>
                  )}

                  {/* Customer Selection */}
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-[#374151] dark:text-gray-300">Cliente / Paciente</Label>
                    <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                      <SelectTrigger className="h-8 rounded-lg text-xs bg-[#F8FAFC] dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B]">
                        <SelectValue placeholder="Seleccionar paciente o mostrador" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-[#111827]">
                        <SelectItem value="walkin">Cliente Mostrador (Venta Directa)</SelectItem>
                        {patients.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.first_name} {p.last_name} {p.national_id ? `(CI: ${p.national_id})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedPatientId === 'walkin' && (
                      <div className="grid grid-cols-2 gap-1.5 mt-1">
                        <Input
                          placeholder="Nombre cliente"
                          value={walkinName}
                          onChange={(e) => setWalkinName(e.target.value)}
                          className="h-7 text-xs rounded-md border-[#D1D5DB] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#111827]"
                        />
                        <Input
                          placeholder="CI / NIT"
                          value={walkinCi}
                          onChange={(e) => setWalkinCi(e.target.value)}
                          className="h-7 text-xs rounded-md border-[#D1D5DB] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#111827]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-[#374151] dark:text-gray-300">Método de Pago</Label>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'cash', label: 'Efectivo', icon: <DollarSign className="w-3 h-3" /> },
                        { id: 'card', label: 'Tarjeta', icon: <CreditCard className="w-3 h-3" /> },
                        { id: 'transfer', label: 'QR / Transf.', icon: <QrCode className="w-3 h-3" /> },
                      ].map(pm => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setPaymentMethod(pm.id as any)}
                          className={`flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                            paymentMethod === pm.id
                              ? 'border-[#14B8A6] bg-[#F0FDFA] dark:bg-teal-950/40 text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                              : 'border-[#E5E7EB] dark:border-[#1E293B] text-[#6B7280]'
                          }`}
                        >
                          {pm.icon}
                          <span>{pm.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>



                  {/* Total Calculations Box */}
                  <div className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-[#6B7280] dark:text-[#94A3B8]">
                      <span>Descuento ({currencySymbol}):</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        className="w-14 h-5 px-1 text-right text-xs rounded border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A]"
                      />
                    </div>

                    <div className="flex justify-between items-center font-bold text-sm text-[#111827] dark:text-[#F8FAFC] pt-1 border-t border-[#CBD5E1] dark:border-[#334155]">
                      <span>TOTAL:</span>
                      <span className="text-base text-[#14B8A6] dark:text-[#2DD4BF]">
                        {currencySymbol} {cartTotal.toFixed(2)}
                      </span>
                    </div>

                    {paymentMethod === 'cash' && (
                      <div className="pt-1.5 mt-1 border-t border-dashed border-[#CBD5E1] dark:border-[#334155] grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-[#6B7280]">Recibido:</span>
                          <input
                            type="number"
                            min={cartTotal}
                            placeholder={String(cartTotal)}
                            value={receivedAmount}
                            onChange={(e) => setReceivedAmount(e.target.value)}
                            className="w-full h-6 px-1.5 text-xs rounded border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-medium"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-[#6B7280]">Cambio:</span>
                          <p className="font-bold text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {currencySymbol} {changeDue.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Checkout Button */}
                  <Button
                    disabled={posSaving || cart.length === 0}
                    onClick={handleProcessPosSale}
                    className="w-full h-10 bg-[#14B8A6] hover:bg-[#0F766E] text-white rounded-xl font-bold shadow-md shadow-[#14B8A6]/20 cursor-pointer text-xs gap-1.5 shrink-0"
                  >
                    {posSaving ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando...</>
                    ) : (
                      <><Receipt className="w-3.5 h-3.5" /> Cobrar Ticket ({currencySymbol} {cartTotal.toFixed(2)})</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}



          {/* ── SUB-VIEW: HISTORIAL DE TICKETS ── */}
          {pharmacySubTab === 'history' && (
            <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#0F172A] rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] p-3 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E7EB] dark:border-[#1E293B] shrink-0">
                <div>
                  <h3 className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC]">Historial de Ventas POS</h3>
                  <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">Tickets térmicos emitidos recientemente</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {sales.length === 0 ? (
                  <div className="text-center py-10 text-[#9CA3AF] text-xs">
                    <Receipt className="w-8 h-8 mx-auto text-[#CBD5E1] mb-1" />
                    <p>No se han registrado tickets aún.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#F8FAFC] dark:bg-[#111827] border-b border-[#E5E7EB] dark:border-[#1E293B]">
                        <TableHead className="text-xs font-semibold">N° Ticket</TableHead>
                        <TableHead className="text-xs font-semibold">Fecha / Hora</TableHead>
                        <TableHead className="text-xs font-semibold">Cliente / Paciente</TableHead>
                        <TableHead className="text-xs font-semibold">Cajero</TableHead>
                        <TableHead className="text-xs font-semibold">Método</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Total</TableHead>
                        <TableHead className="text-xs font-semibold text-center">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((s) => (
                        <TableRow key={s.id} className="border-b border-[#E5E7EB] dark:border-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/60">
                          <TableCell className="font-mono text-xs font-bold text-[#14B8A6]">
                            {s.ticket_number}
                          </TableCell>
                          <TableCell className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                            {s.date}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-[#111827] dark:text-[#F8FAFC]">
                            {s.patient_name} {s.patient_ci ? `(${s.patient_ci})` : ''}
                          </TableCell>
                          <TableCell className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                            {s.cashier}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] border-0 text-[10px] capitalize">
                              {s.payment_method === 'cash' ? 'Efectivo' : s.payment_method === 'card' ? 'Tarjeta' : s.payment_method}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-xs text-[#111827] dark:text-[#F8FAFC]">
                            {currencySymbol} {Number(s.total).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPrintedTicket(s)}
                              className="h-7 rounded-lg text-xs gap-1 cursor-pointer border-[#CBD5E1] dark:border-[#334155] px-2"
                            >
                              <Printer className="w-3 h-3 text-[#14B8A6]" /> Re-imprimir
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: TICKET TÉRMICO / RECIBO DE FARMACIA                                */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={!!printedTicket} onOpenChange={(open) => !open && setPrintedTicket(null)}>
        <DialogContent className="max-w-sm rounded-3xl bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B] p-5 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xs font-bold text-[#14B8A6] flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" /> Venta Registrada con Éxito
            </DialogTitle>
            <DialogDescription className="sr-only">
              Ticket térmico de venta en farmacia
            </DialogDescription>
          </DialogHeader>

          {/* Ticket térmico estilo papel */}
          {printedTicket && (
            <div
              ref={ticketRef}
              className="mt-1 p-4 bg-[#FAFAFA] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl font-mono text-[11px] text-[#111827] dark:text-[#F8FAFC] shadow-inner"
            >
              <div className="text-center pb-2 border-b border-dashed border-[#CBD5E1] dark:border-[#334155] space-y-0.5">
                <p className="font-bold text-xs tracking-wider uppercase">{printedTicket.clinic?.name || clinic?.name || 'ClinicSoft'}</p>
                <p className="text-[10px] text-[#6B7280] dark:text-[#94A3B8]">FARMACIA & DISPENSACIÓN</p>
                {printedTicket.clinic?.address && <p className="text-[9px] text-[#6B7280]">{printedTicket.clinic.address}</p>}
                {printedTicket.clinic?.phone && <p className="text-[9px] text-[#6B7280]">Tel: {printedTicket.clinic.phone}</p>}
              </div>

              <div className="py-2 border-b border-dashed border-[#CBD5E1] dark:border-[#334155] space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Ticket:</span>
                  <span className="font-bold text-[#14B8A6]">{printedTicket.ticket_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Fecha:</span>
                  <span>{printedTicket.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Cliente:</span>
                  <span className="font-semibold truncate max-w-[130px]">{printedTicket.patient_name}</span>
                </div>
                {printedTicket.patient_ci && (
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">CI/NIT:</span>
                    <span>{printedTicket.patient_ci}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Cajero:</span>
                  <span>{printedTicket.cashier}</span>
                </div>
              </div>

              {/* Detalle de Medicamentos */}
              <div className="py-2 border-b border-dashed border-[#CBD5E1] dark:border-[#334155] space-y-1.5">
                <p className="font-bold text-[9px] text-[#6B7280] uppercase">Detalle de Medicamentos</p>
                {(printedTicket.items || []).map((it, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="truncate max-w-[150px]">{it.name}</span>
                      <span>{currencySymbol} {Number(it.total).toFixed(2)}</span>
                    </div>
                    <p className="text-[9px] text-[#6B7280]">
                      {it.quantity} {it.unit} x {currencySymbol} {Number(it.unit_price).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="pt-2 space-y-0.5 text-[10px]">
                <div className="flex justify-between text-[#6B7280]">
                  <span>Subtotal:</span>
                  <span>{currencySymbol} {Number(printedTicket.subtotal).toFixed(2)}</span>
                </div>
                {printedTicket.discount > 0 && (
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Descuento:</span>
                    <span>-{currencySymbol} {Number(printedTicket.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs text-[#111827] dark:text-[#F8FAFC] pt-0.5">
                  <span>TOTAL:</span>
                  <span className="text-sm text-[#14B8A6]">{currencySymbol} {Number(printedTicket.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[9px] text-[#6B7280] pt-0.5">
                  <span>Método: {printedTicket.payment_method.toUpperCase()}</span>
                  <span>Recibido: {currencySymbol} {Number(printedTicket.received_amount).toFixed(2)}</span>
                </div>
                {printedTicket.change_amount > 0 && (
                  <div className="flex justify-between text-[9px] text-emerald-600 font-semibold">
                    <span>Cambio:</span>
                    <span>{currencySymbol} {Number(printedTicket.change_amount).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-2 mt-2 border-t border-dashed border-[#CBD5E1] dark:border-[#334155] text-[9px] text-[#9CA3AF]">
                <p>¡Gracias por su compra!</p>
              </div>
            </div>
          )}

          <DialogFooter className="mt-3 sm:justify-between flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setPrintedTicket(null)}
              className="flex-1 rounded-xl text-xs h-9 cursor-pointer"
            >
              Cerrar
            </Button>
            <Button
              onClick={() => handlePrintTicket(printedTicket)}
              className="flex-1 bg-[#14B8A6] hover:bg-[#0F766E] text-white rounded-xl text-xs h-9 font-bold gap-1.5 cursor-pointer shadow-md shadow-[#14B8A6]/20"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Create Product Modal ─── */}
      <Dialog open={showModal} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-lg rounded-2xl bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
          <DialogHeader>
            <DialogTitle className="text-[#111827] dark:text-[#F8FAFC]">
              {activeTab === 'pharmacy' ? 'Nuevo Medicamento / Fármaco' : 'Nuevo Producto de Inventario'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {saveError && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl px-4 py-3 border border-red-200 dark:border-red-800/40">{saveError}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">
                  {activeTab === 'pharmacy' ? 'Nombre del Medicamento *' : 'Nombre del Producto *'}
                </Label>
                <Input
                  placeholder={activeTab === 'pharmacy' ? 'Ej. Amoxicilina 500mg, Paracetamol 1g...' : 'Ej. Guantes de látex (caja)...'}
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                />
              </div>

              <div className="col-span-2 sm:col-span-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Categoría *</Label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                    className="text-xs text-[#14B8A6] dark:text-[#2DD4BF] hover:underline cursor-pointer font-medium"
                  >
                    {isCreatingCategory ? 'Cancelar' : '+ Nueva'}
                  </button>
                </div>
                {isCreatingCategory ? (
                  <div className="p-2.5 rounded-xl bg-[#F0FDFA] dark:bg-[#14B8A6]/10 border border-[#99F6E4] dark:border-[#14B8A6]/30 space-y-2">
                    <Input
                      placeholder="Nombre de nueva categoría..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="h-9 text-xs rounded-lg border-[#99F6E4] dark:border-[#14B8A6]/40 bg-white dark:bg-[#0F172A]"
                    />
                    {categoryError && <p className="text-xs text-red-500">{categoryError}</p>}
                    <Button
                      type="button"
                      size="sm"
                      disabled={categorySaving || !newCategoryName.trim()}
                      onClick={handleCreateQuickCategory}
                      className="w-full h-8 bg-[#14B8A6] hover:bg-[#0F766E] text-white text-xs rounded-lg font-medium cursor-pointer"
                    >
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
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">SKU / Código de Barras</Label>
                <Input
                  placeholder="Opcional"
                  value={form.sku}
                  onChange={(e) => set('sku', e.target.value)}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Unidad de Medida *</Label>
                <Input
                  placeholder={activeTab === 'pharmacy' ? 'comp, amp, caja, ml...' : 'pza, caja, ml...'}
                  value={form.unit_of_measure}
                  onChange={(e) => set('unit_of_measure', e.target.value)}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">
                  {activeTab === 'pharmacy' ? 'Precio de Venta (' + currencySymbol + ')' : 'Costo Unitario (' + currencySymbol + ')'}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.unit_cost}
                  onChange={(e) => set('unit_cost', e.target.value)}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Stock Inicial</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.current_stock}
                  onChange={(e) => set('current_stock', e.target.value)}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Stock Mínimo (Alerta)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.min_stock_level}
                  onChange={(e) => set('min_stock_level', e.target.value)}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                />
              </div>
            </div>
          </form>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} className="border-gray-200 dark:border-[#1E293B] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1E293B]">Cancelar</Button>
            <Button disabled={saving} className="bg-[#14B8A6] hover:bg-[#0F766E] text-white shadow-md shadow-[#14B8A6]/20 cursor-pointer" onClick={handleSubmit as any}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</> : 'Guardar Producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Product Modal ─── */}
      <Dialog open={showEditModal} onOpenChange={(open) => !open && setShowEditModal(false)}>
        <DialogContent className="max-w-lg rounded-2xl bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
          <DialogHeader>
            <DialogTitle className="text-[#111827] dark:text-[#F8FAFC] flex items-center gap-2">
              <Pencil className="w-4 h-4 text-[#14B8A6]" />
              Editar {activeTab === 'pharmacy' ? 'Medicamento' : 'Producto'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            {editError && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl px-4 py-3 border border-red-200 dark:border-red-800/40">{editError}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Nombre *</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEdit('name', e.target.value)}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                />
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
                <Input
                  value={editForm.sku}
                  onChange={(e) => setEdit('sku', e.target.value)}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Unidad de Medida *</Label>
                <Input
                  value={editForm.unit_of_measure}
                  onChange={(e) => setEdit('unit_of_measure', e.target.value)}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">
                  {activeTab === 'pharmacy' ? 'Precio de Venta (' + currencySymbol + ')' : 'Costo Unitario (' + currencySymbol + ')'}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.unit_cost}
                  onChange={(e) => setEdit('unit_cost', e.target.value)}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Stock Mínimo (Alerta)</Label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.min_stock_level}
                  onChange={(e) => setEdit('min_stock_level', e.target.value)}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                />
              </div>
            </div>
          </form>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)} className="border-gray-200 dark:border-[#1E293B] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1E293B]">Cancelar</Button>
            <Button disabled={editSaving} className="bg-[#14B8A6] hover:bg-[#0F766E] text-white shadow-md shadow-[#14B8A6]/20 cursor-pointer" onClick={handleEditSubmit as any}>
              {editSaving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</> : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Stock Movement Modal ─── */}
      <Dialog open={showMovementModal} onOpenChange={(open) => !open && setShowMovementModal(false)}>
        <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
          <DialogHeader>
            <DialogTitle className="text-[#111827] dark:text-[#F8FAFC] flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-[#14B8A6]" />
              Registrar Movimiento de Stock
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleMovementSubmit} className="space-y-4 py-2">
            {movementError && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl px-4 py-3 border border-red-200 dark:border-red-800/40">{movementError}</div>
            )}

            <div className="grid grid-cols-3 gap-2">
              {MOVEMENT_TYPES.map((mt) => (
                <button
                  key={mt.value}
                  type="button"
                  onClick={() => setMov('movement_type', mt.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all cursor-pointer text-sm font-medium ${
                    movementForm.movement_type === mt.value
                      ? 'border-[#14B8A6] bg-[#F0FDFA] dark:bg-teal-950/40 text-[#0F766E] dark:text-[#2DD4BF]'
                      : 'border-[#E5E7EB] dark:border-[#1E293B] text-[#6B7280] dark:text-[#94A3B8] hover:border-[#14B8A6]/40 hover:bg-[#F0FDFA]/50 dark:hover:bg-teal-950/20'
                  }`}
                >
                  {mt.icon}
                  <span className="text-xs leading-tight text-center">{mt.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Producto / Medicamento *</Label>
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

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">
                {movementForm.movement_type === 'adjustment' ? 'Nuevo Stock Total *' : 'Cantidad *'}
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

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Notas / Motivo (opcional)</Label>
              <Input
                placeholder="Ej. Compra proveedor, dispensación, merma..."
                value={movementForm.notes}
                onChange={(e) => setMov('notes', e.target.value)}
                className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
              />
            </div>
          </form>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMovementModal(false)} className="border-gray-200 dark:border-[#1E293B] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1E293B]">Cancelar</Button>
            <Button disabled={movementSaving} className="bg-[#14B8A6] hover:bg-[#0F766E] text-white shadow-md shadow-[#14B8A6]/20 cursor-pointer" onClick={handleMovementSubmit as any}>
              {movementSaving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Registrando...</> : 'Registrar Movimiento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Manage Categories Modal ─── */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
          <DialogHeader>
            <DialogTitle className="text-[#111827] dark:text-[#F8FAFC] flex items-center gap-2">
              <Tags className="w-5 h-5 text-[#14B8A6] dark:text-[#2DD4BF]" />
              Categorías de Inventario & Farmacia
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <form onSubmit={handleCreateQuickCategory} className="flex gap-2">
              <Input
                placeholder="Nueva categoría (ej. Analgésicos, Implantes)..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="h-10 rounded-xl border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-sm"
              />
              <Button
                type="submit"
                disabled={categorySaving || !newCategoryName.trim()}
                className="h-10 bg-[#14B8A6] hover:bg-[#0F766E] text-white rounded-xl px-4 cursor-pointer font-medium text-sm flex-shrink-0"
              >
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
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(c.id)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar categoría"
                          >
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
            <Button
              variant="outline"
              onClick={() => setShowCategoryModal(false)}
              className="border-gray-200 dark:border-[#1E293B] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1E293B]"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
