import React, { useState, useMemo } from 'react';
import { Printer, Search, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';

export interface SaleItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface SaleReceipt {
  id?: string;
  ticket_number: string;
  date: string;
  patient_name: string;
  patient_ci?: string | null;
  payment_method: string;
  items: SaleItem[];
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
    logo_url?: string | null;
  } | null;
}

interface PosThermalTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sales: SaleReceipt[];
  clinic?: {
    name: string;
    address?: string | null;
    phone?: string | null;
    currency?: string;
  } | null;
  initialSelectedSale?: SaleReceipt | null;
}

export function printThermalReceipt(receipt: SaleReceipt, paperWidth: '80mm' | '58mm' = '80mm') {
  const currency = receipt.clinic?.currency ?? 'BOB';
  const widthPx = paperWidth === '80mm' ? '300px' : '220px';
  const fontSize = paperWidth === '80mm' ? '12px' : '10px';

  const itemsHtml = (receipt.items || []).map(it => `
    <tr>
      <td style="padding: 3px 0; vertical-align: top; font-weight: bold;">${it.quantity}x</td>
      <td style="padding: 3px 4px; vertical-align: top;">${it.name}</td>
      <td style="padding: 3px 0; text-align: right; vertical-align: top; white-space: nowrap;">${it.total.toFixed(2)}</td>
    </tr>
  `).join('');

  const printWindow = window.open('', '_blank', 'width=450,height=650');
  if (!printWindow) {
    alert('Por favor habilita las ventanas emergentes (pop-ups) para imprimir el ticket.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Ticket_${receipt.ticket_number}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: ${paperWidth} auto;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace, -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: ${fontSize};
            line-height: 1.25;
            color: #000;
            background: #fff;
            padding: 10px 8px;
            width: ${widthPx};
            margin: 0 auto;
          }
          .text-center { text-align: center; }
          .bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .divider {
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .double-divider {
            border-top: 2px solid #000;
            margin: 6px 0;
          }
          .header-title {
            font-size: 1.15em;
            font-weight: 900;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          .ticket-badge {
            display: inline-block;
            border: 1px solid #000;
            padding: 2px 6px;
            font-weight: bold;
            font-size: 0.95em;
            margin: 4px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 4px 0;
          }
          th {
            border-bottom: 1px dashed #000;
            padding: 3px 0;
            text-align: left;
            font-size: 0.9em;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 1px 0;
          }
          .grand-total {
            font-size: 1.2em;
            font-weight: 900;
            margin: 3px 0;
          }
          .footer-note {
            font-size: 0.85em;
            color: #222;
            margin-top: 4px;
            text-align: center;
          }
          @media print {
            body {
              padding: 4px 2px;
              width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="header-title uppercase">${receipt.clinic?.name || 'CENTRO MÉDICO & FARMACIA'}</div>
          ${receipt.clinic?.address ? `<div>${receipt.clinic.address}</div>` : ''}
          ${receipt.clinic?.phone ? `<div>Tel: ${receipt.clinic.phone}</div>` : ''}
          <div class="ticket-badge">TICKET #${receipt.ticket_number}</div>
        </div>

        <div class="divider"></div>

        <div>
          <div><strong>FECHA:</strong> ${receipt.date}</div>
          <div><strong>CAJERO:</strong> ${receipt.cashier || 'Cajero'}</div>
          <div><strong>CLIENTE:</strong> ${receipt.patient_name}</div>
          ${receipt.patient_ci ? `<div><strong>CI/NIT:</strong> ${receipt.patient_ci}</div>` : ''}
          <div><strong>PAGO:</strong> ${receipt.payment_method.toUpperCase()}</div>
        </div>

        <div class="divider"></div>

        <table>
          <thead>
            <tr>
              <th style="width: 15%;">CANT</th>
              <th style="width: 60%;">DESCRIPCIÓN</th>
              <th style="width: 25%; text-align: right;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider"></div>

        <div>
          <div class="totals-row">
            <span>SUBTOTAL:</span>
            <span>${receipt.subtotal.toFixed(2)} ${currency}</span>
          </div>
          ${receipt.discount > 0 ? `
            <div class="totals-row">
              <span>DESCUENTO:</span>
              <span>-${receipt.discount.toFixed(2)} ${currency}</span>
            </div>
          ` : ''}
          <div class="double-divider"></div>
          <div class="totals-row grand-total bold">
            <span>TOTAL:</span>
            <span>${receipt.total.toFixed(2)} ${currency}</span>
          </div>
          <div class="double-divider"></div>
          ${receipt.payment_method === 'cash' ? `
            <div class="totals-row" style="font-size: 0.9em;">
              <span>EFECTIVO:</span>
              <span>${receipt.received_amount.toFixed(2)} ${currency}</span>
            </div>
            <div class="totals-row bold" style="font-size: 0.95em;">
              <span>CAMBIO:</span>
              <span>${receipt.change_amount.toFixed(2)} ${currency}</span>
            </div>
          ` : ''}
        </div>

        <div class="divider"></div>

        <div class="text-center footer-note">
          <p class="bold">¡GRACIAS POR SU COMPRA!</p>
          <p>Conserve este ticket como comprobante</p>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 250);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export default function PosThermalTicketModal({
  open,
  onOpenChange,
  sales = [],
  clinic,
}: PosThermalTicketModalProps) {
  const [search, setSearch] = useState('');

  const filteredSales = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter(s =>
      s.ticket_number.toLowerCase().includes(q) ||
      s.patient_name.toLowerCase().includes(q) ||
      (s.patient_ci ?? '').toLowerCase().includes(q) ||
      s.date.toLowerCase().includes(q)
    );
  }, [sales, search]);

  const currency = clinic?.currency ?? 'BOB';
  const currencySymbol = currency === 'USD' ? '$' : 'Bs.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-6 shadow-xl">
        <DialogHeader className="mb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Printer className="w-5 h-5 text-[#0284C7]" />
              Ventas Realizadas
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Buscador */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por Ticket # o Cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 text-sm rounded-xl bg-gray-50 dark:bg-[#1E293B] border-gray-200 dark:border-gray-700"
          />
        </div>

        {/* Lista de ventas */}
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {filteredSales.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <FileText className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm">No hay ventas registradas</p>
            </div>
          ) : (
            filteredSales.map((sale) => (
              <div
                key={sale.ticket_number}
                className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#111827] flex items-center justify-between gap-4 hover:border-sky-400 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#0369A1] dark:text-[#38BDF8]">
                      #{sale.ticket_number}
                    </span>
                    <span className="text-xs text-gray-400">• {sale.date}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate mt-0.5">
                    {sale.patient_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-base font-bold text-gray-900 dark:text-white">
                    {sale.total.toFixed(2)} {currencySymbol}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => printThermalReceipt(sale)}
                    className="h-9 px-3.5 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-xl gap-1.5 text-xs font-semibold cursor-pointer shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs px-4"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
