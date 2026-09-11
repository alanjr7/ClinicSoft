import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Tag, Stethoscope, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  listTreatments, createTreatment, updateTreatment, deleteTreatment,
  listCategories, createCategory, updateCategory, deleteCategory,
  type TreatmentCreateInput, type TreatmentUpdateInput,
} from "../../lib/treatments";
import type { TreatmentCategory, TreatmentListItem } from "../../types";

// ── Tratamientos ──────────────────────────────────────────────────────────────

function TreatmentsTab({ categories }: { categories: TreatmentCategory[] }) {
  const [items, setItems] = useState<TreatmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TreatmentListItem | null>(null);

  const [form, setForm] = useState<TreatmentCreateInput>({
    name: "",
    description: "",
    base_price: 0,
    duration_minutes: 60,
    category_id: null,
    is_active: true,
  });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listTreatments({ limit: 200 });
      setItems(data);
    } catch {
      toast.error("Error al cargar procedimientos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", base_price: 0, duration_minutes: 60, category_id: null, is_active: true });
    setOpen(true);
  };

  const openEdit = (item: TreatmentListItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: "",
      base_price: item.base_price,
      duration_minutes: item.duration_minutes,
      category_id: item.category_id ?? null,
      is_active: item.is_active,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    if (form.base_price <= 0) { toast.error("El precio debe ser mayor a 0"); return; }
    try {
      if (editing) {
        const body: TreatmentUpdateInput = {
          name: form.name,
          description: form.description || null,
          base_price: form.base_price,
          duration_minutes: form.duration_minutes,
          category_id: form.category_id || null,
          is_active: form.is_active,
        };
        await updateTreatment(editing.id, body);
        toast.success("Procedimiento actualizado");
      } else {
        await createTreatment({ ...form, description: form.description || null, category_id: form.category_id || null });
        toast.success("Procedimiento creado");
      }
      setOpen(false);
      fetchItems();
    } catch {
      toast.error("Error al guardar el procedimiento");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este procedimiento?")) return;
    try {
      await deleteTreatment(id);
      toast.success("Procedimiento eliminado");
      fetchItems();
    } catch {
      toast.error("Error al eliminar el procedimiento");
    }
  };

  const toggleActive = async (item: TreatmentListItem) => {
    try {
      await updateTreatment(item.id, { is_active: !item.is_active });
      toast.success(item.is_active ? "Procedimiento desactivado" : "Procedimiento activado");
      fetchItems();
    } catch {
      toast.error("Error al cambiar el estado");
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          onClick={openCreate}
          className="h-10 bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl px-5"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Procedimiento
        </Button>
      </div>

      <Card className="rounded-2xl border-[#F3F4F6] shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-14 text-[#6B7280]">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-14">
              <Stethoscope className="w-14 h-14 text-[#D1D5DB] mx-auto mb-3" />
              <p className="text-[#6B7280]">No hay procedimientos registrados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F8FAFC] border-b border-[#F3F4F6] hover:bg-[#F8FAFC]">
                  <TableHead className="text-[#111827] pl-6">Nombre</TableHead>
                  <TableHead className="text-[#111827]">Categoría</TableHead>
                  <TableHead className="text-[#111827] text-right">Precio base</TableHead>
                  <TableHead className="text-[#111827] text-center">Duración</TableHead>
                  <TableHead className="text-[#111827] text-center">Estado</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="border-b border-[#F3F4F6]">
                    <TableCell className="pl-6 text-[#111827] font-medium">{item.name}</TableCell>
                    <TableCell>
                      {item.category ? (
                        <span className="text-xs bg-[#F0F9FF] text-[#075985] px-2.5 py-1 rounded">
                          {item.category.name}
                        </span>
                      ) : (
                        <span className="text-[#9CA3AF] text-sm">Sin categoría</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-[#111827] font-semibold">
                      Bs. {item.base_price.toLocaleString("es-BO", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center text-[#6B7280] text-sm">
                      {item.duration_minutes} min
                    </TableCell>
                    <TableCell className="text-center">
                      <button onClick={() => toggleActive(item)}>
                        {item.is_active ? (
                          <CheckCircle className="w-5 h-5 text-[#10B981] mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-[#D1D5DB] mx-auto" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(item)}
                          className="text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-lg"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog crear/editar tratamiento */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#111827]">
              {editing ? "Editar Procedimiento" : "Nuevo Procedimiento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                placeholder="Ej. Limpieza dental"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="h-12 rounded-xl border-[#D1D5DB] focus:border-[#0284C7] focus:ring-[#0284C7]"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                placeholder="Descripción opcional"
                value={form.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="h-12 rounded-xl border-[#D1D5DB] focus:border-[#0284C7] focus:ring-[#0284C7]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio base *</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.base_price}
                  onChange={(e) => setForm((f) => ({ ...f, base_price: parseFloat(e.target.value) || 0 }))}
                  className="h-12 rounded-xl border-[#D1D5DB] focus:border-[#0284C7] focus:ring-[#0284C7]"
                />
              </div>
              <div className="space-y-2">
                <Label>Duración (min)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.duration_minutes}
                  onChange={(e) => setForm((f) => ({ ...f, duration_minutes: parseInt(e.target.value) || 60 }))}
                  className="h-12 rounded-xl border-[#D1D5DB] focus:border-[#0284C7] focus:ring-[#0284C7]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select
                value={form.category_id ?? "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, category_id: v === "none" ? null : v }))}
              >
                <SelectTrigger className="h-12 rounded-xl border-[#D1D5DB] focus:border-[#0284C7] focus:ring-[#0284C7]">
                  <SelectValue placeholder="Sin categoría" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none">Sin categoría</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl">
              {editing ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Categorías ────────────────────────────────────────────────────────────────

function CategoriesTab() {
  const [items, setItems] = useState<TreatmentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TreatmentCategory | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCategories();
      setItems(data);
    } catch {
      toast.error("Error al cargar categorías");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setOpen(true);
  };

  const openEdit = (item: TreatmentCategory) => {
    setEditing(item);
    setName(item.name);
    setDescription(item.description ?? "");
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("El nombre es obligatorio"); return; }
    try {
      if (editing) {
        await updateCategory(editing.id, { name, description: description || null });
        toast.success("Categoría actualizada");
      } else {
        await createCategory({ name, description: description || null });
        toast.success("Categoría creada");
      }
      setOpen(false);
      fetchItems();
    } catch {
      toast.error("Error al guardar la categoría");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría? Los procedimientos asociados quedarán sin categoría.")) return;
    try {
      await deleteCategory(id);
      toast.success("Categoría eliminada");
      fetchItems();
    } catch {
      toast.error("Error al eliminar la categoría");
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          onClick={openCreate}
          className="h-10 bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl px-5"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      <Card className="rounded-2xl border-[#F3F4F6] shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-14 text-[#6B7280]">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-14">
              <Tag className="w-14 h-14 text-[#D1D5DB] mx-auto mb-3" />
              <p className="text-[#6B7280]">No hay categorías registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F8FAFC] border-b border-[#F3F4F6] hover:bg-[#F8FAFC]">
                  <TableHead className="text-[#111827] pl-6">Nombre</TableHead>
                  <TableHead className="text-[#111827]">Descripción</TableHead>
                  <TableHead className="text-[#111827]">Creada</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="border-b border-[#F3F4F6]">
                    <TableCell className="pl-6 text-[#111827] font-medium">{item.name}</TableCell>
                    <TableCell className="text-[#6B7280] text-sm">
                      {item.description ?? <span className="text-[#D1D5DB]">—</span>}
                    </TableCell>
                    <TableCell className="text-[#6B7280] text-sm">
                      {new Date(item.created_at).toLocaleDateString("es-MX")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(item)}
                          className="text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-lg"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#111827]">
              {editing ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                placeholder="Ej. Cirugía oral"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-xl border-[#D1D5DB] focus:border-[#0284C7] focus:ring-[#0284C7]"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                placeholder="Descripción opcional"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-12 rounded-xl border-[#D1D5DB] focus:border-[#0284C7] focus:ring-[#0284C7]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl">
              {editing ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function Procedures() {
  const [categories, setCategories] = useState<TreatmentCategory[]>([]);

  useEffect(() => {
    listCategories().then(setCategories).catch(() => {});
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl text-[#111827] mb-1">Gestionar Procedimientos</h1>
        <p className="text-[#6B7280]">Catálogo de tratamientos y categorías de la clínica</p>
      </div>

      <Tabs defaultValue="treatments">
        <TabsList className="mb-6 bg-[#F3F4F6] rounded-xl p-1">
          <TabsTrigger
            value="treatments"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0284C7] data-[state=active]:shadow-sm"
          >
            <Stethoscope className="w-4 h-4 mr-2" />
            Procedimientos
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0284C7] data-[state=active]:shadow-sm"
          >
            <Tag className="w-4 h-4 mr-2" />
            Categorías
          </TabsTrigger>
        </TabsList>

        <TabsContent value="treatments">
          <TreatmentsTab categories={categories} />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
