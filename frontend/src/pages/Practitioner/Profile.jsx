import React, { useEffect, useState } from "react";
import {
  useGetPractitionerProfileQuery,
  useUpdatePractitionerProfileMutation,
} from "../../app/api/practitionerApiSlice";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Loader2 } from "lucide-react";
import { LocationPicker } from "../../components/LocationPicker";

const Profile = () => {
  const { data: profile, isLoading, isError, error, refetch } = useGetPractitionerProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdatePractitionerProfileMutation();

  const [designation, setDesignation] = useState("");
  const [diagnosticCenterName, setDiagnosticCenterName] = useState("");
  const [centerLocation, setCenterLocation] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (profile) {
      setDesignation(profile.designation ?? "");
      setDiagnosticCenterName(profile.diagnostic_center_name ?? "");
      setCenterLocation(profile.center_location ?? "");
      setExperienceYears(profile.experience_years != null ? String(profile.experience_years) : "");
      setLatitude(profile.latitude != null ? Number(profile.latitude) : null);
      setLongitude(profile.longitude != null ? Number(profile.longitude) : null);
    }
  }, [profile]);

  const roundTo6Decimals = (value) => {
    if (value == null) return null;
    return Number(Number(value).toFixed(6));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    const yrs = parseInt(experienceYears, 10);
    if (!designation.trim() || !diagnosticCenterName.trim() || !centerLocation.trim() || !experienceYears.trim()) {
      setErrorMessage("Designation, diagnostic center name, center location, and experience years are required.");
      return;
    }
    if (Number.isNaN(yrs) || yrs < 0) {
      setErrorMessage("Experience years must be a non-negative number.");
      return;
    }
    try {
      await updateProfile({
        designation: designation.trim(),
        diagnostic_center_name: diagnosticCenterName.trim(),
        center_location: centerLocation.trim(),
        experience_years: yrs,
        ...(latitude != null && longitude != null && { latitude: roundTo6Decimals(latitude), longitude: roundTo6Decimals(longitude) }),
      }).unwrap();
      setSuccessMessage("Profile updated successfully.");
      refetch();
    } catch (err) {
      setErrorMessage(err?.data?.detail || err?.message || "Failed to update profile.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load profile: {error?.data?.detail || error?.message || "An unknown error occurred."}
        </AlertDescription>
      </Alert>
    );
  }

  if (!profile) {
    return (
      <Alert>
        <AlertTitle>Not found</AlertTitle>
        <AlertDescription>Your practitioner profile could not be found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Practitioner Profile</h1>
        <p className="text-muted-foreground">Update your diagnostic center and location.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Edit your designation, center details, and pin your location on the map.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            {successMessage && (
              <Alert className="bg-green-100 border-green-400 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-200">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Lab Technician, Radiologist"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="experienceYears">Years of experience</Label>
                <Input
                  id="experienceYears"
                  type="number"
                  min="0"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  placeholder="e.g. 5"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="diagnosticCenterName">Diagnostic center name</Label>
              <Input
                id="diagnosticCenterName"
                value={diagnosticCenterName}
                onChange={(e) => setDiagnosticCenterName(e.target.value)}
                placeholder="e.g. City Diagnostic Lab"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="centerLocation">Center location (address)</Label>
              <Input
                id="centerLocation"
                value={centerLocation}
                onChange={(e) => setCenterLocation(e.target.value)}
                placeholder="Address or area of the center"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Center location on map (optional)</Label>
              <p className="text-xs text-muted-foreground">Click on the map to set your center&apos;s coordinates.</p>
              <LocationPicker
                latitude={latitude}
                longitude={longitude}
                onChange={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
                height="240px"
              />
            </div>

            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
