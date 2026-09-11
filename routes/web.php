<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Erp\DashboardController;
use App\Http\Controllers\Erp\PatientController;
use App\Http\Controllers\Erp\PatientFileController;
use App\Http\Controllers\Erp\AppointmentController;
use App\Http\Controllers\Erp\ClinicalController;
use App\Http\Controllers\Erp\FinancialController;
use App\Http\Controllers\Erp\InventoryController;
use App\Http\Controllers\Erp\UserController as ErpUserController;
use App\Http\Controllers\Erp\AccountingController;
use App\Http\Controllers\Erp\PdfController;
use App\Http\Controllers\Erp\FinancialReportController;
use App\Http\Controllers\Erp\ExportController;
use App\Http\Controllers\SuperAdmin\TenantController;
use App\Http\Controllers\SuperAdmin\UserController as SAUserController;
use App\Http\Controllers\SuperAdmin\PlanController;
use App\Http\Controllers\Erp\RadiographController;
use App\Http\Controllers\Erp\SurgeryController;

/*
|--------------------------------------------------------------------------
| Web Routes — Inertia.js
|--------------------------------------------------------------------------
*/

// --- Auth ---
Route::get('/login',        [AuthController::class, 'showLogin'])->name('login');
Route::post('/login',       [AuthController::class, 'login'])->name('login.post');
Route::post('/logout',      [AuthController::class, 'logout'])->name('logout');
Route::post('/demo-access', [AuthController::class, 'demoAccess'])->name('demo.access');

// --- ERP (dentist / admin / staff) ---
Route::middleware(['auth', 'checkTenant'])->group(function () {
    Route::get('/',               [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard',      [DashboardController::class, 'index']);

    // Patients
    Route::get('/patients',           [PatientController::class, 'index'])->name('patients.index');
    Route::get('/patients/{id}',      [PatientController::class, 'show'])->name('patients.show');
    Route::post('/patients',          [PatientController::class, 'store'])->name('patients.store');
    Route::put('/patients/{id}',      [PatientController::class, 'update'])->name('patients.update');
    Route::delete('/patients/{id}',   [PatientController::class, 'destroy'])->name('patients.destroy');

    // Patient Files & Folders
    Route::post('/patients/{patient}/folders',                             [PatientFileController::class, 'storeFolder'])->name('patients.folders.store');
    Route::delete('/patients/{patient}/folders/{folder}',                  [PatientFileController::class, 'destroyFolder'])->name('patients.folders.destroy');
    Route::post('/patients/{patient}/folders/{folder}/files',              [PatientFileController::class, 'storeFile'])->name('patients.files.store');
    Route::delete('/patients/{patient}/files/{file}',                      [PatientFileController::class, 'destroyFile'])->name('patients.files.destroy');
    Route::get('/patients/{patient}/files/{file}/download',                [PatientFileController::class, 'download'])->name('patients.files.download');

    // Appointments
    Route::get('/appointments',        [AppointmentController::class, 'index'])->name('appointments.index');
    Route::post('/appointments',       [AppointmentController::class, 'store'])->name('appointments.store');
    Route::put('/appointments/{id}',   [AppointmentController::class, 'update'])->name('appointments.update');
    Route::delete('/appointments/{id}',[AppointmentController::class, 'destroy'])->name('appointments.destroy');

    // Surgeries & Operating Room
    Route::get('/surgeries',                   [SurgeryController::class, 'index'])->name('surgeries.index');
    Route::post('/surgeries',                  [SurgeryController::class, 'store'])->name('surgeries.store');
    Route::put('/surgeries/{id}',              [SurgeryController::class, 'update'])->name('surgeries.update');
    Route::put('/surgeries/{id}/protocol',     [SurgeryController::class, 'updateProtocol'])->name('surgeries.protocol');
    Route::delete('/surgeries/{id}',           [SurgeryController::class, 'destroy'])->name('surgeries.destroy');

    // Clinical History & Diagnostic Studies
    Route::get('/clinical-history',              [ClinicalController::class, 'index'])->name('clinical.index');
    Route::post('/clinical-history',             [ClinicalController::class, 'storeRecord'])->name('clinical.store');
    Route::put('/clinical-history/{id}',         [ClinicalController::class, 'updateRecord'])->name('clinical.update');
    Route::delete('/clinical-history/{id}',      [ClinicalController::class, 'destroyRecord'])->name('clinical.destroy');
    Route::get('/radiographs',                   [RadiographController::class, 'index'])->name('radiographs.index');

    // Financial
    Route::get('/budgets',            [FinancialController::class, 'indexBudgets'])->name('budgets.index');
    Route::post('/budgets',           [FinancialController::class, 'storeBudget'])->name('budgets.store');
    Route::put('/budgets/{id}',       [FinancialController::class, 'updateBudget'])->name('budgets.update');
    Route::delete('/budgets/{id}',    [FinancialController::class, 'destroyBudget'])->name('budgets.destroy');
    Route::get('/payments',           [FinancialController::class, 'indexPayments'])->name('payments.index');
    Route::post('/payments',          [FinancialController::class, 'storePayment'])->name('payments.store');
    Route::delete('/payments/{id}',   [FinancialController::class, 'destroyPayment'])->name('payments.destroy');
    Route::get('/invoices',           [FinancialController::class, 'indexInvoices'])->name('invoices.index');
    Route::post('/invoices',          [FinancialController::class, 'storeInvoice'])->name('invoices.store');

    // Inventory
    Route::get('/inventory',              [InventoryController::class, 'index'])->name('inventory.index');
    Route::post('/inventory/items',       [InventoryController::class, 'storeItem'])->name('inventory.store');
    Route::put('/inventory/items/{id}',   [InventoryController::class, 'updateItem'])->name('inventory.update');
    Route::delete('/inventory/items/{id}',[InventoryController::class, 'destroyItem'])->name('inventory.destroy');
    Route::post('/inventory/categories',  [InventoryController::class, 'storeCategory'])->name('inventory.categories.store');
    Route::delete('/inventory/categories/{id}', [InventoryController::class, 'destroyCategory'])->name('inventory.categories.destroy');
    Route::post('/inventory/movements',   [InventoryController::class, 'storeMovement'])->name('inventory.movement');
    Route::post('/inventory/pos-sale',    [InventoryController::class, 'storePosSale'])->name('inventory.pos-sale');

    // Accounting
    Route::get('/accounting',             [AccountingController::class, 'index'])->name('accounting.index');
    Route::post('/accounting/expenses',   [AccountingController::class, 'storeExpense'])->name('accounting.expenses.store');
    Route::put('/accounting/expenses/{id}',[AccountingController::class, 'updateExpense'])->name('accounting.expenses.update');
    Route::delete('/accounting/expenses/{id}',[AccountingController::class, 'destroyExpense'])->name('accounting.expenses.destroy');
    Route::post('/accounting/accounts',   [AccountingController::class, 'storeAccount'])->name('accounting.accounts.store');
    Route::post('/accounting/entries',    [AccountingController::class, 'storeEntry'])->name('accounting.entries.store');
    Route::get('/accounting/mayor/{id}',  [AccountingController::class, 'libroMayor'])->name('accounting.mayor');

    // Reports & Settings
    Route::get('/reports',                       [\App\Http\Controllers\Erp\ReportController::class, 'index'])->name('reports');
    Route::get('/settings',                      [ErpUserController::class, 'index'])->name('settings');
    Route::post('/settings/profile',             [ErpUserController::class, 'updateProfile'])->name('settings.profile');
    Route::post('/settings/password',            [ErpUserController::class, 'updatePassword'])->name('settings.password');
    Route::post('/settings/users',               [ErpUserController::class, 'store'])->name('settings.users.store');
    Route::put('/settings/users/{id}',           [ErpUserController::class, 'update'])->name('settings.users.update');
    Route::delete('/settings/users/{id}',        [ErpUserController::class, 'destroy'])->name('settings.users.destroy');
    Route::post('/settings/users/{id}/reset-password', [ErpUserController::class, 'resetUserPassword'])->name('settings.users.reset-password');
    Route::post('/settings/users/{id}/permissions',    [ErpUserController::class, 'updatePermissions'])->name('settings.users.permissions');
    Route::post('/settings/clinic',                    [ErpUserController::class, 'updateClinic'])->name('settings.clinic');

    // Public View (Booking) Settings
    Route::get('/public-view',           [\App\Http\Controllers\Erp\PublicViewController::class, 'index'])->name('public-view.index');
    Route::post('/public-view/qr',       [\App\Http\Controllers\Erp\PublicViewController::class, 'uploadQr'])->name('public-view.qr');
    Route::post('/public-view/appointments/{id}/accept', [\App\Http\Controllers\Erp\PublicViewController::class, 'acceptPayment'])->name('public-view.appointments.accept');
    Route::post('/public-view/appointments/{id}/reject', [\App\Http\Controllers\Erp\PublicViewController::class, 'rejectPayment'])->name('public-view.appointments.reject');
    Route::post('/public-view/treatments',               [\App\Http\Controllers\Erp\PublicViewController::class, 'storeTreatment'])->name('public-view.treatments.store');
    Route::put('/public-view/treatments/{id}',           [\App\Http\Controllers\Erp\PublicViewController::class, 'updateTreatment'])->name('public-view.treatments.update');
    Route::delete('/public-view/treatments/{id}',        [\App\Http\Controllers\Erp\PublicViewController::class, 'destroyTreatment'])->name('public-view.treatments.destroy');
    Route::post('/public-view/treatments/{id}/image',    [\App\Http\Controllers\Erp\PublicViewController::class, 'uploadTreatmentImage'])->name('public-view.treatments.image');
    Route::post('/public-view/appearance',               [\App\Http\Controllers\Erp\PublicViewController::class, 'updateAppearance'])->name('public-view.appearance');
    Route::post('/public-view/booking-hours',            [\App\Http\Controllers\Erp\PublicViewController::class, 'updateBookingHours'])->name('public-view.booking-hours');

    // ── PDF Downloads ─────────────────────────────────────────────────────
    Route::get('/invoices/{id}/pdf',              [PdfController::class, 'invoicePdf'])->name('invoices.pdf');
    Route::get('/budgets/{id}/pdf',               [PdfController::class, 'budgetPdf'])->name('budgets.pdf');
    Route::get('/payments/{id}/pdf',              [PdfController::class, 'paymentPdf'])->name('payments.pdf');
    Route::get('/patients/{id}/clinical-pdf',     [PdfController::class, 'clinicalHistoryPdf'])->name('clinical.pdf');
    Route::get('/clinical-records/{id}/prescription-pdf', [PdfController::class, 'prescriptionPdf'])->name('clinical.prescription-pdf');

    // ── Financial Statements ──────────────────────────────────────────────
    Route::get('/financial/income-statement',     [FinancialReportController::class, 'incomeStatement'])->name('financial.income-statement');
    Route::get('/financial/balance-sheet',        [FinancialReportController::class, 'balanceSheet'])->name('financial.balance-sheet');

    // ── Exports (CSV / XLSX) ──────────────────────────────────────────────
    Route::prefix('export')->name('export.')->group(function () {
        Route::get('/patients',          [ExportController::class, 'patients'])->name('patients');
        Route::get('/appointments',      [ExportController::class, 'appointments'])->name('appointments');
        Route::get('/payments',          [ExportController::class, 'payments'])->name('payments');
        Route::get('/expenses',          [ExportController::class, 'expenses'])->name('expenses');
        Route::get('/inventory',         [ExportController::class, 'inventory'])->name('inventory');
        Route::get('/income-statement',  [ExportController::class, 'incomeStatement'])->name('income-statement');
    });
});

// --- SuperAdmin ---
Route::prefix('superadmin')->name('superadmin.')->middleware(['auth', 'superadmin'])->group(function () {
    Route::get('/',                              [TenantController::class, 'dashboard'])->name('dashboard');
    Route::get('/clinics',                       [TenantController::class, 'index'])->name('clinics.index');
    Route::get('/clinics/{id}',                  [TenantController::class, 'show'])->name('clinics.show');
    Route::post('/clinics',                      [TenantController::class, 'store'])->name('clinics.store');
    Route::put('/clinics/{id}',                  [TenantController::class, 'update'])->name('clinics.update');
    Route::patch('/clinics/{id}/status',         [TenantController::class, 'toggleStatus'])->name('clinics.status');
    Route::post('/clinics/{id}/users',           [TenantController::class, 'createUser'])->name('clinics.users.store');
    Route::put('/clinics/{tenantId}/users/{userId}',           [TenantController::class, 'updateUser'])->name('clinics.users.update');
    Route::post('/clinics/{tenantId}/users/{userId}/password', [TenantController::class, 'resetUserPassword'])->name('clinics.users.password');
    Route::delete('/clinics/{tenantId}/users/{userId}',        [TenantController::class, 'destroyUser'])->name('clinics.users.destroy');
    Route::get('/users',                         [SAUserController::class, 'index'])->name('users.index');
    Route::get('/plans',                         [PlanController::class, 'index'])->name('plans.index');
    Route::get('/demo-leads',                    [\App\Http\Controllers\SuperAdmin\DemoLeadController::class, 'index'])->name('demo-leads.index');
    Route::delete('/demo-leads/{id}',             [\App\Http\Controllers\SuperAdmin\DemoLeadController::class, 'destroy'])->name('demo-leads.destroy');
    
    // Areas Management
    Route::get('/areas',                         [\App\Http\Controllers\SuperAdmin\AreaController::class, 'index'])->name('areas.index');
    Route::post('/areas',                        [\App\Http\Controllers\SuperAdmin\AreaController::class, 'store'])->name('areas.store');
    Route::put('/areas/{id}',                    [\App\Http\Controllers\SuperAdmin\AreaController::class, 'update'])->name('areas.update');
    Route::patch('/areas/{id}/status',           [\App\Http\Controllers\SuperAdmin\AreaController::class, 'toggleStatus'])->name('areas.status');
    Route::post('/areas/{id}/password',          [\App\Http\Controllers\SuperAdmin\AreaController::class, 'resetPassword'])->name('areas.password');
    Route::delete('/areas/{id}',                 [\App\Http\Controllers\SuperAdmin\AreaController::class, 'destroy'])->name('areas.destroy');
});

// --- Area Portal (Dental Area / Clinic Network) ---
Route::prefix('area')->name('area.')->middleware(['auth', 'area'])->group(function () {
    Route::get('/',                                   [\App\Http\Controllers\Area\AreaDashboardController::class, 'dashboard'])->name('dashboard');
    Route::get('/dashboard',                          [\App\Http\Controllers\Area\AreaDashboardController::class, 'dashboard']);
    Route::get('/reports',                            [\App\Http\Controllers\Area\AreaReportController::class, 'index'])->name('reports.index');
    Route::get('/clinics',                            [\App\Http\Controllers\Area\AreaClinicController::class, 'index'])->name('clinics.index');
    Route::post('/clinics/{tenantId}/impersonate',    [\App\Http\Controllers\Area\AreaClinicController::class, 'impersonate'])->name('clinics.impersonate');
    Route::post('/exit-impersonation',                [\App\Http\Controllers\Area\AreaClinicController::class, 'exitImpersonation'])->name('exit-impersonation');
});

// --- Public Booking ---
use App\Http\Controllers\PublicAppointmentController;

Route::get('/book/{tenantSlug}', [PublicAppointmentController::class, 'create'])->name('public.appointments.create');
Route::post('/book/{tenantSlug}', [PublicAppointmentController::class, 'store'])->name('public.appointments.store');
Route::get('/api/book/{tenantSlug}/data', [PublicAppointmentController::class, 'getData'])->name('public.appointments.data');

// Fallback: cualquier ruta desconocida → dashboard (Inertia maneja el resto)
Route::fallback(fn () => redirect()->route('dashboard'));

