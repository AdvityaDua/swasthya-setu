import React, { useState } from "react";
import { EmptyState } from "../../components/ui/empty-state";
import {
  useGetPatientAppointmentsQuery,
  useBookAppointmentMutation,
  useGetPractitionersQuery,
} from "../../app/api/patientApiSlice";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Loader2, Plus, AlertCircle, CheckCircle2, Calendar, MapPin } from "lucide-react";

import Map, { Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const Appointments = () => {
  const { data: appointments, isLoading: appointmentsLoading, isSuccess } = useGetPatientAppointmentsQuery();
  const { data: practitioners, isLoading: practitionersLoading } = useGetPractitionersQuery();
  const [bookAppointment, { isLoading: bookingInProgress, error: bookingError }] = useBookAppointmentMutation();

  const [showBookForm, setShowBookForm] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedPractitionerForMap, setSelectedPractitionerForMap] = useState(null);

  const [formData, setFormData] = useState({
    appointment_type: "DIAGNOSTIC",
    scheduled_time: "",
    practitioner_id: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear validation error for this field when user modifies it
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.scheduled_time) {
      errors.scheduled_time = "Please select a date and time";
    }

    if (!formData.practitioner_id) {
      errors.practitioner_id = "Please select a diagnostic center";
    }

    return errors;
  };

  const handleBookAppointment = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const payload = {
        appointment_type: formData.appointment_type,
        scheduled_time: formData.scheduled_time,
        practitioner_id: formData.practitioner_id,
      };

      await bookAppointment(payload).unwrap();

      setSuccessMessage("Appointment booked successfully!");
      setFormData({
        appointment_type: "DIAGNOSTIC",
        scheduled_time: "",
        practitioner_id: "",
      });
      setValidationErrors({});
      setShowBookForm(false);

      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error("Error booking appointment:", err);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "BOOKED":
        return "default";
      case "COMPLETED":
        return "success";
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatDateTime = (dateTimeStr) => {
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateTimeStr;
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toISOString().slice(0, 16);
  };

  const openLocationInMap = (practitioner) => {
    setSelectedPractitionerForMap(practitioner);
    setShowMapModal(true);
  };

  const openGoogleMaps = (practitioner) => {
    if (practitioner.latitude && practitioner.longitude) {
      const googleMapsUrl = `https://maps.google.com/?q=${practitioner.latitude},${practitioner.longitude}`;
      window.open(googleMapsUrl, "_blank");
    }
  };

  if (appointmentsLoading) {
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

      {/* Booking Error */}
      {bookingError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {bookingError?.data?.message ||
              bookingError?.data?.detail ||
              "Failed to book appointment. Please try again."}
          </AlertDescription>
        </Alert>
      )}

      {/* Map Modal */}
      {showMapModal && selectedPractitionerForMap && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {selectedPractitionerForMap.center_name}
                </CardTitle>
                <CardDescription>
                  {selectedPractitionerForMap.center_location}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMapModal(false)}
                className="h-6 w-6 p-0"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPractitionerForMap.latitude && selectedPractitionerForMap.longitude ? (
                <>
                  <div className="bg-slate-100 rounded-lg p-4 text-center">
                    <p className="text-sm font-medium mb-3">Location Coordinates</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Latitude: {selectedPractitionerForMap.latitude.toFixed(6)} | Longitude:{" "}
                      {selectedPractitionerForMap.longitude.toFixed(6)}
                    </p>
                    <div className="h-[300px] w-full rounded-lg overflow-hidden relative">
                      <Map
                        initialViewState={{
                          longitude: selectedPractitionerForMap.longitude,
                          latitude: selectedPractitionerForMap.latitude,
                          zoom: 14,
                        }}
                        style={{ width: "100%", height: "100%" }}
                        mapStyle="mapbox://styles/mapbox/streets-v12"
                        mapboxAccessToken={MAPBOX_TOKEN}
                      >
                        <Marker
                          longitude={selectedPractitionerForMap.longitude}
                          latitude={selectedPractitionerForMap.latitude}
                          color="#3b82f6"
                        />
                      </Map>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => openGoogleMaps(selectedPractitionerForMap)}
                      className="flex-1"
                    >
                      Open in Google Maps
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowMapModal(false)}
                      className="flex-1"
                    >
                      Close
                    </Button>
                  </div>
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Location coordinates not available for this center.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}


      {/* Book Appointment Form Card */}
      {
        !showBookForm ? (
          <Button
            onClick={() => setShowBookForm(true)}
            className="w-full md:w-auto gap-2"
            size="lg"
          >
            <Plus className="h-4 w-4" />
            Book New Appointment
          </Button>
        ) : (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Book Diagnostic Appointment
              </CardTitle>
              <CardDescription>
                Schedule a diagnostic appointment at a nearby center
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Appointment Type (Fixed) */}
              <div className="space-y-2">
                <Label htmlFor="appointment_type">Appointment Type</Label>
                <Input
                  id="appointment_type"
                  type="text"
                  value="Diagnostic"
                  disabled
                  className="bg-slate-100"
                />
              </div>

              {/* Practitioner Selection */}
              <div className="space-y-2">
                <Label htmlFor="practitioner_id">
                  Select Diagnostic Center *
                </Label>
                {practitionersLoading ? (
                  <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading centers...
                  </div>
                ) : practitioners && practitioners.length > 0 ? (
                  <Select
                    value={formData.practitioner_id}
                    onValueChange={(value) => handleFormChange("practitioner_id", value)}
                  >
                    <SelectTrigger id="practitioner_id">
                      <SelectValue placeholder="Choose a diagnostic center" />
                    </SelectTrigger>
                    <SelectContent>
                      {practitioners.map((practitioner) => (
                        <SelectItem key={practitioner.id} value={practitioner.id}>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{practitioner.center_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {practitioner.center_location}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No diagnostic centers available at the moment.
                    </AlertDescription>
                  </Alert>
                )}
                {validationErrors.practitioner_id && (
                  <p className="text-sm text-destructive">{validationErrors.practitioner_id}</p>
                )}
              </div>

              {/* Date & Time Selection */}
              <div className="space-y-2">
                <Label htmlFor="scheduled_time">Preferred Date & Time *</Label>
                <Input
                  id="scheduled_time"
                  type="datetime-local"
                  value={formData.scheduled_time}
                  onChange={(e) => handleFormChange("scheduled_time", e.target.value)}
                  min={getMinDateTime()}
                  className={validationErrors.scheduled_time ? "border-destructive" : ""}
                />
                {validationErrors.scheduled_time && (
                  <p className="text-sm text-destructive">{validationErrors.scheduled_time}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Please select a date and time at least 30 minutes from now
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleBookAppointment}
                  disabled={bookingInProgress}
                  className="flex-1"
                >
                  {bookingInProgress ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Booking...
                    </>
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowBookForm(false);
                    setValidationErrors({});
                    setFormData({
                      appointment_type: "DIAGNOSTIC",
                      scheduled_time: "",
                      practitioner_id: "",
                    });
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      }

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Appointments</CardTitle>
          <CardDescription>
            View all your scheduled diagnostic appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess && appointments && appointments.length === 0 ? (
            <EmptyState
              title="No appointments yet"
              description="Book your first appointment to get started with diagnostic tests"
              icon={Calendar}
              action={{
                label: "Book New Appointment",
                onClick: () => setShowBookForm(true)
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Center</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments &&
                    appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell className="font-medium">
                          {appointment.appointment_type}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(appointment.scheduled_time)}
                        </TableCell>
                        <TableCell>
                          {appointment.practitioner_center ? (
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {appointment.practitioner_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {appointment.practitioner_center}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {appointment.practitioner_center && (
                            <Button
                              variant="default"
                              size="sm"
                              className="gap-2"
                              onClick={() => {
                                const practitioner = practitioners?.find(
                                  (p) => p.center_name === appointment.practitioner_center
                                );
                                if (practitioner) {
                                  openLocationInMap(practitioner);
                                }
                              }}
                            >
                              <MapPin className="h-4 w-4" />
                              View Map
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div >
  );
};

export default Appointments;
