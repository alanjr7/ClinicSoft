<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\AccountingAccount;
use App\Models\ExpenseCategory;
use App\Models\Treatment;
use App\Models\InventoryCategory;

class TenantSetupService
{
    /**
     * Set up default data for a newly created tenant.
     * This ensures each clinic gets its own isolated charts of accounts, expense categories, treatments, and inventory categories.
     */
    public static function setupDefaults(Tenant $tenant): void
    {
        self::setupAccountingDefaults($tenant);
        self::setupTreatmentDefaults($tenant);
        self::setupInventoryDefaults($tenant);
    }

    public static function setupAccountingDefaults(Tenant $tenant): void
    {
        $accounts = [
            ['code' => '1000', 'name' => 'ACTIVOS', 'type' => 'asset', 'parent_code' => null],
            ['code' => '1100', 'name' => 'Activo Corriente', 'type' => 'asset', 'parent_code' => '1000'],
            ['code' => '1110', 'name' => 'Caja', 'type' => 'asset', 'parent_code' => '1100'],
            ['code' => '1120', 'name' => 'Banco (Cuenta corriente / Caja de Ahorros)', 'type' => 'asset', 'parent_code' => '1100'],
            ['code' => '1130', 'name' => 'Cuentas por Cobrar Pacientes', 'type' => 'asset', 'parent_code' => '1100'],
            ['code' => '1200', 'name' => 'Activo No Corriente', 'type' => 'asset', 'parent_code' => '1000'],
            ['code' => '1210', 'name' => 'Equipos Médicos y Diagnóstico', 'type' => 'asset', 'parent_code' => '1200'],
            ['code' => '1220', 'name' => 'Mobiliario y Consultorios', 'type' => 'asset', 'parent_code' => '1200'],
            ['code' => '1230', 'name' => 'Depreciación Acumulada', 'type' => 'asset', 'parent_code' => '1200'],

            ['code' => '2000', 'name' => 'PASIVOS', 'type' => 'liability', 'parent_code' => null],
            ['code' => '2100', 'name' => 'Pasivo Corriente', 'type' => 'liability', 'parent_code' => '2000'],
            ['code' => '2110', 'name' => 'Cuentas por Pagar Proveedores / Farmacia', 'type' => 'liability', 'parent_code' => '2100'],
            ['code' => '2120', 'name' => 'Sueldos y Honorarios por Pagar', 'type' => 'liability', 'parent_code' => '2100'],
            ['code' => '2130', 'name' => 'Impuestos por Pagar', 'type' => 'liability', 'parent_code' => '2100'],

            ['code' => '3000', 'name' => 'PATRIMONIO', 'type' => 'equity', 'parent_code' => null],
            ['code' => '3100', 'name' => 'Capital Social / Médicos Propietarios', 'type' => 'equity', 'parent_code' => '3000'],
            ['code' => '3200', 'name' => 'Utilidades del Período', 'type' => 'equity', 'parent_code' => '3000'],

            ['code' => '4000', 'name' => 'INGRESOS', 'type' => 'revenue', 'parent_code' => null],
            ['code' => '4100', 'name' => 'Ingresos por Consultas Médicas', 'type' => 'revenue', 'parent_code' => '4000'],
            ['code' => '4200', 'name' => 'Ingresos por Procedimientos y Cirugías Menores', 'type' => 'revenue', 'parent_code' => '4000'],
            ['code' => '4300', 'name' => 'Ingresos por Estudios Diagnósticos y Laboratorio', 'type' => 'revenue', 'parent_code' => '4000'],
            ['code' => '4400', 'name' => 'Otros Ingresos', 'type' => 'revenue', 'parent_code' => '4000'],

            ['code' => '5000', 'name' => 'EGRESOS', 'type' => 'expense', 'parent_code' => null],
            ['code' => '5100', 'name' => 'Sueldos y Honorarios Médicos', 'type' => 'expense', 'parent_code' => '5000'],
            ['code' => '5200', 'name' => 'Alquiler del Centro Médico', 'type' => 'expense', 'parent_code' => '5000'],
            ['code' => '5300', 'name' => 'Servicios Básicos y Oxígeno Medicinal', 'type' => 'expense', 'parent_code' => '5000'],
            ['code' => '5400', 'name' => 'Insumos Médicos y Farmacia', 'type' => 'expense', 'parent_code' => '5000'],
            ['code' => '5500', 'name' => 'Equipos y Mantenimiento Biomédico', 'type' => 'expense', 'parent_code' => '5000'],
            ['code' => '5600', 'name' => 'Publicidad y Marketing', 'type' => 'expense', 'parent_code' => '5000'],
            ['code' => '5700', 'name' => 'Gastos Administrativos y Limpieza', 'type' => 'expense', 'parent_code' => '5000'],
            ['code' => '5800', 'name' => 'Impuestos y Tasas', 'type' => 'expense', 'parent_code' => '5000'],
            ['code' => '5900', 'name' => 'Otros Gastos', 'type' => 'expense', 'parent_code' => '5000'],
        ];

        $expenseCategories = [
            ['code' => '5100', 'name' => 'Sueldos y Honorarios Médicos', 'description' => 'Médicos especialistas, enfermería y personal administrativo'],
            ['code' => '5200', 'name' => 'Alquiler del Centro Médico', 'description' => 'Canon mensual de consultorios o edificio'],
            ['code' => '5300', 'name' => 'Servicios Básicos y Oxígeno', 'description' => 'Luz, agua, internet, oxígeno medicinal'],
            ['code' => '5400', 'name' => 'Insumos Médicos y Farmacia', 'description' => 'Medicamentos, descartables, material de curación'],
            ['code' => '5500', 'name' => 'Equipos y Mantenimiento Biomédico', 'description' => 'Calibración, mantenimiento y compras'],
            ['code' => '5600', 'name' => 'Publicidad y Difusión', 'description' => 'Medios, redes sociales, portal web'],
            ['code' => '5700', 'name' => 'Gastos Administrativos y Bioseguridad', 'description' => 'Papelería, útiles, esterilización y limpieza'],
            ['code' => '5800', 'name' => 'Impuestos y Tasas', 'description' => 'Patentes municipales e impuestos'],
            ['code' => '5900', 'name' => 'Otros Gastos', 'description' => 'Gastos varios y contingencias'],
        ];

        $createdAccounts = [];

        // 1. Create accounts
        foreach ($accounts as $accountData) {
            $parentId = null;
            if ($accountData['parent_code']) {
                $parentId = $createdAccounts[$accountData['parent_code']] ?? null;
            }

            $account = AccountingAccount::firstOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'code' => $accountData['code'],
                ],
                [
                    'name' => $accountData['name'],
                    'type' => $accountData['type'],
                    'parent_id' => $parentId,
                    'is_active' => true,
                ]
            );

            $createdAccounts[$accountData['code']] = $account->id;
        }

        // 2. Create expense categories linked to the appropriate account
        foreach ($expenseCategories as $categoryData) {
            $accountId = $createdAccounts[$categoryData['code']] ?? null;

            ExpenseCategory::firstOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'name' => $categoryData['name'],
                ],
                [
                    'code' => $categoryData['code'],
                    'description' => $categoryData['description'],
                    'accounting_account_id' => $accountId,
                    'is_active' => true,
                ]
            );
        }
    }

    private static function setupTreatmentDefaults(Tenant $tenant): void
    {
        $procedures = [
            ['name' => 'Consulta Medicina General', 'base_price' => 100.00, 'duration_minutes' => 30],
            ['name' => 'Consulta Médica de Especialidad', 'base_price' => 200.00, 'duration_minutes' => 45],
            ['name' => 'Control Pediátrico / Niño Sano', 'base_price' => 150.00, 'duration_minutes' => 30],
            ['name' => 'Consulta Ginecológica y Papanicolaou', 'base_price' => 250.00, 'duration_minutes' => 45],
            ['name' => 'Control Prenatal', 'base_price' => 180.00, 'duration_minutes' => 30],
            ['name' => 'Electrocardiograma (EKG) con Informe', 'base_price' => 180.00, 'duration_minutes' => 30],
            ['name' => 'Curación y Tratamiento de Heridas', 'base_price' => 120.00, 'duration_minutes' => 30],
            ['name' => 'Sutura Simple de Herida', 'base_price' => 220.00, 'duration_minutes' => 45],
            ['name' => 'Retiro de Puntos / Material de Sutura', 'base_price' => 80.00, 'duration_minutes' => 20],
            ['name' => 'Infiltración Articular / Muscular', 'base_price' => 300.00, 'duration_minutes' => 30],
            ['name' => 'Lavado de Oído / Extracción de Cerumen', 'base_price' => 150.00, 'duration_minutes' => 30],
            ['name' => 'Nebulización y Terapia Respiratoria', 'base_price' => 90.00, 'duration_minutes' => 30],
            ['name' => 'Aplicación de Inyectable / Sueroterapia', 'base_price' => 70.00, 'duration_minutes' => 20],
            ['name' => 'Extirpación de Quiste o Lesión Cutánea', 'base_price' => 450.00, 'duration_minutes' => 60],
            ['name' => 'Certificado Médico Oficial / Aptitud Física', 'base_price' => 100.00, 'duration_minutes' => 20],
        ];

        foreach ($procedures as $procedure) {
            Treatment::firstOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'name' => $procedure['name'],
                ],
                [
                    'base_price' => $procedure['base_price'],
                    'duration_minutes' => $procedure['duration_minutes'],
                    'is_active' => true,
                ]
            );
        }
    }

    public static function setupInventoryDefaults(Tenant $tenant): void
    {
        $categories = [
            ['name' => 'Medicamentos y Farmacia', 'description' => 'Antibióticos, analgésicos, antiinflamatorios y fármacos de uso común'],
            ['name' => 'Material Descartable y Curación', 'description' => 'Gasas estériles, apósitos, vendas, algodón, tela adhesiva y guantes'],
            ['name' => 'Soluciones, Sueros y Electrolitos', 'description' => 'Solución fisiológica, Ringer lactato, dextrosa y agua destilada'],
            ['name' => 'Inyectables, Jeringas y Agujas', 'description' => 'Jeringas descartables, catéteres venosos, equipos de venoclisis y agujas'],
            ['name' => 'Suturas y Cirugía Menor', 'description' => 'Hilos de sutura (nylon, vicryl), hojas de bisturí y apósitos quirúrgicos'],
            ['name' => 'Instrumental y Equipamiento Médico', 'description' => 'Fonendoscopios, tensiómetros, oxímetros, termómetros e instrumental'],
            ['name' => 'Bioseguridad y Esterilización', 'description' => 'Alcohol, antisépticos (clorhexidina, iodopovidona), mascarillas y desinfectantes'],
            ['name' => 'Reactivos y Diagnóstico Rápido', 'description' => 'Tiras de glucemia, pruebas rápidas, lancetas y reactivos clínicos'],
            ['name' => 'Insumos Generales y Oficina', 'description' => 'Suministros administrativos, papelería médica y limpieza'],
        ];

        foreach ($categories as $cat) {
            InventoryCategory::firstOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'name' => $cat['name'],
                ],
                [
                    'description' => $cat['description'],
                ]
            );
        }
    }
}
