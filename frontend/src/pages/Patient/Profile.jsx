import React from "react";
import { useGetPatientProfileQuery } from "../../app/api/patientApiSlice";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { UserCircleIcon, Loader2 } from "lucide-react";

const Profile = () => {
  const { data: profile, isLoading, isSuccess, isError, error } = useGetPatientProfileQuery();
  console.log(profile)
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
        <Badge variant="default" className="text-sm px-4 py-2 bg-green-500 text-white">
          <UserCircleIcon className="h-4 w-4 mr-2" /> Verified Patient
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Details registered with Swasthya Setu.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {renderField("Full Name", profile.name)}
          {renderField("Phone Number", profile.phone)}
          {renderField("Email", profile.email)}
          {renderField("ABHA ID", profile.abha_id)}
          {renderField("Address", profile.address)}
          {renderField("Emergency Contact", profile.emergency_contact)}
          {renderField("Account Created", new Date(profile.created_at).toLocaleDateString())}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;

