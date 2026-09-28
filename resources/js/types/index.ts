// ============================================================
// Tipos TypeScript centralizados — ClinicasSoft
// ============================================================

export type UserRole = "superadmin" | "doctor" | "admin" | "staff" | "owner";

export type AppModule =
  | "patients"
  | "appointments"
  | "surgeries"
  | "clinical"
  | "clinical_history"
  | "budgets"
  | "payments"
  | "inventory"
  | "reports"
  | "accounting"
  | "settings";

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  global_role: string | null;
  tenant_id: string | null;
  tenant_name: string | null;
  role: UserRole | null;
  /** módulos habilitados por el administrador para doctores y asistentes */
  permissions: string[];
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// ---- Tenants ----
export type TenantStatus = "trial" | "active" | "suspended" | "cancelled";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string;
  status: TenantStatus;
  default_tax_rate: number;
  created_at: string;
  plan_name: string | null;
}

export interface TenantCreate {
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  default_tax_rate?: number;
  plan_id: string;
}

export interface Plan {
  id: string;
  tier: string;
  name: string;
  max_users: number;
  max_patients: number;
  price_monthly: number;
}

// ---- Users ----
export interface ClinicUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  is_active: boolean;
  role: string;
  joined_at: string;
  dentist_profile?: {
    specialty?: string;
    license_number?: string;
    calendar_color?: string;
  };
}

export interface UserCreate {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: string;
}

export interface ModulePermission {
  module: AppModule;
  is_enabled: boolean;
}

// ---- Patients ----
export interface PatientListItem {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Patient extends PatientListItem {
  national_id?: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_type: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  updated_at: string;
  allergies: { id: string; allergen: string; severity: string | null; notes: string | null }[];
  medical_conditions: { id: string; condition_name: string; since_date: string | null; notes: string | null }[];
  emergency_contacts: { id: string; name: string; relationship_type: string | null; phone: string }[];
}

// ---- Appointments ----
export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export interface AppointmentPersonBrief {
  id: string;
  first_name: string;
  last_name: string;
}

export interface AppointmentListItem {
  id: string;
  patient_id: string;
  dentist_id: string;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  reason: string | null;
  patient: AppointmentPersonBrief;
  dentist: AppointmentPersonBrief;
}

export interface AppointmentTreatmentLink {
  id: string;
  treatment_id: string;
  tooth_number: number | null;
  notes: string | null;
}

export interface Appointment extends AppointmentListItem {
  notes: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  appointment_treatments: AppointmentTreatmentLink[];
}

export interface AppointmentTreatmentInput {
  treatment_id: string;
  notes?: string | null;
}

export interface DoctorOption {
  id: string;
  first_name: string;
  last_name: string;
  dentist_profile?: {
    specialty?: string;
    license_number?: string;
    calendar_color?: string;
  };
}

export interface PatientOption {
  id: string;
  first_name: string;
  last_name: string;
}

export interface TreatmentOption {
  id: string;
  name: string;
  duration_minutes: number;
  base_price: number;
}

// ---- Surgeries / Cirugías ----
export type SurgeryStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "post_op"
  | "completed"
  | "cancelled";

export interface SurgerySupplyItem {
  name: string;
  quantity: number;
  unit?: string;
  notes?: string;
}

export interface SurgeryListItem {
  id: string;
  patient_id: string;
  surgeon_name: string;
  anesthesiologist_name?: string | null;
  assistant_name?: string | null;
  nurse_name?: string | null;
  procedure_name: string;
  surgery_type?: string | null;
  operating_room?: string | null;
  scheduled_start_at: string;
  scheduled_end_at?: string | null;
  actual_start_at?: string | null;
  actual_end_at?: string | null;
  status: SurgeryStatus;
  pre_op_diagnosis?: string | null;
  post_op_diagnosis?: string | null;
  anesthesia_type?: string | null;
  surgical_protocol?: string | null;
  findings?: string | null;
  complications?: string | null;
  estimated_blood_loss?: string | null;
  pathology_samples?: string | null;
  implants_or_materials?: string | null;
  post_op_orders?: string | null;
  supplies_used?: SurgerySupplyItem[] | null;
  estimated_cost?: number | string | null;
  notes?: string | null;
  created_at: string;
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    national_id?: string | null;
    blood_type?: string | null;
    phone?: string | null;
    gender?: string | null;
    date_of_birth?: string | null;
    allergies?: { id: string; allergen: string; severity: string | null }[];
    medical_conditions?: { id: string; condition_name: string }[];
  };
}

// ---- Clinical records / Consultas Médicas ----
export interface ClinicalPersonBrief {
  id: string;
  first_name: string;
  last_name: string;
}

export interface PrescriptionItem {
  name: string;
  presentation?: string;
  dose?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

export interface ClinicalRecordListItem {
  id: string;
  patient_id: string;
  dentist_id: string;
  visit_date: string;
  chief_complaint: string | null;
  diagnosis: string | null;
  blood_pressure?: string | null;
  heart_rate?: number | null;
  respiratory_rate?: number | null;
  temperature?: number | string | null;
  weight?: number | string | null;
  height?: number | string | null;
  bmi?: number | string | null;
  oxygen_saturation?: number | null;
  blood_glucose?: number | null;
  medical_background?: string | null;
  physical_examination?: string | null;
  treatment_performed?: string | null;
  prescriptions?: string | null;
  prescription_items?: PrescriptionItem[] | null;
  observations?: string | null;
  next_visit_notes?: string | null;
  created_at: string;
  patient: ClinicalPersonBrief;
  dentist: ClinicalPersonBrief;
}

export interface ClinicalRecord extends ClinicalRecordListItem {
  appointment_id: string | null;
  updated_at: string;
}

// ---- Treatments / Procedimientos ----
export interface TreatmentCategory {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TreatmentListItem {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  duration_minutes: number;
  category_id: string | null;
  is_active: boolean;
  category?: TreatmentCategory | null;
}

export interface Treatment extends TreatmentListItem {
  created_at: string;
  updated_at: string;
}

// ---- Dentists ----
export interface DentistOption {
  id: string;
  first_name: string;
  last_name: string;
}

// ---- Odontogram ----
export type ToothFace = "top" | "bottom" | "left" | "right" | "center";
export type ToothState = "healthy" | "cavity" | "restored" | "missing" | "crown" | "endodontics" | "extracted";

export interface OdontogramSnapshotListItem {
  id: string;
  patient_id: string;
  created_at: string;
  notes: string | null;
}

export interface OdontogramSnapshot extends OdontogramSnapshotListItem {
  teeth_data: Record<string, any>;
}

// ---- Budgets ----
export interface BudgetListItem {
  id: string;
  patient_id: string;
  total: number;
  status: string;
  created_at: string;
}

export interface Budget extends BudgetListItem {
  notes: string | null;
  items: any[];
}

export interface BudgetCreate {
  patient_id: string;
  notes?: string;
  items: any[];
}

// ---- API error ----
export interface ApiError {
  detail: string;
}


