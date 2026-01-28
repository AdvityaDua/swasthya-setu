import React, { useState, useMemo } from "react";
import {
  useGetDoctorsQuery,
  useRequestConsultationMutation,
} from "../../app/api/patientApiSlice";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Loader2, Stethoscope, AlertCircle, CheckCircle2, Users } from "lucide-react";

const SPECIALIZATION_OPTIONS = [
  { code: "TB", label: "Tuberculosis" },
  { code: "ONCOLOGY", label: "Oncology" },
  { code: "GENERAL", label: "General Medicine" },
];

const Doctors = () => {
  const [selectedSpecialization, setSelectedSpecialization] = useState("all");
  const [successMessage, setSuccessMessage] = useState("");
  const [requestingDoctorId, setRequestingDoctorId] = useState(null);

  const { data: doctors, isLoading, error } = useGetDoctorsQuery(selectedSpecialization && selectedSpecialization !== "all" ? selectedSpecialization : undefined);
  const [requestConsultation, { isLoading: requestingInProgress, error: requestError }] =
    useRequestConsultationMutation();

  const filteredDoctors = useMemo(() => {
    if (!doctors) return [];
    return doctors;
  }, [doctors]);

  const handleRequestConsultation = async (doctorId) => {
    setRequestingDoctorId(doctorId);
    try {
      await requestConsultation(doctorId).unwrap();
      setSuccessMessage("Consultation request sent successfully! The doctor will contact you soon.");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error("Error requesting consultation:", err);
    } finally {
      setRequestingDoctorId(null);
    }
  };

  const formatAvailabilityTimings = (timings) => {
    if (!timings || Object.keys(timings).length === 0) {
      return "Not specified";
    }

    return Object.entries(timings)
      .map(([day, times]) => {
        if (typeof times === "object" && times.start && times.end) {
          return `${day}: ${times.start} - ${times.end}`;
        }
        return `${day}: ${times}`;
      })
      .join(", ");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">Success</AlertTitle>
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Request Error */}
      {requestError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {requestError?.data?.detail ||
              requestError?.data?.message ||
              "Failed to send consultation request. Please try again."}
          </AlertDescription>
        </Alert>
      )}

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Find Doctors
          </CardTitle>
          <CardDescription>
            Browse and request consultations with doctors specializing in your area of concern
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label htmlFor="specialization" className="text-sm font-medium">
              Filter by Specialization (Optional)
            </label>
            <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
              <SelectTrigger id="specialization">
                <SelectValue placeholder="All Specializations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specializations</SelectItem>
                {SPECIALIZATION_OPTIONS.map((spec) => (
                  <SelectItem key={spec.code} value={spec.code}>
                    {spec.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Doctors List */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load doctors. Please try again later.</AlertDescription>
        </Alert>
      )}

      {filteredDoctors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-semibold">No doctors found</p>
          <p className="text-sm">Try selecting a different specialization</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDoctors.map((doctor) => (
            <Card key={doctor.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{doctor.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{doctor.specialization}</Badge>
                    {doctor.is_teleconsult_available && (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        Teleconsult Available
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Hospital Info */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Hospital</p>
                  <p className="text-sm font-medium">{doctor.hospital_name}</p>
                </div>

                {/* Experience */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Experience</p>
                  <p className="text-sm font-medium">{doctor.years_of_experience} years</p>
                </div>

                {/* Availability */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Availability</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {formatAvailabilityTimings(doctor.availability_timings)}
                  </p>
                </div>

                {/* Request Button */}
                <Button
                  onClick={() => handleRequestConsultation(doctor.id)}
                  disabled={requestingInProgress && requestingDoctorId === doctor.id}
                  className="w-full"
                >
                  {requestingInProgress && requestingDoctorId === doctor.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    "Request Consultation"
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Doctors;
