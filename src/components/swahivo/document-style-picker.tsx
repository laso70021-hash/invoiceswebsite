import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { profileQuery } from "@/lib/data";
import { documentStyles, resolveStyle } from "@/lib/document-design";
import { supabase } from "@/integrations/supabase/client";

export function DocumentStylePicker() {
  const { data: profile } = useQuery(profileQuery);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  async function change(style: string) {
    setBusy(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Sign in to save your document style.");
      const { error } = await supabase
        .from("profiles")
        .update({ template_style: style })
        .eq("id", user.id)
        .select("id")
        .single();
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Business document style saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save style.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <label className="flex flex-wrap items-center gap-3 text-sm font-medium">
      Document style
      <select
        disabled={busy || !profile}
        value={resolveStyle(profile?.template_style)}
        onChange={(e) => change(e.target.value)}
        className="rounded-lg border bg-card px-3 py-2"
      >
        {Object.entries(documentStyles).map(([id, s]) => (
          <option key={id} value={id}>
            {s.label}
          </option>
        ))}
      </select>
      <span className="text-xs font-normal text-muted-foreground">
        Applies to your business previews and downloads.
      </span>
    </label>
  );
}
