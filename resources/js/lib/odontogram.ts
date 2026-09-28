import { api } from "./api";
import type {
  OdontogramSnapshot,
  OdontogramSnapshotListItem,
  ToothFace,
  ToothState,
} from "../types";

export interface ToothConditionInput {
  tooth_number: number;
  state: ToothState;
  face?: ToothFace | null;
  notes?: string | null;
}

export interface OdontogramSnapshotCreateInput {
  patient_id: string;
  clinical_record_id?: string | null;
  notes?: string | null;
  tooth_conditions: ToothConditionInput[];
}

export async function getLatestSnapshot(
  patientId: string
): Promise<OdontogramSnapshot | null> {
  const { data } = await api.get(`/erp/odontogram/patient/${patientId}/latest`);
  return data;
}

export async function listPatientSnapshots(
  patientId: string,
  limit = 20
): Promise<OdontogramSnapshotListItem[]> {
  const { data } = await api.get(`/erp/odontogram/patient/${patientId}`, {
    params: { limit },
  });
  return data;
}

export async function getSnapshot(snapshotId: string): Promise<OdontogramSnapshot> {
  const { data } = await api.get(`/erp/odontogram/snapshot/${snapshotId}`);
  return data;
}

export async function createSnapshot(
  body: OdontogramSnapshotCreateInput
): Promise<OdontogramSnapshot> {
  const { data } = await api.post("/erp/odontogram", body);
  return data;
}

export async function deleteSnapshot(snapshotId: string): Promise<void> {
  await api.delete(`/erp/odontogram/snapshot/${snapshotId}`);
}
