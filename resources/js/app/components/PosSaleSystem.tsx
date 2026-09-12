import { useState, useMemo, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
  ShoppingCart, Search, Plus, Minus, Trash2, CheckCircle,
  AlertCircle, DollarSign, CreditCard, QrCode, FileText,
  Printer, ArrowLeft, RotateCcw, User, UserCheck, Sparkles,
  Package, Tag, Calculator, HelpCircle, Eye, Check
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from './ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from './ui/select';
import { printThermalReceipt } from './PosThermalTicketModal';

// ── Types ──────────────────────────────────────────────────────────────────────
export interface Category { id: string; name: string; description?: string | null; }

export interface InventoryItem {
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

export interface PatientOption {
  id: string;
  first_name: string;
  last_name: string;
  national_id: string | null;
  phone?: string | null;
}

export interface AccountOption {
  id: string;
  code: string;
  name: string;
}

export interface ClinicInfo {
  name: string;
  address?: string | null;
  phone?: string | null;
  currency?: string;
  logo_url?: string | null;
}

export interface SaleReceipt {
  ticket_number: string;
  date: string;
  patient_name: string;
  patient_ci: string | null;
  payment_method: string;
  items: {
    id: string;
    name: string;
    unit: string;
    quantity: number;
    unit_price: number;
    total: number;
  }[];
  subtotal: number;
  discount: number;
  tax_amount: number;
  total: number;
  received_amount: number;
  change_amount: number;
  notes: string | null;
  payment_id?: string | null;
  cashier: string;
  clinic: {
    name: string;
    address: string;
    phone: string;
    currency?: string;
  };
}

export interface CartItem {
  id: string;
  item: InventoryItem;
  quantity: number;
  price: number;
}

interface PosSaleSystemProps {
  items: InventoryItem[];
  categories: Category[];
  patients?: PatientOption[];
  accounts?: AccountOption[];
  clinic?: ClinicInfo | null;
  onOpenThermalTickets?: () => void;
  onClose?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtMoney(amount: number, currency: string = 'BOB') {
  return `${amount.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency === 'USD' ? '$' : 'Bs.'}`;
}

const PAYMENT_METHODS = [
  { id: 'cash',     label: 'Efectivo',      icon: DollarSign,  color: 'emerald' },
  { id: 'card',     label: 'Tarjeta',       icon: CreditCard,  color: 'blue' },
  { id: 'transfer', label: 'QR / Transf.',  icon: QrCode,      color: 'purple' },
  { id: 'check',    label: 'Cheque / Otro', icon: FileText,    color: 'gray' },
] as const;

export default function PosSaleSystem({
  items,
  categories,
  patients = [],
  accounts = [],
  clinic,
  onClose,
}: PosSaleSystemProps) {
  const { props } = usePage<any>();
  const flash = props.flash as { success?: string; error?: string; sale_receipt?: SaleReceipt } | undefined;

  // Search and Filtering
  const [posSearch, setPosSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerType, setCustomerType] = useState<'walkin' | 'patient'>('walkin');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [walkinName, setWalkinName] = useState<string>('Cliente Mostrador');
  const [walkinCi, setWalkinCi] = useState<string>('');
  
  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'check' | 'other'>('cash');
  const [discount, setDiscount] = useState<string>('0');
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState<string>('');

  // Processing & Receipt Modal
  const [processing, setProcessing] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<SaleReceipt | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currencySymbol = clinic?.currency ?? 'BOB';

  // Check for sale_receipt in flash on updates
  useEffect(() => {
    if (flash?.sale_receipt) {
      setActiveReceipt(flash.sale_receipt);
      setShowReceiptModal(true);
      // Reset cart
      setCart([]);
      setDiscount('0');
      setReceivedAmount('');
      setSaleNotes('');
    }
  }, [flash]);

  // Filtered Products for Catalog
  const filteredProducts = useMemo(() => {
    const q = posSearch.trim().toLowerCase();
    return items.filter(item => {
      const matchCategory = selectedCategory === 'all' || item.category?.id === selectedCategory;
      const matchQuery = !q || 
        item.name.toLowerCase().includes(q) ||
        (item.sku ?? '').toLowerCase().includes(q) ||
        (item.category?.name ?? '').toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [items, posSearch, selectedCategory]);

  // Financial Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0);
  }, [cart]);

  const discountVal = useMemo(() => {
    const val = parseFloat(discount);
    return isNaN(val) || val < 0 ? 0 : Math.min(val, subtotal);
  }, [discount, subtotal]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discountVal);
  }, [subtotal, discountVal]);

  const cashReceivedVal = useMemo(() => {
    const val = parseFloat(receivedAmount);
    return isNaN(val) ? 0 : val;
  }, [receivedAmount]);

  const changeAmount = useMemo(() => {
    if (paymentMethod !== 'cash') return 0;
    if (cashReceivedVal <= 0) return 0;
    return Math.max(0, cashReceivedVal - grandTotal);
  }, [paymentMethod, cashReceivedVal, grandTotal]);

  const isCashInsufficient = useMemo(() => {
    if (paymentMethod !== 'cash') return false;
    if (!receivedAmount || cashReceivedVal === 0) return false;
    return cashReceivedVal < grandTotal;
  }, [paymentMethod, receivedAmount, cashReceivedVal, grandTotal]);

  // Cart operations
  function addToCart(item: InventoryItem) {
    if (item.current_stock <= 0) return;

    setCart(prev => {
      const existing = prev.find(ci => ci.id === item.id);
      if (existing) {
        if (existing.quantity >= item.current_stock) return prev; // Cannot exceed stock
        return prev.map(ci => ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci);
      }
      // Use unit_cost or default price 10
      const defaultPrice = item.unit_cost != null && item.unit_cost > 0 ? Number(item.unit_cost) : 10;
      return [...prev, { id: item.id, item, quantity: 1, price: defaultPrice }];
    });
  }

  function updateQuantity(itemId: string, newQty: number) {
    const product = items.find(i => i.id === itemId);
    const maxStock = product?.current_stock ?? 999999;
    const validatedQty = Math.max(1, Math.min(newQty, maxStock));

    setCart(prev => prev.map(ci => ci.id === itemId ? { ...ci, quantity: validatedQty } : ci));
  }

  function updateItemPrice(itemId: string, newPrice: number) {
    const validatedPrice = Math.max(0, isNaN(newPrice) ? 0 : newPrice);
    setCart(prev => prev.map(ci => ci.id === itemId ? { ...ci, price: validatedPrice } : ci));
  }

  function removeFromCart(itemId: string) {
    setCart(prev => prev.filter(ci => ci.id !== itemId));
  }

  function clearCart() {
    setCart([]);
    setDiscount('0');
    setReceivedAmount('');
    setSaleNotes('');
    setErrorMessage(null);
  }

  // Quick Cash Presets
  function setQuickCash(amount: number) {
    setReceivedAmount(amount.toString());
  }

  // Handle Complete Sale Submit
  function handleCheckout() {
    if (cart.length === 0) {
      setErrorMessage('Agrega al menos un producto al carrito para realizar la venta.');
      return;
    }

    if (paymentMethod === 'cash' && receivedAmount && cashReceivedVal < grandTotal) {
      setErrorMessage(`El monto recibido (${fmtMoney(cashReceivedVal, currencySymbol)}) es menor al total (${fmtMoney(grandTotal, currencySymbol)}).`);
      return;
    }

    setProcessing(true);
    setErrorMessage(null);

    const payload = {
      patient_id:       customerType === 'patient' ? selectedPatientId || null : null,
      patient_name:     customerType === 'walkin' ? (walkinName.trim() || 'Cliente Mostrador') : null,
      patient_ci:       customerType === 'walkin' ? (walkinCi.trim() || null) : null,
      payment_method:   paymentMethod,
      account_id:       selectedAccountId || null,
      discount_amount:  discountVal,
      tax_rate:         0,
      received_amount:  paymentMethod === 'cash' && cashReceivedVal > 0 ? cashReceivedVal : grandTotal,
      notes:            saleNotes.trim() || null,
      items: cart.map(ci => ({
        id:       ci.id,
        quantity: ci.quantity,
        price:    ci.price,
      })),
    };

    router.post('/inventory/pos-sale', payload, {
      preserveScroll: true,
      onSuccess: (page: any) => {
        const res = page.props?.flash?.sale_receipt as SaleReceipt | undefined;
        if (res) {
          setActiveReceipt(res);
          setShowReceiptModal(true);
          clearCart();
        }
      },
      onError: (errors) => {
        const msg = Object.values(errors)[0] as string || 'Ocurrió un error al procesar la venta POS.';
        setErrorMessage(msg);
      },
      onFinish: () => {
        setProcessing(false);
      }
    });
  }

  function handlePrintTicket() {
    if (activeReceipt) {
      printThermalReceipt(activeReceipt as any);
    } else {
      window.print();
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-2.5 animate-fadeIn">
      {/* Error alert if any */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700 font-bold px-2 cursor-pointer">×</button>
        </div>
      )}

      {/* POS 3-Column Architecture:
          Col 1 (5 cols): Catálogo de Productos
          Col 2 (4 cols): Detalle del Carrito y Selección de Cliente
          Col 3 (3 cols): Panel de Cobro, Calculadora y Botón Cierre
      */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        
        {/* ── COLUMNA 1: Catálogo de Productos (5 de 12) ────────────────────────── */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 gap-2">
          
          {/* Barra de Búsqueda y Filtros Compacta */}
          <div className="bg-white dark:bg-[#0F172A] p-2.5 rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] shadow-sm space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar por producto o SKU..."
                value={posSearch}
                onChange={(e) => setPosSearch(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs rounded-xl border-[#D1D5DB] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#111827] focus:border-[#0284C7] focus:ring-[#0284C7]"
              />
              {posSearch && (
                <button 
                  onClick={() => setPosSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Categorías deslizables horizontalmente */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#0284C7] text-white shadow-sm font-semibold'
                    : 'bg-[#F1F5F9] dark:bg-[#1E293B] text-gray-600 dark:text-gray-300 hover:bg-[#E2E8F0] dark:hover:bg-[#334155]'
                }`}
              >
                Todos ({items.length})
              </button>
              {categories.map((cat) => {
                const count = items.filter(i => i.category?.id === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-[#0284C7] text-white shadow-sm font-semibold'
                        : 'bg-[#F1F5F9] dark:bg-[#1E293B] text-gray-600 dark:text-gray-300 hover:bg-[#E2E8F0] dark:hover:bg-[#334155]'
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista de Productos en Filas (List View) con scroll interno independiente */}
          <div className="flex-1 min-h-0 space-y-1.5 overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-gray-400 bg-white dark:bg-[#0F172A] rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                <Package className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-1.5" />
                <p className="font-medium text-gray-600 dark:text-gray-300 text-xs">No se encontraron productos</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Prueba otro término o categoría</p>
              </div>
            ) : (
              filteredProducts.map((item) => {
                const isOutOfStock = item.current_stock <= 0;
                const isLowStock = item.current_stock > 0 && item.current_stock <= item.min_stock_level;
                const inCart = cart.find(ci => ci.id === item.id);
                const itemPrice = item.unit_cost != null && item.unit_cost > 0 ? Number(item.unit_cost) : 10;

                return (
                  <div
                    key={item.id}
                    onClick={() => !isOutOfStock && addToCart(item)}
                    className={`group px-3 py-2 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 select-none ${
                      isOutOfStock
                        ? 'opacity-60 bg-gray-50 dark:bg-[#111827]/50 border-gray-200 dark:border-gray-800 cursor-not-allowed'
                        : inCart
                        ? 'bg-[#F0F9FF] dark:bg-sky-950/30 border-[#0284C7] dark:border-[#0284C7]/70 shadow-xs ring-1 ring-[#0284C7]/30 cursor-pointer hover:bg-sky-100/50 dark:hover:bg-sky-950/50'
                        : 'bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] hover:border-[#0284C7]/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 hover:shadow-xs cursor-pointer'
                    }`}
                  >
                    {/* Información del Producto */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-xs text-[#111827] dark:text-[#F8FAFC] truncate group-hover:text-[#0284C7] transition-colors" title={item.name}>
                          {item.name}
                        </span>
                        {item.category?.name && (
                          <span className="hidden sm:inline-block text-[10px] font-medium px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                            {item.category.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 text-[11px] text-gray-500 dark:text-gray-400">
                        {item.sku && (
                          <span className="text-[10px] text-gray-400 font-mono">SKU: {item.sku}</span>
                        )}
                        {isOutOfStock ? (
                          <Badge className="bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 border-0 text-[9px] px-1 py-0 font-medium">
                            Agotado
                          </Badge>
                        ) : isLowStock ? (
                          <Badge className="bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-0 text-[9px] px-1 py-0 font-medium">
                            Stock: {item.current_stock} {item.unit}
                          </Badge>
                        ) : (
                          <span>
                            Stock: <strong className="text-emerald-600 dark:text-emerald-400">{item.current_stock}</strong> {item.unit}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Precio y Acción */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs sm:text-sm font-bold text-[#0284C7] dark:text-[#38BDF8] block leading-tight">
                          {fmtMoney(itemPrice, currencySymbol)}
                        </span>
                      </div>

                      {inCart ? (
                        <div className="flex items-center gap-1 bg-[#0284C7] text-white px-2 py-1 rounded-lg text-[11px] font-bold shadow-xs">
                          <Check className="w-3 h-3" />
                          <span>{inCart.quantity}</span>
                        </div>
                      ) : (
                        <button
                          disabled={isOutOfStock}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                            isOutOfStock
                              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                              : 'bg-sky-50 dark:bg-sky-950/60 text-[#0284C7] dark:text-[#38BDF8] group-hover:bg-[#0284C7] group-hover:text-white shadow-2xs'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── COLUMNA 2: Carrito y Cliente (4 de 12) ────────────────────────── */}
        <div className="lg:col-span-4 h-full min-h-0 flex flex-col">
          <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
            {/* Header Carrito */}
            <div className="p-3 border-b border-[#E5E7EB] dark:border-[#1E293B] flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-sm font-bold text-[#111827] dark:text-[#F8FAFC] flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-[#0284C7]" />
                  Orden de Venta
                </h2>
                <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                  {cart.length} {cart.length === 1 ? 'ítem añadido' : 'ítems añadidos'}
                </p>
              </div>
              {cart.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-[11px] h-7 px-2 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Vaciar
                </Button>
              )}
            </div>

            {/* Datos del Cliente */}
            <div className="p-2.5 bg-[#F8FAFC] dark:bg-[#111827] border-b border-[#E5E7EB] dark:border-[#1E293B] shrink-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">Cliente / Destino</span>
                <div className="flex items-center gap-1 bg-white dark:bg-[#0F172A] p-0.5 rounded-lg border border-gray-200 dark:border-gray-800 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setCustomerType('walkin')}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                      customerType === 'walkin'
                        ? 'bg-[#0284C7] text-white shadow-xs'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    Mostrador
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerType('patient')}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                      customerType === 'patient'
                        ? 'bg-[#0284C7] text-white shadow-xs'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    Paciente
                  </button>
                </div>
              </div>

              {customerType === 'walkin' ? (
                <div className="grid grid-cols-2 gap-1.5">
                  <Input
                    type="text"
                    placeholder="Nombre del cliente"
                    value={walkinName}
                    onChange={(e) => setWalkinName(e.target.value)}
                    className="h-7 text-xs bg-white dark:bg-[#0F172A] border-[#D1D5DB] dark:border-[#1E293B] rounded-md px-2"
                  />
                  <Input
                    type="text"
                    placeholder="CI / NIT (opcional)"
                    value={walkinCi}
                    onChange={(e) => setWalkinCi(e.target.value)}
                    className="h-7 text-xs bg-white dark:bg-[#0F172A] border-[#D1D5DB] dark:border-[#1E293B] rounded-md px-2"
                  />
                </div>
              ) : (
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                  <SelectTrigger className="h-7 text-xs bg-white dark:bg-[#0F172A] border-[#D1D5DB] dark:border-[#1E293B] rounded-md px-2">
                    <SelectValue placeholder="Seleccionar paciente..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-52">
                    {patients.map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        {p.first_name} {p.last_name} {p.national_id ? `(${p.national_id})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Lista con Scroll Interno Propio para los Productos del Carrito */}
            <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-10 text-center text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                  <ShoppingCart className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-1" />
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300">El carrito está vacío</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Toca productos del catálogo para agregar</p>
                </div>
              ) : (
                cart.map((ci) => {
                  const lineTotal = ci.quantity * ci.price;
                  const maxStock = ci.item.current_stock;
                  return (
                    <div
                      key={ci.id}
                      className="p-2 rounded-xl bg-[#F8FAFC] dark:bg-[#111827] border border-gray-200/90 dark:border-gray-800/90 flex flex-col gap-1.5 text-xs shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-xs truncate max-w-[200px]" title={ci.item.name}>
                          {ci.item.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFromCart(ci.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-0.5 cursor-pointer"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Controles de Precio y Cantidad en una fila compacta */}
                      <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 dark:border-gray-800">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-gray-400">P.U:</span>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={ci.price}
                            onChange={(e) => updateItemPrice(ci.id, parseFloat(e.target.value))}
                            className="w-14 h-5 px-1 bg-white dark:bg-[#0F172A] border border-gray-300 dark:border-gray-700 rounded text-center font-medium text-[11px] text-gray-800 dark:text-gray-200"
                          />
                        </div>

                        {/* Cantidad */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (ci.quantity > 1) updateQuantity(ci.id, ci.quantity - 1);
                              else removeFromCart(ci.id);
                            }}
                            className="w-5 h-5 rounded bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={maxStock}
                            value={ci.quantity}
                            onChange={(e) => updateQuantity(ci.id, parseInt(e.target.value) || 1)}
                            className="w-8 h-5 text-center font-bold bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 rounded text-[11px]"
                          />
                          <button
                            type="button"
                            disabled={ci.quantity >= maxStock}
                            onClick={() => updateQuantity(ci.id, ci.quantity + 1)}
                            className={`w-5 h-5 rounded border flex items-center justify-center ${
                              ci.quantity >= maxStock
                                ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 text-gray-300 cursor-not-allowed'
                                : 'bg-white dark:bg-[#0F172A] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 cursor-pointer'
                            }`}
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        {/* Total de la línea */}
                        <div className="text-right">
                          <span className="font-bold text-xs text-[#0284C7] dark:text-[#38BDF8]">
                            {fmtMoney(lineTotal, currencySymbol)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Subtotal Carrito Pie */}
            <div className="p-2.5 border-t border-[#E5E7EB] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#111827] flex items-center justify-between text-xs shrink-0">
              <span className="text-gray-500 font-medium">Subtotal ({cart.reduce((a, c) => a + c.quantity, 0)} ítems):</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">{fmtMoney(subtotal, currencySymbol)}</span>
            </div>
          </Card>
        </div>

        {/* ── COLUMNA 3: Panel de Cobro, Vuelto y Cierre (3 de 12) ────────── */}
        <div className="lg:col-span-3 h-full min-h-0 flex flex-col">
          <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
            <div className="p-2.5 border-b border-[#E5E7EB] dark:border-[#1E293B] shrink-0">
              <h2 className="text-sm font-bold text-[#111827] dark:text-[#F8FAFC] flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Pago & Cierre
              </h2>
              <p className="text-[10px] text-[#6B7280] dark:text-[#94A3B8]">Configuración y cobro rápido</p>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
              {/* Método de Pago */}
              <div>
                <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Método de Pago
                </span>
                <div className="grid grid-cols-2 gap-1">
                  {PAYMENT_METHODS.map(pm => {
                    const Icon = pm.icon;
                    const isSelected = paymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id as any)}
                        className={`p-1.5 rounded-xl text-center flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0284C7] text-white shadow-sm font-semibold'
                            : 'bg-[#F8FAFC] dark:bg-[#111827] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-[10px] leading-tight">{pm.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Si es Efectivo: Presets y Calculadora de Vuelto */}
              {paymentMethod === 'cash' && (
                <div className="p-2 bg-sky-50/60 dark:bg-sky-950/20 rounded-xl border border-sky-100 dark:border-sky-900/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-sky-900 dark:text-sky-300">Efectivo Recibido</span>
                    <button
                      type="button"
                      onClick={() => setQuickCash(grandTotal)}
                      className="px-1.5 py-0.2 rounded bg-sky-600 text-white text-[10px] font-bold hover:bg-sky-700 cursor-pointer shadow-2xs"
                    >
                      Exacto
                    </button>
                  </div>

                  {/* Botones Rápidos de Billetes */}
                  <div className="grid grid-cols-4 gap-1">
                    {[20, 50, 100, 200].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setQuickCash(amt)}
                        className="py-0.5 rounded bg-white dark:bg-[#0F172A] border border-sky-200 dark:border-sky-800 text-[10px] font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-100 cursor-pointer text-center"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>

                  <div>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Monto recibido..."
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value)}
                      className="h-7 text-xs bg-white dark:bg-[#0F172A] border-sky-300 dark:border-sky-800 font-bold text-sky-900 dark:text-sky-100"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-0.5 border-t border-sky-200/50 dark:border-sky-900/40">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Vuelto / Cambio:</span>
                    <span className={`text-xs font-extrabold ${isCashInsufficient ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {isCashInsufficient ? 'Insuficiente' : fmtMoney(changeAmount, currencySymbol)}
                    </span>
                  </div>
                </div>
              )}

              {/* Descuento Adicional */}
              <div className="flex items-center justify-between text-xs pt-0.5 border-t border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 text-[11px]">Descuento ({currencySymbol}):</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-16 h-5 px-1.5 text-right bg-[#F8FAFC] dark:bg-[#111827] border border-gray-300 dark:border-gray-700 rounded text-xs font-medium"
                />
              </div>

              {/* Resumen Total */}
              <div className="p-2 bg-gradient-to-br from-sky-50 to-blue-50/30 dark:from-sky-950/30 dark:to-transparent rounded-xl border border-sky-100 dark:border-sky-900/40 space-y-1">
                <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400">
                  <span>Subtotal:</span>
                  <span>{fmtMoney(subtotal, currencySymbol)}</span>
                </div>
                {discountVal > 0 && (
                  <div className="flex justify-between text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Descuento aplicado:</span>
                    <span>-{fmtMoney(discountVal, currencySymbol)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-sky-200/50 dark:border-sky-900/50">
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Total a Cobrar:</span>
                  <span className="text-base sm:text-lg font-black text-[#0284C7] dark:text-[#38BDF8]">
                    {fmtMoney(grandTotal, currencySymbol)}
                  </span>
                </div>
              </div>
            </div>

            {/* Botón Principal Fijo: Completar Venta */}
            <div className="p-2.5 border-t border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] shrink-0">
              <Button
                disabled={cart.length === 0 || processing || isCashInsufficient}
                onClick={handleCheckout}
                className="w-full h-10 bg-gradient-to-r from-[#0284C7] to-[#0369A1] hover:from-[#075985] hover:to-[#0C4A6E] text-white rounded-xl shadow-md shadow-[#0284C7]/20 font-bold text-xs sm:text-sm gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Completar • {fmtMoney(grandTotal, currencySymbol)}
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* ── RECEIPT / TICKET MODAL ────────────────────────────────────────── */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl">
          <DialogHeader className="p-4 sm:p-6 bg-gradient-to-br from-[#0284C7]/10 via-[#F0F9FF] to-transparent dark:from-sky-950/40 dark:via-[#0F172A] border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                  ¡Venta Completada con Éxito!
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  Comprobante de venta POS emitido
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Printable Ticket Card */}
          <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {activeReceipt && (
              <div id="pos-printable-ticket" className="p-5 bg-white text-gray-900 border border-dashed border-gray-300 rounded-xl font-mono text-xs shadow-sm space-y-3">
                
                {/* Header */}
                <div className="text-center border-b border-gray-200 pb-3 space-y-1">
                  <h3 className="font-bold text-base tracking-wider uppercase">{activeReceipt.clinic?.name || 'CENTRO MÉDICO ODONTOLÓGICO'}</h3>
                  {activeReceipt.clinic?.address && <p className="text-[11px] text-gray-600">{activeReceipt.clinic.address}</p>}
                  {activeReceipt.clinic?.phone && <p className="text-[11px] text-gray-600">Tel: {activeReceipt.clinic.phone}</p>}
                  <p className="text-xs font-bold pt-1 text-[#0284C7]">TICKET DE VENTA: {activeReceipt.ticket_number}</p>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-1 text-[11px] border-b border-gray-200 pb-2">
                  <div><strong>Fecha:</strong> {activeReceipt.date}</div>
                  <div className="text-right"><strong>Cajero:</strong> {activeReceipt.cashier}</div>
                  <div className="col-span-2"><strong>Cliente:</strong> {activeReceipt.patient_name} {activeReceipt.patient_ci ? `(CI/NIT: ${activeReceipt.patient_ci})` : ''}</div>
                  <div className="col-span-2"><strong>Método:</strong> {activeReceipt.payment_method.toUpperCase()}</div>
                </div>

                {/* Items Table */}
                <div className="border-b border-gray-200 pb-2">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 text-[10px]">
                        <th className="py-1">CANT</th>
                        <th className="py-1">DESCRIPCIÓN</th>
                        <th className="py-1 text-right">P.UNIT</th>
                        <th className="py-1 text-right">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {activeReceipt.items.map((it, idx) => (
                        <tr key={idx} className="text-[11px]">
                          <td className="py-1 font-bold">{it.quantity}</td>
                          <td className="py-1">{it.name}</td>
                          <td className="py-1 text-right">{fmtMoney(it.unit_price, activeReceipt.clinic?.currency)}</td>
                          <td className="py-1 text-right font-bold">{fmtMoney(it.total, activeReceipt.clinic?.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="space-y-1 text-[11px] pt-1 border-b border-gray-200 pb-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{fmtMoney(activeReceipt.subtotal, activeReceipt.clinic?.currency)}</span>
                  </div>
                  {activeReceipt.discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Descuento:</span>
                      <span>-{fmtMoney(activeReceipt.discount, activeReceipt.clinic?.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-200">
                    <span>TOTAL PAGADO:</span>
                    <span className="text-black">{fmtMoney(activeReceipt.total, activeReceipt.clinic?.currency)}</span>
                  </div>
                  {activeReceipt.payment_method === 'cash' && (
                    <>
                      <div className="flex justify-between text-gray-600 text-[10px]">
                        <span>Efectivo recibido:</span>
                        <span>{fmtMoney(activeReceipt.received_amount, activeReceipt.clinic?.currency)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-700 text-[11px]">
                        <span>Cambio / Vuelto:</span>
                        <span>{fmtMoney(activeReceipt.change_amount, activeReceipt.clinic?.currency)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="text-center text-[10px] text-gray-500 pt-1 space-y-0.5">
                  <p className="font-semibold">¡GRACIAS POR SU COMPRA!</p>
                  <p>Conserve este ticket como comprobante de pago</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 bg-gray-50 dark:bg-[#111827] border-t border-gray-100 dark:border-gray-800 flex sm:justify-between items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReceiptModal(false)}
              className="rounded-xl border-gray-300 dark:border-gray-700 text-xs"
            >
              Cerrar
            </Button>
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePrintTicket}
                className="bg-gray-800 hover:bg-black text-white rounded-xl text-xs gap-1.5 font-medium shadow"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir Ticket
              </Button>
              <Button
                onClick={() => {
                  setShowReceiptModal(false);
                  clearCart();
                }}
                className="bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-xl text-xs font-semibold"
              >
                Nueva Venta
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
