import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useGetPatientProfileQuery,
  useUpdatePatientProfileMutation,
} from "../../app/api/patientApiSlice";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const SMOKING_OPTIONS = ["never", "former", "current"];
const ALCOHOL_OPTIONS = ["never", "occasional", "regular"];
const ACTIVITY_OPTIONS = ["low", "moderate", "high"];

const emptyLifestyle = () => ({
  smoking: { status: "", frequency: "" },
  alcohol: { status: "", frequency: "" },
  physical_activity: { level: "", details: "" },
  diet: "",
  sleep_hours_avg: "",
});

const emptySurgery = () => ({
  procedure: "",
  date: "",
  hospital: "",
  outcome: "",
  notes: "",
});

const emptyMedication = () => ({
  name: "",
  dosage: "",
  frequency: "",
  route: "",
  start_date: "",
  ongoing: false,
  prescribed_for: "",
});

function toDateStr(d) {
  if (d == null || d === "") return "";
  if (typeof d === "string") return d.slice(0, 10);
  if (typeof d === "object" && typeof d.toISOString === "function") return d.toISOString().slice(0, 10);
  return "";
}

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useGetPatientProfileQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [update, { isLoading: saving, error: updateError }] = useUpdatePatientProfileMutation();

  const [form, setForm] = useState({
    date_of_birth: "",
    blood_group: "",
    emergency_contact: "",
    address: "",
    known_allergies: "",
    chronic_conditions: "",
    past_surgeries: [],
    current_medications: [],
    lifestyle: emptyLifestyle(),
  });
  const [formReady, setFormReady] = useState(false);
  const [backendErrors, setBackendErrors] = useState({});

  useEffect(() => {
    if (!profile) {
      setFormReady(false);
      return;
    }
    if (formReady) return;
    const li = profile.lifestyle_indicators || {};
    setForm({
      date_of_birth: toDateStr(profile.date_of_birth),
      blood_group: profile.blood_group || "",
      emergency_contact: profile.emergency_contact || "",
      address: profile.address || "",
      known_allergies: profile.known_allergies || "",
      chronic_conditions: profile.chronic_conditions || "",
      past_surgeries: Array.isArray(profile.past_surgeries)
        ? profile.past_surgeries.filter((s) => s && typeof s === "object").map((s) => ({
            procedure: s.procedure || "",
            date: toDateStr(s.date),
            hospital: s.hospital || "",
            outcome: s.outcome || "",
            notes: s.notes || "",
          }))
        : [],
      current_medications: Array.isArray(profile.current_medications)
        ? profile.current_medications.filter((m) => m && typeof m === "object").map((m) => ({
            name: m.name || "",
            dosage: m.dosage || "",
            frequency: m.frequency || "",
            route: m.route || "",
            start_date: toDateStr(m.start_date),
            ongoing: !!m.ongoing,
            prescribed_for: m.prescribed_for || "",
          }))
        : [],
      lifestyle: {
        smoking: {
          status: (li.smoking && li.smoking.status) || "",
          frequency: (li.smoking && li.smoking.frequency) || "",
        },
        alcohol: {
          status: (li.alcohol && li.alcohol.status) || "",
          frequency: (li.alcohol && li.alcohol.frequency) || "",
        },
        physical_activity: {
          level: (li.physical_activity && li.physical_activity.level) || "",
          details: (li.physical_activity && li.physical_activity.details) || "",
        },
        diet: (li && li.diet) || "",
        sleep_hours_avg: li && li.sleep_hours_avg != null ? String(li.sleep_hours_avg) : "",
      },
    });
    setFormReady(true);
  }, [profile, formReady]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setLifestyle = (key, sub, val) =>
    setForm((f) => ({
      ...f,
      lifestyle: {
        ...f.lifestyle,
        [key]: sub ? { ...f.lifestyle[key], [sub]: val } : val,
      },
    }));

  const addSurgery = () => setForm((f) => ({ ...f, past_surgeries: [...f.past_surgeries, emptySurgery()] }));
  const removeSurgery = (i) =>
    setForm((f) => ({ ...f, past_surgeries: f.past_surgeries.filter((_, j) => j !== i) }));
  const setSurgery = (i, field, v) =>
    setForm((f) => ({
      ...f,
      past_surgeries: f.past_surgeries.map((s, j) => (j === i ? { ...s, [field]: v } : s)),
    }));

  const addMedication = () =>
    setForm((f) => ({ ...f, current_medications: [...f.current_medications, emptyMedication()] }));
  const removeMedication = (i) =>
    setForm((f) => ({ ...f, current_medications: f.current_medications.filter((_, j) => j !== i) }));
  const setMedication = (i, field, v) =>
    setForm((f) => ({
      ...f,
      current_medications: f.current_medications.map((m, j) =>
        j === i ? { ...m, [field]: v } : m
      ),
    }));

  const getErr = (field) => {
    const e = updateError?.data;
    if (!e) return backendErrors[field];
    if (Array.isArray(e)) return e[0];
    if (e[field]) return Array.isArray(e[field]) ? e[field][0] : e[field];
    return backendErrors[field];
  };

  const buildPayload = () => {
    const li = form.lifestyle;
    const sleep = li.sleep_hours_avg !== "" ? parseFloat(li.sleep_hours_avg) : null;
    return {
      date_of_birth: form.date_of_birth || null,
      blood_group: form.blood_group || null,
      emergency_contact: form.emergency_contact || null,
      address: form.address || null,
      known_allergies: form.known_allergies || null,
      chronic_conditions: form.chronic_conditions || null,
      past_surgeries: form.past_surgeries
        .filter((s) => (s.procedure || "").trim())
        .map((s) => ({
          procedure: (s.procedure || "").trim(),
          date: s.date || null,
          hospital: (s.hospital || "").trim() || undefined,
          outcome: (s.outcome || "").trim() || undefined,
          notes: (s.notes || "").trim() || undefined,
        }))
        .filter((s) => s.date),
      current_medications: form.current_medications
        .filter((m) => (m.name || "").trim())
        .map((m) => ({
          name: (m.name || "").trim(),
          ongoing: !!m.ongoing,
          dosage: (m.dosage || "").trim() || undefined,
          frequency: (m.frequency || "").trim() || undefined,
          route: (m.route || "").trim() || undefined,
          start_date: (m.start_date || "").trim() || undefined,
          prescribed_for: (m.prescribed_for || "").trim() || undefined,
        })),
      lifestyle_indicators: {
        smoking: { status: li.smoking.status || null, frequency: li.smoking.frequency || null },
        alcohol: { status: li.alcohol.status || null, frequency: li.alcohol.frequency || null },
        physical_activity: {
          level: li.physical_activity.level || null,
          details: li.physical_activity.details || "",
        },
        diet: li.diet || "",
        sleep_hours_avg: sleep != null && !Number.isNaN(sleep) ? sleep : null,
      },
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBackendErrors({});
    const payload = buildPayload();
    try {
      await update(payload).unwrap();
      setBackendErrors({});
      navigate("/patient/profile");
    } catch (err) {
      setBackendErrors(err?.data || {});
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Could not load profile. Please try again.</AlertDescription>
      </Alert>
    );
  }

  if (!formReady) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/patient/profile" aria-label="Back to profile">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Profile</h1>
            <p className="text-muted-foreground">Update your health and contact information</p>
          </div>
        </div>
      </div>

      {updateError && !getErr("detail") && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            {Array.isArray(updateError?.data) ? updateError.data[0] : updateError?.data?.detail || "Failed to save."}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
            <CardDescription>Date of birth, blood group, contact, and address.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={form.date_of_birth}
                onChange={(e) => set("date_of_birth", e.target.value)}
                aria-invalid={!!getErr("date_of_birth")}
              />
              {getErr("date_of_birth") && (
                <p className="text-sm text-destructive">{getErr("date_of_birth")}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="blood_group">Blood group</Label>
              <Select value={form.blood_group} onValueChange={(v) => set("blood_group", v)}>
                <SelectTrigger id="blood_group" className="w-full" aria-invalid={!!getErr("blood_group")}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_GROUPS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getErr("blood_group") && (
                <p className="text-sm text-destructive">{getErr("blood_group")}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="emergency_contact">Emergency contact (10–15 digits)</Label>
              <Input
                id="emergency_contact"
                type="tel"
                value={form.emergency_contact}
                onChange={(e) => set("emergency_contact", e.target.value.replace(/\D/g, "").slice(0, 15))}
                placeholder="e.g. 9876543210"
                aria-invalid={!!getErr("emergency_contact")}
              />
              {getErr("emergency_contact") && (
                <p className="text-sm text-destructive">{getErr("emergency_contact")}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                rows={2}
                aria-invalid={!!getErr("address")}
              />
              {getErr("address") && <p className="text-sm text-destructive">{getErr("address")}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Health History</CardTitle>
            <CardDescription>Allergies, conditions, surgeries, medications, and lifestyle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="known_allergies">Known allergies</Label>
              <Textarea
                id="known_allergies"
                value={form.known_allergies}
                onChange={(e) => set("known_allergies", e.target.value)}
                rows={2}
                aria-invalid={!!getErr("known_allergies")}
              />
              {getErr("known_allergies") && (
                <p className="text-sm text-destructive">{getErr("known_allergies")}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="chronic_conditions">Chronic conditions</Label>
              <Textarea
                id="chronic_conditions"
                value={form.chronic_conditions}
                onChange={(e) => set("chronic_conditions", e.target.value)}
                rows={2}
                aria-invalid={!!getErr("chronic_conditions")}
              />
              {getErr("chronic_conditions") && (
                <p className="text-sm text-destructive">{getErr("chronic_conditions")}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Past surgeries</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSurgery}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Procedure and date are required. Date must be in the past.</p>
              {getErr("past_surgeries") && (
                <p className="text-sm text-destructive mb-2">{getErr("past_surgeries")}</p>
              )}
              <div className="space-y-3">
                {form.past_surgeries.map((s, i) => (
                  <div key={i} className="flex flex-wrap items-end gap-2 p-3 border rounded-md">
                    <Input
                      placeholder="Procedure *"
                      value={s.procedure}
                      onChange={(e) => setSurgery(i, "procedure", e.target.value)}
                      className="flex-1 min-w-[140px]"
                    />
                    <Input
                      type="date"
                      placeholder="Date *"
                      value={s.date}
                      onChange={(e) => setSurgery(i, "date", e.target.value)}
                      className="w-[140px]"
                    />
                    <Input
                      placeholder="Hospital"
                      value={s.hospital}
                      onChange={(e) => setSurgery(i, "hospital", e.target.value)}
                      className="flex-1 min-w-[100px]"
                    />
                    <Input
                      placeholder="Outcome"
                      value={s.outcome}
                      onChange={(e) => setSurgery(i, "outcome", e.target.value)}
                      className="min-w-[100px]"
                    />
                    <Input
                      placeholder="Notes"
                      value={s.notes}
                      onChange={(e) => setSurgery(i, "notes", e.target.value)}
                      className="flex-1 min-w-[100px]"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSurgery(i)} aria-label="Remove">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Current medications</Label>
                <Button type="button" variant="outline" size="sm" onClick={addMedication}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Name and Ongoing are required.</p>
              {getErr("current_medications") && (
                <p className="text-sm text-destructive mb-2">{getErr("current_medications")}</p>
              )}
              <div className="space-y-3">
                {form.current_medications.map((m, i) => (
                  <div key={i} className="flex flex-wrap items-end gap-2 p-3 border rounded-md">
                    <Input
                      placeholder="Name *"
                      value={m.name}
                      onChange={(e) => setMedication(i, "name", e.target.value)}
                      className="flex-1 min-w-[140px]"
                    />
                    <label className="flex items-center gap-2 shrink-0">
                      <input
                        type="checkbox"
                        checked={m.ongoing}
                        onChange={(e) => setMedication(i, "ongoing", e.target.checked)}
                      />
                      <span className="text-sm">Ongoing</span>
                    </label>
                    <Input
                      placeholder="Dosage"
                      value={m.dosage}
                      onChange={(e) => setMedication(i, "dosage", e.target.value)}
                      className="min-w-[90px]"
                    />
                    <Input
                      placeholder="Frequency"
                      value={m.frequency}
                      onChange={(e) => setMedication(i, "frequency", e.target.value)}
                      className="min-w-[90px]"
                    />
                    <Input
                      placeholder="Route"
                      value={m.route}
                      onChange={(e) => setMedication(i, "route", e.target.value)}
                      className="min-w-[80px]"
                    />
                    <Input
                      type="date"
                      placeholder="Start date"
                      value={m.start_date}
                      onChange={(e) => setMedication(i, "start_date", e.target.value)}
                      className="w-[140px]"
                    />
                    <Input
                      placeholder="Prescribed for"
                      value={m.prescribed_for}
                      onChange={(e) => setMedication(i, "prescribed_for", e.target.value)}
                      className="min-w-[120px]"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeMedication(i)} aria-label="Remove">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Lifestyle indicators</Label>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <span className="text-sm font-medium">Smoking</span>
                  <div className="flex gap-2">
                    <Select
                      value={form.lifestyle.smoking.status}
                      onValueChange={(v) => setLifestyle("smoking", "status", v)}
                    >
                      <SelectTrigger className="flex-1" aria-invalid={!!getErr("lifestyle_indicators")}>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {SMOKING_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Frequency"
                      value={form.lifestyle.smoking.frequency}
                      onChange={(e) => setLifestyle("smoking", "frequency", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Alcohol</span>
                  <div className="flex gap-2">
                    <Select
                      value={form.lifestyle.alcohol.status}
                      onValueChange={(v) => setLifestyle("alcohol", "status", v)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {ALCOHOL_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Frequency"
                      value={form.lifestyle.alcohol.frequency}
                      onChange={(e) => setLifestyle("alcohol", "frequency", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium">Physical activity</span>
                  <div className="flex gap-2 flex-wrap">
                    <Select
                      value={form.lifestyle.physical_activity.level}
                      onValueChange={(v) => setLifestyle("physical_activity", "level", v)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Level" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTIVITY_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Details"
                      value={form.lifestyle.physical_activity.details}
                      onChange={(e) => setLifestyle("physical_activity", "details", e.target.value)}
                      className="flex-1 min-w-[200px]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diet">Diet</Label>
                  <Input
                    id="diet"
                    value={form.lifestyle.diet}
                    onChange={(e) => setLifestyle("diet", null, e.target.value)}
                    placeholder="e.g. Vegetarian, normal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sleep_hours_avg">Sleep (hours, 0–24)</Label>
                  <Input
                    id="sleep_hours_avg"
                    type="number"
                    min={0}
                    max={24}
                    step={0.5}
                    value={form.lifestyle.sleep_hours_avg}
                    onChange={(e) => setLifestyle("sleep_hours_avg", null, e.target.value)}
                    placeholder="e.g. 7"
                    aria-invalid={!!getErr("lifestyle_indicators")}
                  />
                </div>
              </div>
              {getErr("lifestyle_indicators") && (
                <p className="text-sm text-destructive mt-2">{getErr("lifestyle_indicators")}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/patient/profile">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
