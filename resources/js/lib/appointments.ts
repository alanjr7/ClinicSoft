import { api } from "./api";
import type {
  Appointment,
  AppointmentListItem,
  AppointmentTreatmentInput,
  DentistOption,
  PatientOption,
  TreatmentOption,
} from "../types";

export interface AppointmentCreateInput {
  patient_id: string;
  dentist_id: string;
  start_at: string;
  end_at: string;
  reason?: string | null;
  notes?: string | null;
  treatments: AppointmentTreatmentInput[];
}

export interface AppointmentUpdateInput {
  start_at?: string;
  end_at?: string;
  status?: string;
  reason?: string | null;
  notes?: string | null;
  cancellation_reason?: string | null;
}

export interface AppointmentListParams {
  patient_id?: string;
  dentist_id?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
  skip?: number;
  limit?: number;
}

export async function listAppointments(
  params?: AppointmentListParams
): Promise<AppointmentListItem[]> {
  const { data } = await api.get("/erp/appointments", { params });
  return data;
}

export async function getAppointment(id: string): Promise<Appointment> {
  const { data } = await api.get(`/erp/appointments/${id}`);
  return data;
}

export async function createAppointment(
  body: AppointmentCreateInput
): Promise<Appointment> {
  const { data } = await api.post("/erp/appointments", body);
  return data;
}

export async function updateAppointment(
  id: string,
  body: AppointmentUpdateInput
): Promise<Appointment> {
  const { data } = await api.put(`/erp/appointments/${id}`, body);
  return data;
}

export async function deleteAppointment(id: string): Promise<void> {
  await api.delete(`/erp/appointments/${id}`);
}

export async function listDentistOptions(): Promise<DentistOption[]> {
  const { data } = await api.get("/erp/appointments/options/dentists");
  return data;
}

export async function listTreatmentOptions(): Promise<TreatmentOption[]> {
  const { data } = await api.get("/erp/appointments/options/treatments");
  return data;
}

export async function listPatientOptions(search?: string): Promise<PatientOption[]> {
  const { data } = await api.get("/erp/appointments/options/patients", {
    params: search ? { search } : undefined,
  });
  return data;
}
