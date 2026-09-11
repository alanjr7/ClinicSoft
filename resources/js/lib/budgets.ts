import { api } from "./api";
import type { Budget, BudgetListItem, BudgetCreate } from "../types";

export interface BudgetUpdateInput {
  status?: string;
  tax_rate?: number;
  discount_amount?: number;
  valid_until?: string;
  notes?: string;
}

export async function listBudgets(params?: {
  patient_id?: string;
  status?: string;
  skip?: number;
  limit?: number;
}): Promise<BudgetListItem[]> {
  const { data } = await api.get("/erp/budgets", { params });
  return data;
}

export async function getBudget(id: string): Promise<Budget> {
  const { data } = await api.get(`/erp/budgets/${id}`);
  return data;
}

export async function createBudget(body: BudgetCreate): Promise<Budget> {
  const { data } = await api.post("/erp/budgets", body);
  return data;
}

export async function updateBudget(id: string, body: BudgetUpdateInput): Promise<Budget> {
  const { data } = await api.put(`/erp/budgets/${id}`, body);
  return data;
}

export async function deleteBudget(id: string): Promise<void> {
  await api.delete(`/erp/budgets/${id}`);
}
