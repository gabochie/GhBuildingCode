"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Select, Label, Badge } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { Loader2 } from "lucide-react";

const PROJECT_TYPES = [
  { value: "new_construction", label: "New construction" },
  { value: "renovation", label: "Renovation" },
  { value: "extension", label: "Extension" },
  { value: "change_of_use", label: "Change of use" },
  { value: "existing_building", label: "Existing building" },
  { value: "demolition", label: "Demolition" }
];

const OCCUPANCIES = [
  { value: "residential", label: "Residential (R)" },
  { value: "assembly", label: "Assembly (A)" },
  { value: "business", label: "Business (B)" },
  { value: "educational", label: "Educational (E)" },
  { value: "institutional", label: "Institutional (I)" },
  { value: "mercantile", label: "Mercantile (M)" },
  { value: "industrial", label: "Factory / Industrial (F)" },
  { value: "storage", label: "Storage (S)" },
  { value: "high_hazard", label: "High Hazard (H)" },
  { value: "utility", label: "Utility (U)" }
];

const SPECIAL_CONDITIONS = [
  { value: "flood_risk", label: "Flood risk" },
  { value: "coastal", label: "Coastal environment" },
  { value: "steep_site", label: "Steep site" },
  { value: "hazardous_use", label: "Hazardous use" },
  { value: "public_assembly", label: "Public assembly" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "industrial", label: "Industrial" },
  { value: "high_rise", label: "High-rise" },
  { value: "mixed_use", label: "Mixed use" }
];

const ASSEMBLIES = [
  "Accra Metropolitan Assembly",
  "Kumasi Metropolitan Assembly",
  "Tema Metropolitan Assembly",
  "Tamale Metropolitan Assembly",
  "Sekondi-Takoradi Metropolitan Assembly",
  "Cape Coast Metropolitan Assembly",
  "Ho Municipal Assembly",
  "Wa Municipal Assembly",
  "Other (specify)"
];

export default function NewProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    location_region: "Greater Accra",
    location_assembly: "Accra Metropolitan Assembly",
    project_type: "new_construction",
    occupancy: "residential",
    floors: "3",
    building_height: "",
    floor_area: "",
    site_area: "",
    occupants: "",
    structural_system: "Reinforced concrete frame",
    basement: "false",
    roof_type: "Pitched",
    authority_id: "",
    auto_review: true
  });
  const [special, setSpecial] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleSpecial(v: string) {
    setSpecial((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          floors: form.floors ? Number(form.floors) : null,
          building_height: form.building_height ? Number(form.building_height) : null,
          floor_area: form.floor_area ? Number(form.floor_area) : null,
          site_area: form.site_area ? Number(form.site_area) : null,
          occupants: form.occupants ? Number(form.occupants) : null,
          basement: form.basement === "true",
          special_conditions: special
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Could not create project.");
      router.push(`/projects/${json.data.project.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Check My Project"
        description="Describe the building. GHBC constructs the project compliance profile and applicable requirements."
      />

      <form onSubmit={onSubmit}>
        <Card className="mb-5">
          <CardHeader>
            <CardTitle>1 · Project identity</CardTitle>
            <CardDescription>Step 1–2: name and location.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Project name</Label>
              <Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. 3-Storey Residential Block, East Legon" />
            </div>
            <div className="space-y-1.5">
              <Label>Region</Label>
              <Input value={form.location_region} onChange={(e) => set("location_region", e.target.value)} placeholder="Greater Accra" />
            </div>
            <div className="space-y-1.5">
              <Label>Assembly / Municipality</Label>
              <Select value={form.location_assembly} onChange={(e) => set("location_assembly", e.target.value)}>
                {ASSEMBLIES.map((a) => <option key={a} value={a}>{a}</option>)}
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-5">
          <CardHeader>
            <CardTitle>2 · Project type & occupancy</CardTitle>
            <CardDescription>Steps 3–4: nature of work and primary use.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Project type</Label>
              <Select value={form.project_type} onChange={(e) => set("project_type", e.target.value)}>
                {PROJECT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Occupancy / use</Label>
              <Select value={form.occupancy} onChange={(e) => set("occupancy", e.target.value)}>
                {OCCUPANCIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-5">
          <CardHeader>
            <CardTitle>3 · Building characteristics</CardTitle>
            <CardDescription>Step 5: floors, height, areas, structure.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Storeys</Label>
              <Input type="number" min={0} max={200} value={form.floors} onChange={(e) => set("floors", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Building height (m)</Label>
              <Input type="number" min={0} step="0.1" value={form.building_height} onChange={(e) => set("building_height", e.target.value)} placeholder="e.g. 12" />
            </div>
            <div className="space-y-1.5">
              <Label>Floor area (m²)</Label>
              <Input type="number" min={0} step="0.1" value={form.floor_area} onChange={(e) => set("floor_area", e.target.value)} placeholder="e.g. 1200" />
            </div>
            <div className="space-y-1.5">
              <Label>Site area (m²)</Label>
              <Input type="number" min={0} step="0.1" value={form.site_area} onChange={(e) => set("site_area", e.target.value)} placeholder="e.g. 800" />
            </div>
            <div className="space-y-1.5">
              <Label>Occupants</Label>
              <Input type="number" min={0} value={form.occupants} onChange={(e) => set("occupants", e.target.value)} placeholder="e.g. 60" />
            </div>
            <div className="space-y-1.5">
              <Label>Structural system</Label>
              <Select value={form.structural_system} onChange={(e) => set("structural_system", e.target.value)}>
                <option>Reinforced concrete frame</option>
                <option>Masonry (blockwork)</option>
                <option>Steel frame</option>
                <option>Timber / bamboo</option>
                <option>Mixed</option>
                <option>Not yet decided</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Basement</Label>
              <Select value={form.basement} onChange={(e) => set("basement", e.target.value)}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Roof type</Label>
              <Select value={form.roof_type} onChange={(e) => set("roof_type", e.target.value)}>
                <option>Pitched</option>
                <option>Flat</option>
                <option>Hip</option>
                <option>Gable</option>
                <option>Other</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-5">
          <CardHeader>
            <CardTitle>4 · Special conditions</CardTitle>
            <CardDescription>Step 7: risks and special requirements.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SPECIAL_CONDITIONS.map((s) => {
                const active = special.includes(s.value);
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => toggleSpecial(s.value)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.auto_review} onChange={(e) => set("auto_review", String(e.target.checked))} />
              Run compliance review immediately after creating the project
            </label>
          </CardContent>
        </Card>

        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Building compliance profile…</> : "Check My Project"}
        </Button>
      </form>
    </div>
  );
}
