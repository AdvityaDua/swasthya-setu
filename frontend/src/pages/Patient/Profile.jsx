import React from "react";
import { Link } from "react-router-dom";
import { useGetPatientProfileQuery } from "../../app/api/patientApiSlice";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { UserCircleIcon, Loader2, Pencil } from "lucide-react";

const Profile = () => {
  const { data: profile, isLoading, isSuccess, isError, error } = useGetPatientProfileQuery();
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
        <AlertDescription>Failed to load profile: {error.message || "An unknown error occurred."}</AlertDescription>
      </Alert>
    );
  }

  if (!isSuccess || !profile) {
    return (
      <Alert variant="info">
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>Your profile details could not be found.</AlertDescription>
      </Alert>
    );
  }

  const renderField = (label, value) => (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value || "Not provided"}</p>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Your registered healthcare information</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link to="/patient/profile/edit">
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </Link>
          </Button>
          <Badge variant="default" className="text-sm px-4 py-2 bg-green-500 text-white">
            <UserCircleIcon className="h-4 w-4 mr-2" /> Verified Patient
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Contact and identification details.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {renderField("Full Name", profile.name)}
          {renderField("Phone Number", profile.phone)}
          {renderField("Email", profile.email)}
          {renderField("ABHA ID", profile.abha_id)}
          {renderField("Date of birth", profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : null)}
          {renderField("Blood group", profile.blood_group)}
          {renderField("Address", profile.address)}
          {renderField("Emergency Contact", profile.emergency_contact)}
          {renderField("Account Created", new Date(profile.created_at).toLocaleDateString())}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Health History</CardTitle>
          <CardDescription>Allergies, conditions, surgeries, medications, and lifestyle.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderField("Known allergies", profile.known_allergies)}
          {renderField("Chronic conditions", profile.chronic_conditions)}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Past surgeries</p>
            <p className="text-lg font-semibold">
              {profile.past_surgeries?.length
                ? profile.past_surgeries.map((s, i) => (
                    <span key={i}>
                      {s.procedure}{s.date ? ` (${new Date(s.date).toLocaleDateString()})` : ""}
                      {i < profile.past_surgeries.length - 1 ? "; " : ""}
                    </span>
                  ))
                : "Not provided"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Current medications</p>
            <p className="text-lg font-semibold">
              {profile.current_medications?.length
                ? profile.current_medications.map((m, i) => (
                    <span key={i}>
                      {m.name}{m.dosage ? ` ${m.dosage}` : ""}{m.ongoing ? " (ongoing)" : ""}
                      {i < profile.current_medications.length - 1 ? "; " : ""}
                    </span>
                  ))
                : "Not provided"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Lifestyle</p>
            <p className="text-lg font-semibold">
              {(() => {
                const li = profile.lifestyle_indicators;
                if (!li) return "Not provided";
                const parts = [
                  li.smoking?.status && `Smoking: ${li.smoking.status}`,
                  li.alcohol?.status && `Alcohol: ${li.alcohol.status}`,
                  li.physical_activity?.level && `Activity: ${li.physical_activity.level}`,
                  li.diet && `Diet: ${li.diet}`,
                  li.sleep_hours_avg != null && `Sleep: ~${li.sleep_hours_avg}h`,
                ].filter(Boolean);
                return parts.length ? parts.join(" · ") : "Not provided";
              })()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;

