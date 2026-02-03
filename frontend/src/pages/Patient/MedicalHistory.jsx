import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  useGetPatientMedicalHistoryQuery,
  useUpdatePatientMedicalHistoryMutation,
} from "../../app/api/patientApiSlice";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Loader2, Plus, Trash2 } from "lucide-react";

const emptyCondition = () => ({
  id: "",
  name: "",
  status: "ACTIVE",
  diagnosed_date: "",
  resolved_date: "",
  notes: "",
});

const emptySurgery = () => ({
  procedure: "",
  date: "",
});

export default function MedicalHistory() {
  const { data, isLoading } = useGetPatientMedicalHistoryQuery();
  const [update, { isLoading: saving, error: updateError }] =
    useUpdatePatientMedicalHistoryMutation();

  const [conditions, setConditions] = useState([]);
  const [surgeries, setSurgeries] = useState([]);
  const [backendErrors, setBackendErrors] = useState({});

  useEffect(() => {
    if (!data) return;
    setConditions(
      Array.isArray(data.conditions)
        ? data.conditions.map((c) => ({
          id: c.id || "",
          name: c.name || "",
          status: c.status || "ACTIVE",
          diagnosed_date: c.diagnosed_date || "",
          resolved_date: c.resolved_date || "",
          notes: c.notes || "",
        }))
        : [],
    );
    setSurgeries(
      Array.isArray(data.surgeries)
        ? data.surgeries.map((s) => ({
          procedure: s.procedure || "",
          date: s.date || "",
        }))
        : [],
    );
  }, [data]);

  const addCondition = () =>
    setConditions((prev) => [...prev, emptyCondition()]);
  const removeCondition = (i) =>
    setConditions((prev) => prev.filter((_, idx) => idx !== i));
  const setCondition = (i, field, value) =>
    setConditions((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)),
    );

  const addSurgery = () => setSurgeries((prev) => [...prev, emptySurgery()]);
  const removeSurgery = (i) =>
    setSurgeries((prev) => prev.filter((_, idx) => idx !== i));
  const setSurgery = (i, field, value) =>
    setSurgeries((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)),
    );

  const getErr = (field) => {
    const e = updateError?.data;
    if (!e) return backendErrors[field];
    if (Array.isArray(e)) return e[0];
    if (e[field]) return Array.isArray(e[field]) ? e[field][0] : e[field];
    return backendErrors[field];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBackendErrors({});
    const payload = {
      conditions: conditions
        .filter((c) => (c.name || "").trim())
        .map((c) => ({
          id: c.id || undefined,
          name: c.name.trim(),
          status: c.status || "ACTIVE",
          diagnosed_date: c.diagnosed_date || null,
          resolved_date: c.resolved_date || null,
          notes: (c.notes || "").trim() || undefined,
        })),
      surgeries: surgeries
        .filter((s) => (s.procedure || "").trim())
        .map((s) => ({
          procedure: s.procedure.trim(),
          date: s.date || null,
        })),
    };
    try {
      await update(payload).unwrap();
    } catch (err) {
      setBackendErrors(err?.data || {});
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Medical History</h1>
          <p className="text-muted-foreground">
            Track your long-term conditions and major surgeries.
          </p>
        </div>
      </div>

      {updateError && !getErr("medical_history") && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            {Array.isArray(updateError?.data)
              ? updateError.data[0]
              : updateError?.data?.detail ||
              "Failed to update medical history."}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Conditions</CardTitle>
            <CardDescription>
              Long-term or significant diagnoses (e.g., asthma, diabetes).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <Label>Conditions</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCondition}
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            {getErr("medical_history") && (
              <p className="text-sm text-destructive mb-2">
                {getErr("medical_history")}
              </p>
            )}
            <div className="space-y-3">
              {conditions.map((c, i) => (
                <div key={i} className="flex gap-2 p-3 border rounded-md">
                  <Input
                    placeholder="Condition name *"
                    value={c.name}
                    onChange={(e) => setCondition(i, "name", e.target.value)}
                    className="flex-1 min-w-[160px]"
                  />
                  <select
                    value={c.status}
                    onChange={(e) => setCondition(i, "status", e.target.value)}
                    className="border rounded-md px-2 text-sm"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>
                  <Input
                    type="date"
                    placeholder="Diagnosed date"
                    max={new Date().toISOString().split("T")[0]}
                    value={c.diagnosed_date}
                    onChange={(e) =>
                      setCondition(i, "diagnosed_date", e.target.value)
                    }
                    className="w-[150px]"
                  />
                  <Input
                    type="date"
                    placeholder="Resolved date"
                    max={new Date().toISOString().split("T")[0]}
                    value={c.resolved_date || ""}
                    onChange={(e) =>
                      setCondition(i, "resolved_date", e.target.value)
                    }
                    className="w-[150px]"
                  />
                  <Input
                    type="text"
                    placeholder="Notes"
                    value={c.notes}
                    onChange={(e) => setCondition(i, "notes", e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCondition(i)}
                    aria-label="Remove condition"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {conditions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No conditions added yet. Click &quot;Add&quot; to create one.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Surgeries</CardTitle>
            <CardDescription>
              Important past surgeries or procedures.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <Label>Surgeries</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSurgery}
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-3">
              {surgeries.map((s, i) => (
                <div
                  key={i}
                  className="flex flex-wrap gap-2 p-3 border rounded-md"
                >
                  <Input
                    placeholder="Procedure *"
                    value={s.procedure}
                    onChange={(e) => setSurgery(i, "procedure", e.target.value)}
                    className="flex-1 min-w-[160px]"
                  />
                  <Input
                    type="date"
                    placeholder="Date *"
                    max={new Date().toISOString().split("T")[0]}
                    value={s.date}
                    onChange={(e) => setSurgery(i, "date", e.target.value)}
                    className="w-[150px]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSurgery(i)}
                    aria-label="Remove surgery"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {surgeries.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No surgeries recorded. Add any major procedures you&apos;ve
                  had.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save history
          </Button>
        </div>
      </form>
    </div>
  );
}
