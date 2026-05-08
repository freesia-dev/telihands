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
import { Pencil, Plus, Trash2, Sparkles } from "lucide-react";
import { fmtIDR, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/_admin/deposito")({
  head: () => ({ meta: [{ title: "Deposito Rates — TDS Admin" }] }),
  component: DepositoPage,
});

type D = { id: string; tenor_months: number; interest_rate: number; min_amount: number; is_promo: boolean; is_active: boolean; sort_order: number };

function DepositoPage() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["deposito_rates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("deposito_rates").select("*").order("sort_order");
      if (error) throw error; return data as D[];
    },
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<D> | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["deposito_rates"] });

  const save = async () => {
    const payload = {
      tenor_months: Number(editing?.tenor_months ?? 1),
      interest_rate: Number(editing?.interest_rate ?? 0),
      min_amount: Number(editing?.min_amount ?? 0),
      is_promo: editing?.is_promo ?? false,
      is_active: editing?.is_active ?? true,
      sort_order: Number(editing?.sort_order ?? 0),
    };
    const { error } = editing?.id
      ? await supabase.from("deposito_rates").update(payload).eq("id", editing.id)
      : await supabase.from("deposito_rates").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved"); setOpen(false); setEditing(null); refresh();
  };
  const remove = async (id: string) => { if (!confirm("Delete?")) return; await supabase.from("deposito_rates").delete().eq("id", id); refresh(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Deposito Rates</h1>
          <p className="text-muted-foreground mt-1">Manage tenor and interest rates.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing({ is_active: true, sort_order: items.length + 1, tenor_months: 1, min_amount: 8000000 })} className="bg-gradient-brand text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />Add Rate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} Deposito Rate</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Tenor (months)</Label><Input type="number" value={editing?.tenor_months ?? 1} onChange={(e) => setEditing({ ...editing, tenor_months: parseInt(e.target.value) })} /></div>
                <div><Label>Interest rate (%)</Label><Input type="number" step="0.01" value={editing?.interest_rate ?? 0} onChange={(e) => setEditing({ ...editing, interest_rate: parseFloat(e.target.value) })} /></div>
              </div>
              <div><Label>Minimum amount (IDR)</Label><Input type="number" value={editing?.min_amount ?? 0} onChange={(e) => setEditing({ ...editing, min_amount: parseFloat(e.target.value) })} /></div>
              <div className="grid grid-cols-3 gap-3 items-end">
                <div><Label>Sort order</Label><Input type="number" value={editing?.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) })} /></div>
                <label className="flex items-center gap-2 pb-2"><Switch checked={editing?.is_promo ?? false} onCheckedChange={(v) => setEditing({ ...editing, is_promo: v })} /> Promo</label>
                <label className="flex items-center gap-2 pb-2"><Switch checked={editing?.is_active ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} /> Active</label>
              </div>
            </div>
            <DialogFooter><Button onClick={save} className="bg-gradient-brand text-primary-foreground">Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((d) => (
          <div key={d.id} className="rounded-xl border bg-card p-5 shadow-card-soft">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{d.tenor_months} bulan</h3>
                  {d.is_promo && <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gradient-accent text-white"><Sparkles className="h-3 w-3" />Promo</span>}
                  {!d.is_active && <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Inactive</span>}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Min. {fmtIDR(d.min_amount)}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => { setEditing(d); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
            <p className="text-4xl font-extrabold text-gradient-brand mt-3">{fmtPct(d.interest_rate)}<span className="text-sm font-medium text-muted-foreground"> p.a.</span></p>
          </div>
        ))}
      </div>
    </div>
  );
}