<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Tenant;
use App\Models\SubscriptionPlan;
use App\Models\TenantUser;
use App\Models\DoctorProfile;
use App\Models\Patient;
use App\Models\Appointment;
use App\Models\ClinicalRecord;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database for 100% Medical Clinics (ClinicasSoft).
     */
    public function run(): void
    {
        $password = Hash::make('12345678');

        // 1. Superadmin Global
        User::create([
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'email' => 'superadmin@a.com',
            'password' => '219077681',
            'global_role' => 'superadmin',
            'is_active' => true,
        ]);

        // Subscription Plan
        $plan = SubscriptionPlan::create([
            'tier' => 'premium',
            'name' => 'Plan Clínicas Pro',
            'max_users' => 999,
            'max_patients' => 999999,
            'price_monthly' => 99.99,
        ]);

        // Tenant (Centro Médico / Clínica)
        $tenant = Tenant::create([
            'name' => 'Centro Médico y Clínica Santa María',
            'slug' => 'principal',
            'email' => 'clinica@a.com',
            'phone' => '+591 2 2445566',
            'address' => 'Av. 6 de Agosto #2450, Edif. Los Médicos, Piso 3',
            'plan_id' => $plan->id,
            'status' => 'active',
        ]);

        // 2. Tenant Admin (Administrador de la Clínica)
        $admin = User::create([
            'first_name' => 'Admin',
            'last_name' => 'Clínica',
            'email' => 'admin@a.com',
            'password' => $password,
            'global_role' => 'regular',
            'is_active' => true,
        ]);
        TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id' => $admin->id,
            'role' => 'admin',
            'is_active' => true,
        ]);

        // 3. Tenant Doctor / Especialista Médico (Dr. Carlos Mendoza)
        $doctor = User::create([
            'first_name' => 'Dr. Carlos',
            'last_name' => 'Mendoza',
            'email' => 'dentist@a.com', // Kept for quick test login
            'password' => $password,
            'global_role' => 'regular',
            'is_active' => true,
        ]);
        TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id' => $doctor->id,
            'role' => 'doctor',
            'is_active' => true,
        ]);
        DoctorProfile::create([
            'tenant_id' => $tenant->id,
            'user_id' => $doctor->id,
            'license_number' => 'MED-849201-LP',
            'specialty' => 'Medicina General y Medicina Interna',
            'calendar_color' => '#0284C7',
            'bio' => 'Médico cirujano especialista en medicina interna, manejo de pacientes crónicos y diagnóstico preventivo.',
        ]);

        // 4. Tenant Staff / Asistente de Enfermería
        $staff = User::create([
            'first_name' => 'Lic. María',
            'last_name' => 'Gutiérrez',
            'email' => 'staff@a.com',
            'password' => $password,
            'global_role' => 'regular',
            'is_active' => true,
        ]);
        TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id' => $staff->id,
            'role' => 'staff',
            'is_active' => true,
        ]);

        // 5. Accounting seed (Plan de Cuentas Hospitalario + Categorías de Egresos)
        $this->call(AccountingSeeder::class);

        // 6. Treatments / Procedimientos Médicos Seed
        $this->call(TreatmentSeeder::class);

        // 7. Seed Sample Medical Patients
        $patient1 = Patient::create([
            'tenant_id' => $tenant->id,
            'first_name' => 'Alejandro',
            'last_name' => 'Vargas Pinto',
            'national_id' => '6849201-LP',
            'date_of_birth' => '1988-05-14',
            'gender' => 'masculino',
            'blood_type' => 'O+',
            'phone' => '+591 71589423',
            'email' => 'alejandro.vargas@email.com',
            'address' => 'Calle 21 de Calacoto #450',
            'city' => 'La Paz',
            'state' => 'Murillo',
            'notes' => 'Paciente con antecedentes de hipertensión arterial controlada con Enalapril.',
            'is_active' => true,
            'created_by' => $doctor->id,
        ]);

        $patient1->allergies()->create([
            'tenant_id' => $tenant->id,
            'allergen' => 'Penicilina / Amoxicilina',
            'severity' => 'severa',
            'notes' => 'Edema facial y eritema cutáneo generalizado',
        ]);

        $patient1->medicalConditions()->create([
            'tenant_id' => $tenant->id,
            'condition_name' => 'Hipertensión Arterial Primaria (I10)',
            'since_date' => '2023-01-15',
            'notes' => 'Diagnosticado hace 3 años. Medicado con Enalapril 10mg cada 12h.',
        ]);

        $patient2 = Patient::create([
            'tenant_id' => $tenant->id,
            'first_name' => 'Valentina',
            'last_name' => 'Ríos Camacho',
            'national_id' => '9482710-CB',
            'date_of_birth' => '1995-11-20',
            'gender' => 'femenino',
            'blood_type' => 'A+',
            'phone' => '+591 76543210',
            'email' => 'valentina.rios@email.com',
            'address' => 'Av. América #1280',
            'city' => 'Cochabamba',
            'state' => 'Cercado',
            'notes' => 'Paciente sin alergias medicamentosas conocidas. Consulta por chequeo general.',
            'is_active' => true,
            'created_by' => $doctor->id,
        ]);

        // 8. Seed Sample Medical Appointments
        $now = now();
        $appt1 = Appointment::create([
            'tenant_id' => $tenant->id,
            'patient_id' => $patient1->id,
            'dentist_id' => $doctor->id,
            'start_at' => $now->copy()->setTime(9, 0),
            'end_at' => $now->copy()->setTime(9, 45),
            'status' => 'completed',
            'reason' => 'Consulta de Medicina General — Control Hipertensión y Rutina',
            'notes' => 'Paciente acude puntual a su revisión semestral.',
            'created_by' => $staff->id,
        ]);

        $appt2 = Appointment::create([
            'tenant_id' => $tenant->id,
            'patient_id' => $patient2->id,
            'dentist_id' => $doctor->id,
            'start_at' => $now->copy()->setTime(11, 30),
            'end_at' => $now->copy()->setTime(12, 15),
            'status' => 'confirmed',
            'reason' => 'Evaluación Médica Preventiva y Lectura de Exámenes de Laboratorio',
            'notes' => 'Trae hemograma y perfil lipídico.',
            'created_by' => $staff->id,
        ]);

        // 9. Seed Sample Clinical History with Vital Signs & Medical Prescription
        ClinicalRecord::create([
            'tenant_id' => $tenant->id,
            'patient_id' => $patient1->id,
            'appointment_id' => $appt1->id,
            'dentist_id' => $doctor->id,
            'visit_date' => $now->toDateString(),
            'blood_pressure' => '120/80',
            'heart_rate' => 74,
            'respiratory_rate' => 16,
            'temperature' => 36.6,
            'weight' => 74.5,
            'height' => 176,
            'bmi' => 24.1,
            'oxygen_saturation' => 98,
            'blood_glucose' => 92,
            'chief_complaint' => 'Paciente asiste a control médico de rutina. Refiere leve cefalea tensional vespertina ocasional.',
            'medical_background' => 'Hipertensión arterial diagnosticada en 2023. Alergia a Penicilinas. Niega cirugías previas.',
            'physical_examination' => 'Paciente lúcido, orientado en tiempo y espacio, normohidratado. Ruidos cardíacos rítmicos normofonéticos sin soplos. Campos pulmonares limpios y bien ventilados sin ruidos agregados. Abdomen blando, depresible, no doloroso a la palpación.',
            'diagnosis' => 'Hipertensión Esencial Controlada (CIE-10: I10) / Cefalea tensional leve (CIE-10: G44.2)',
            'treatment_performed' => 'Examen clínico general completo, somatometría y triaje de signos vitales. Consejería en hábitos cardiosaludables.',
            'prescription_items' => [
                [
                    'medication' => 'Enalapril 10 mg',
                    'dosage' => '1 comprimido',
                    'frequency' => 'Cada 12 horas',
                    'duration' => '30 días',
                    'instructions' => 'Tomar con abundante agua en ayunas por la mañana y noche.'
                ],
                [
                    'medication' => 'Paracetamol 500 mg',
                    'dosage' => '1 tableta',
                    'frequency' => 'Cada 8 horas (condicional)',
                    'duration' => '3 días',
                    'instructions' => 'Tomar solo en caso de dolor de cabeza persistente.'
                ]
            ],
            'observations' => 'Mantener dieta baja en sodio y realizar 30 minutos de caminata diaria.',
            'next_visit_notes' => 'Control médico en 3 meses con perfil lipídico y función renal (creatinina/urea).',
        ]);
    }
}
