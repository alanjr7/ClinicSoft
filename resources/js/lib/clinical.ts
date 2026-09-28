import { api } from "./api";
import type { ClinicalRecord, ClinicalRecordListItem } from "../types";

export interface ClinicalRecordCreateInput {
  patient_id: string;
  appointment_id?: string | null;
  visit_date: string;
  chief_complaint?: string | null;
  diagnosis?: string | null;
  treatment_performed?: string | null;
  prescriptions?: string | null;
  observations?: string | null;
  next_visit_notes?: string | null;
}

export interface ClinicalRecordUpdateInput {
  visit_date?: string;
  chief_complaint?: string | null;
  diagnosis?: string | null;
  treatment_performed?: string | null;
  prescriptions?: string | null;
  observations?: string | null;
  next_visit_notes?: string | null;
}

export interface ClinicalRecordListParams {
  patient_id?: string;
  dentist_id?: string;
  skip?: number;
  limit?: number;
}

export async function listClinicalRecords(
  params?: ClinicalRecordListParams
): Promise<ClinicalRecordListItem[]> {
  const { data } = await api.get("/erp/clinical-records", { params });
  return data;
}

export async function getClinicalRecord(id: string): Promise<ClinicalRecord> {
  const { data } = await api.get(`/erp/clinical-records/${id}`);
  return data;
}

export async function createClinicalRecord(
  body: ClinicalRecordCreateInput
): Promise<ClinicalRecord> {
  const { data } = await api.post("/erp/clinical-records", body);
  return data;
}

export async function updateClinicalRecord(
  id: string,
  body: ClinicalRecordUpdateInput
): Promise<ClinicalRecord> {
  const { data } = await api.put(`/erp/clinical-records/${id}`, body);
  return data;
}

export async function deleteClinicalRecord(id: string): Promise<void> {
  await api.delete(`/erp/clinical-records/${id}`);
}
