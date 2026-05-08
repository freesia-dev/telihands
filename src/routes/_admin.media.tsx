import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Trash2, Upload } from "lucide-react";

export const Route = createFileRoute("/_admin/media")({
  head: () => ({ meta: [{ title: "Media — TDS Admin" }] }),
  component: MediaPage,
});

type M = { id: string; title: string; file_path: string; file_url: string; media_type: "image" | "video"; duration_seconds: number; is_active: boolean; sort_order: number };

function MediaPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(8);

  const { data: items = [] } = useQuery({
    queryKey: ["media"],
    queryFn: async () => {
      const { data, error } = await supabase.from("media").select("*").order("sort_order");
      if (error) throw error; return data as M[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["media"] });

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return toast.error("Select a file");
    if (!title) return toast.error("Enter a title");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("media").upload(path, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
      const media_type = file.type.startsWith("video") ? "video" : "image";
      const { error: insErr } = await supabase.from("media").insert({
        title, file_path: path, file_url: publicUrl, media_type, duration_seconds: duration, sort_order: items.length + 1,
      });
      if (insErr) throw insErr;
      toast.success("Uploaded");
      setTitle(""); if (fileRef.current) fileRef.current.value = "";
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setUploading(false); }
  };

  const remove = async (m: M) => {
    if (!confirm("Delete this media?")) return;
    await supabase.storage.from("media").remove([m.file_path]);
    await supabase.from("media").delete().eq("id", m.id);
    refresh();
  };
  const toggle = async (m: M) => { await supabase.from("media").update({ is_active: !m.is_active }).eq("id", m.id); refresh(); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Media Library</h1>
        <p className="text-muted-foreground mt-1">Upload images and videos for the display slider.</p>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-card-soft space-y-4">
        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Promo Tabungan Prama" /></div>
          <div><Label>Image duration (sec)</Label><Input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} /></div>
        </div>
        <div className="flex gap-3 items-center">
          <Input ref={fileRef} type="file" accept="image/*,video/*" />
          <Button onClick={upload} disabled={uploading} className="bg-gradient-brand text-primary-foreground">
            <Upload className="h-4 w-4 mr-2" />{uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => (
          <div key={m.id} className="rounded-xl border bg-card overflow-hidden shadow-card-soft">
            <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
              {m.media_type === "image" ? (
                <img src={m.file_url} alt={m.title} className="w-full h-full object-cover" />
              ) : (
                <video src={m.file_url} className="w-full h-full object-cover" muted />
              )}
            </div>
            <div className="p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate">{m.title}</p>
                <p className="text-xs text-muted-foreground capitalize">{m.media_type} • {m.duration_seconds}s</p>
              </div>
              <div className="flex items-center gap-1">
                <Switch checked={m.is_active} onCheckedChange={() => toggle(m)} />
                <Button variant="ghost" size="icon" onClick={() => remove(m)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}