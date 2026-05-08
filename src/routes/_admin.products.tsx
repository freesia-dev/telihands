import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { fmtIDR, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/_admin/products")({
  head: () => ({ meta: [{ title: "Savings Products — TDS Admin" }] }),
  component: ProductsPage,
});

type P = { id: string; name: string; interest_rate: number; min_balance: number; description: string | null; is_active: boolean; sort_order: number };

function ProductsPage() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["savings_products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("savings_products").select("*").order("sort_order");
      if (error) throw error;
      return data as P[];
    },
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<P> | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["savings_products"] });

  const save = async () => {
    if (!editing?.name) return toast.error("Name is required");
    const payload = {
      name: editing.name,
      interest_rate: Number(editing.interest_rate ?? 0),
      min_balance: Number(editing.min_balance ?? 0),
      description: editing.description ?? null,
      is_active: editing.is_active ?? true,
      sort_order: Number(editing.sort_order ?? 0),
    };
    const { error } = editing.id
      ? await supabase.from("savings_products").update(payload).eq("id", editing.id)
      : await supabase.from("savings_products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setOpen(false); setEditing(null); refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("savings_products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); refresh();
  };

  const toggle = async (p: P) => {
    await supabase.from("savings_products").update({ is_active: !p.is_active }).eq("id", p.id);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Savings Products</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage savings products and interest rates.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing({ is_active: true, sort_order: items.length + 1 })} className="bg-gradient-brand text-primary-foreground w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} Product</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={editing?.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Interest rate (%)</Label><Input type="number" step="0.01" value={editing?.interest_rate ?? 0} onChange={(e) => setEditing({ ...editing, interest_rate: parseFloat(e.target.value) })} /></div>
                <div><Label>Min balance (IDR)</Label><Input type="number" value={editing?.min_balance ?? 0} onChange={(e) => setEditing({ ...editing, min_balance: parseFloat(e.target.value) })} /></div>
              </div>
              <div><Label>Description</Label><Input value={editing?.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3 items-end">
                <div><Label>Sort order</Label><Input type="number" value={editing?.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) })} /></div>
                <label className="flex items-center gap-2 pb-2"><Switch checked={editing?.is_active ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} /> Active</label>
              </div>
            </div>
            <DialogFooter><Button onClick={save} className="bg-gradient-brand text-primary-foreground">Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {items.map((p) => (
          <div key={p.id} className="rounded-xl border bg-card p-4 shadow-card-soft flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold break-words">{p.name}</h3>
                {!p.is_active && <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Inactive</span>}
              </div>
              <p className="text-sm text-muted-foreground break-words">Min {fmtIDR(p.min_balance)} • {p.description ?? "—"}</p>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
              <span className="text-xl sm:text-2xl font-bold text-gradient-brand">{fmtPct(p.interest_rate)}</span>
              <div className="flex items-center gap-1 sm:gap-2">
                <Switch checked={p.is_active} onCheckedChange={() => toggle(p)} />
                <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}