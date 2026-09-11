import { api } from "./api";
import type { TreatmentCategory, TreatmentListItem, Treatment } from "../types";

export interface TreatmentCategoryCreateInput {
  name: string;
  description?: string | null;
}

export interface TreatmentCategoryUpdateInput {
  name?: string;
  description?: string | null;
}

export interface TreatmentCreateInput {
  category_id?: string | null;
  name: string;
  description?: string | null;
  base_price: number;
  duration_minutes?: number;
  is_active?: boolean;
}

export interface TreatmentUpdateInput {
  category_id?: string | null;
  name?: string;
  description?: string | null;
  base_price?: number;
  duration_minutes?: number;
  is_active?: boolean;
}

export async function listCategories(): Promise<TreatmentCategory[]> {
  const { data } = await api.get("/erp/treatment-categories");
  return data;
}

export async function createCategory(body: TreatmentCategoryCreateInput): Promise<TreatmentCategory> {
  const { data } = await api.post("/erp/treatment-categories", body);
  return data;
}

export async function updateCategory(id: string, body: TreatmentCategoryUpdateInput): Promise<TreatmentCategory> {
  const { data } = await api.put(`/erp/treatment-categories/${id}`, body);
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/erp/treatment-categories/${id}`);
}

export async function listTreatments(params?: {
  category_id?: string;
  is_active?: boolean;
  skip?: number;
  limit?: number;
}): Promise<TreatmentListItem[]> {
  const { data } = await api.get("/erp/treatments", { params });
  return data;
}

export async function getTreatment(id: string): Promise<Treatment> {
  const { data } = await api.get(`/erp/treatments/${id}`);
  return data;
}

export async function createTreatment(body: TreatmentCreateInput): Promise<Treatment> {
  const { data } = await api.post("/erp/treatments", body);
  return data;
}

export async function updateTreatment(id: string, body: TreatmentUpdateInput): Promise<Treatment> {
  const { data } = await api.put(`/erp/treatments/${id}`, body);
  return data;
}

export async function deleteTreatment(id: string): Promise<void> {
  await api.delete(`/erp/treatments/${id}`);
}
