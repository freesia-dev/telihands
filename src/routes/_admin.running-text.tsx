import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_admin/running-text")({
  head: () => ({ meta: [{ title: "Running Text — TDS Admin" }] }),
  component: RunningTextPage,
});

type T = { id: string; content: string; is_active: boolean; sort_order: number };

function RunningTextPage() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["running_text"],
    queryFn: async () => {
      const { data, error } = await supabase.from("running_text").select("*").order("sort_order");
      if (error) throw error; return data as T[];
    },
  });
  const [text, setText] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["running_text"] });

  const add = async () => {
    if (!text.trim()) return;
    const { error } = await supabase.from("running_text").insert({ content: text, sort_order: items.length + 1 });
    if (error) return toast.error(error.message);
    setText(""); refresh();
  };
  const remove = async (id: string) => { await supabase.from("running_text").delete().eq("id", id); refresh(); };
  const toggle = async (t: T) => { await supabase.from("running_text").update({ is_active: !t.is_active }).eq("id", t.id); refresh(); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Running Text</h1>
        <p className="text-muted-foreground mt-1">Ticker announcements shown on the display.</p>
      </div>
      <div className="flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type an announcement..." onKeyDown={(e) => e.key === "Enter" && add()} />
        <Button onClick={add} className="bg-gradient-brand text-primary-foreground"><Plus className="h-4 w-4 mr-2" />Add</Button>
      </div>
      <div className="space-y-2">
        {items.map((t) => (
          <div key={t.id} className="rounded-xl border bg-card p-3 px-4 flex items-center gap-3 shadow-card-soft">
            <Switch checked={t.is_active} onCheckedChange={() => toggle(t)} />
            <p className="flex-1 text-sm">{t.content}</p>
            <Button variant="ghost" size="icon" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}