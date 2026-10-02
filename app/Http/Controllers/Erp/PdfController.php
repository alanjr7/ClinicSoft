<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\ClinicalRecord;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\Tenant;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class PdfController extends Controller
{
    public function __construct()
    {
        $fontDir = storage_path('fonts');
        if (!is_dir($fontDir)) {
            @mkdir($fontDir, 0775, true);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Factura PDF
    // ─────────────────────────────────────────────────────────────────────────

    public function invoicePdf(Request $request, string $id)
    {
        try {
            $tenantId = $request->attributes->get('tenant_id');

            $query = Invoice::where('id', $id)->with([
                'patient',
                'items.treatment',
                'payments',
            ]);

            if ($tenantId) {
                $query->where('tenant_id', $tenantId);
            }

            $invoice = $query->firstOrFail();
            $tenant = Tenant::findOrFail($tenantId ?? $invoice->tenant_id);

            $pdf = Pdf::loadView('pdf.invoice', compact('invoice', 'tenant'))
                ->setPaper('letter', 'portrait')
                ->setOptions([
                    'dpi'                       => 96,
                    'defaultFont'               => 'DejaVu Sans',
                    'isHtml5ParserEnabled'      => true,
                    'isRemoteEnabled'           => false,
                ]);

            $filename = 'Factura-' . $invoice->invoice_number . '.pdf';

            return $this->respondPdf($request, $pdf, $filename);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error generating invoice PDF: ' . $e->getMessage(), [
                'id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);
            abort(500, 'Error al generar la factura PDF: ' . $e->getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Presupuesto PDF
    // ─────────────────────────────────────────────────────────────────────────

    public function budgetPdf(Request $request, string $id)
    {
        try {
            $tenantId = $request->attributes->get('tenant_id');

            $query = Budget::where('id', $id)->with([
                'patient',
                'items.treatment',
                'createdBy',
            ]);

            if ($tenantId) {
                $query->where('tenant_id', $tenantId);
            }

            $budget = $query->firstOrFail();
            $tenant = Tenant::findOrFail($tenantId ?? $budget->tenant_id);

            $pdf = Pdf::loadView('pdf.budget', compact('budget', 'tenant'))
                ->setPaper('letter', 'portrait')
                ->setOptions([
                    'dpi'                       => 96,
                    'defaultFont'               => 'DejaVu Sans',
                    'isHtml5ParserEnabled'      => true,
                    'isRemoteEnabled'           => false,
                ]);

            $filename = 'Presupuesto-' . $budget->budget_number . '.pdf';

            return $this->respondPdf($request, $pdf, $filename);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error generating budget PDF: ' . $e->getMessage(), [
                'id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);
            abort(500, 'Error al generar el presupuesto PDF: ' . $e->getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Recibo de Pago PDF
    // ─────────────────────────────────────────────────────────────────────────

    public function paymentPdf(Request $request, string $id)
    {
        try {
            $tenantId = $request->attributes->get('tenant_id');

            $query = \App\Models\Payment::where('id', $id)->with(['patient', 'items']);

            if ($tenantId) {
                $query->where('tenant_id', $tenantId);
            }

            $payment = $query->firstOrFail();
            $tenant = Tenant::findOrFail($tenantId ?? $payment->tenant_id);

            $pdf = Pdf::loadView('pdf.payment', compact('payment', 'tenant'))
                ->setPaper('letter', 'portrait')
                ->setOptions([
                    'dpi'                       => 96,
                    'defaultFont'               => 'DejaVu Sans',
                    'isHtml5ParserEnabled'      => true,
                    'isRemoteEnabled'           => false,
                ]);

            $filename = 'Recibo-Pago-' . substr($payment->id, 0, 8) . '.pdf';

            return $this->respondPdf($request, $pdf, $filename);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error generating payment PDF: ' . $e->getMessage(), [
                'id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);
            abort(500, 'Error al generar el recibo de pago PDF: ' . $e->getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Historia Clínica PDF
    // ─────────────────────────────────────────────────────────────────────────

    public function clinicalHistoryPdf(Request $request, string $patientId)
    {
        try {
            $tenantId = $request->attributes->get('tenant_id');

            $query = Patient::where('id', $patientId)->with(['allergies', 'medicalConditions', 'emergencyContacts']);

            if ($tenantId) {
                $query->where('tenant_id', $tenantId);
            }

            $patient = $query->firstOrFail();
            $resolvedTenantId = $tenantId ?? $patient->tenant_id;

            $records = ClinicalRecord::where('patient_id', $patientId)
                ->where('tenant_id', $resolvedTenantId)
                ->with('dentist:id,first_name,last_name')
                ->orderBy('visit_date', 'desc')
                ->get();

            $tenant = Tenant::findOrFail($resolvedTenantId);

            $pdf = Pdf::loadView('pdf.clinical_history', compact('patient', 'records', 'tenant'))
                ->setPaper('letter', 'portrait')
                ->setOptions([
                    'dpi'                       => 96,
                    'defaultFont'               => 'DejaVu Sans',
                    'isHtml5ParserEnabled'      => true,
                    'isRemoteEnabled'           => false,
                ]);

            $filename = 'HistoriaClinica-' . str_replace(' ', '_', $patient->last_name) . '.pdf';

            return $this->respondPdf($request, $pdf, $filename);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error generating clinical history PDF: ' . $e->getMessage(), [
                'patientId' => $patientId,
                'trace' => $e->getTraceAsString(),
            ]);
            abort(500, 'Error al generar la historia clínica PDF: ' . $e->getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Receta Médica PDF
    // ─────────────────────────────────────────────────────────────────────────

    public function prescriptionPdf(Request $request, string $recordId)
    {
        try {
            $tenantId = $request->attributes->get('tenant_id');

            $query = ClinicalRecord::where('id', $recordId)->with(['patient', 'dentist.dentistProfile']);

            if ($tenantId) {
                $query->where('tenant_id', $tenantId);
            }

            $record = $query->firstOrFail();
            $patient = $record->patient;
            $tenant = Tenant::findOrFail($tenantId ?? $record->tenant_id);

            $pdf = Pdf::loadView('pdf.prescription', compact('patient', 'record', 'tenant'))
                ->setPaper('letter', 'portrait')
                ->setOptions([
                    'dpi'                       => 96,
                    'defaultFont'               => 'DejaVu Sans',
                    'isHtml5ParserEnabled'      => true,
                    'isRemoteEnabled'           => false,
                ]);

            $filename = 'RecetaMedica-' . str_replace(' ', '_', $patient->last_name) . '-' . substr($record->id, 0, 6) . '.pdf';

            return $this->respondPdf($request, $pdf, $filename);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error generating prescription PDF: ' . $e->getMessage(), [
                'recordId' => $recordId,
                'trace' => $e->getTraceAsString(),
            ]);
            abort(500, 'Error al generar la receta médica PDF: ' . $e->getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper: stream vs download
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns PDF as download by default.
     * Pass ?preview=1 in the URL to stream it inline (browser view).
     */
    private function respondPdf(Request $request, $pdf, string $filename)
    {
        if ($request->boolean('preview')) {
            return $pdf->stream($filename);
        }

        return $pdf->download($filename);
    }
}
