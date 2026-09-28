import { api } from "./api";
import type { Patient, PatientListItem } from "../types";

export type AllergyInput = {
  allergen: string;
  severity: string;
  notes: string;
};

export type MedicalConditionInput = {
  condition_name: string;
  since_date: string;
  notes: string;
};

export type EmergencyContactInput = {
  name: string;
  relationship_type: string;
  phone: string;
};

export type PatientCreateInput = {
  first_name: string;
  last_name: string;
  national_id?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  blood_type?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  notes?: string | null;
  allergies: AllergyInput[];
  medical_conditions: MedicalConditionInput[];
  emergency_contacts: EmergencyContactInput[];
};

export type PatientUpdateInput = {
  first_name?: string;
  last_name?: string;
  national_id?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  blood_type?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  notes?: string | null;
  is_active?: boolean;
};

export async function listPatients(params?: {
  search?: string;
  skip?: number;
  limit?: number;
}): Promise<PatientListItem[]> {
  const { data } = await api.get("/erp/patients", { params });
  return data;
}

export async function getPatient(id: string): Promise<Patient> {
  const { data } = await api.get(`/erp/patients/${id}`);
  return data;
}

export async function createPatient(body: PatientCreateInput): Promise<Patient> {
  const { data } = await api.post("/erp/patients", body);
  return data;
}

export async function updatePatient(id: string, body: PatientUpdateInput): Promise<Patient> {
  const { data } = await api.put(`/erp/patients/${id}`, body);
  return data;
}
