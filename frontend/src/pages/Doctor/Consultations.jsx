import React, { useState } from "react";
import { EmptyState } from "../../components/ui/empty-state";
import { useGetDoctorConsultationsQuery, useScheduleConsultationMutation, useRejectConsultationMutation, useRescheduleConsultationMutation, useCancelDoctorConsultationMutation } from "../../app/api/doctorApiSlice";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Loader2, AlertCircle, Video, Calendar, Clock, User, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useGoogleLogin } from '@react-oauth/google';

const DoctorConsultations = () => {
  const { data: consultations = [], isLoading, error } = useGetDoctorConsultationsQuery();
  const [scheduleConsultation, { isLoading: isScheduling }] = useScheduleConsultationMutation();
  const [rejectConsultation, { isLoading: isRejecting }] = useRejectConsultationMutation();
  const [rescheduleConsultation, { isLoading: isRescheduling }] = useRescheduleConsultationMutation();
  const [cancelConsultation, { isLoading: isCancelling }] = useCancelDoctorConsultationMutation();

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [scheduleDialog, setScheduleDialog] = useState({ open: false, consultation: null, scheduled_time: "" });
  const [rejectDialog, setRejectDialog] = useState({ open: false, consultation: null, reason: "" });
  const [rescheduleDialog, setRescheduleDialog] = useState({ open: false, consultation: null, newTime: "" });
  const [cancelDialog, setCancelDialog] = useState({ open: false, consultation: null, reason: "" });

  // Google OAuth State
  const [googleAccessToken, setGoogleAccessToken] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const STATUS_STYLES = {
    PENDING: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200",
    SCHEDULED: "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200",
    COMPLETED: "bg-green-100 text-green-800 hover:bg-green-200 border-green-200",
    CANCELLED: "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200",
    REJECTED: "bg-red-100 text-red-800 hover:bg-red-200 border-red-200",
    NO_SHOW: "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200",
  };

  const filteredConsultations = selectedStatus === "all"
    ? consultations
    : consultations.filter(c => c.status === selectedStatus);

  // Helper: Create Calendar Event via Google API
  const createCalendarEvent = async (token, consultation, startTime) => {
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // 30 mins

    const event = {
      summary: `Consultation with ${consultation.patient_name}`,
      description: `Medical consultation via Swasthya Setu.\nPatient: ${consultation.patient_name}\nContact: ${consultation.patient_email}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      conferenceData: {
        createRequest: {
          requestId: `consultation-${consultation.id}-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create Google Calendar event');
      }

      const data = await response.json();
      console.log("Google Calendar API Response:", data);
      return {
        meetLink: data.hangoutLink || data.htmlLink,
        calendarEventId: data.id
      };
    } catch (error) {
      console.error('Calendar API Error:', error);
      return null;
    }
  };

  // Finalize Schedule: Call Backend
  const finalizeSchedule = async (token) => {
    if (!scheduleDialog.consultation || !scheduleDialog.scheduled_time) return;

    setIsProcessing(true);

    // 1. Create Event on Google Calendar
    try {
      // Show some loading indicator if we could... generic "Scheduling..." text will appear on button
      const eventData = await createCalendarEvent(token, scheduleDialog.consultation, scheduleDialog.scheduled_time);

      if (!eventData) {
        throw new Error("Failed to create calendar event");
      }

      const { meetLink, calendarEventId } = eventData;

      // 2. Save to Backend
      console.log("Sending to backend:", {
        consultation_id: scheduleDialog.consultation.id,
        scheduled_time: new Date(scheduleDialog.scheduled_time).toISOString(),
        meet_link: meetLink,
        calendar_event_id: calendarEventId
      });

      await scheduleConsultation({
        consultation_id: scheduleDialog.consultation.id,
        scheduled_time: new Date(scheduleDialog.scheduled_time).toISOString(),
        meet_link: meetLink,
        calendar_event_id: calendarEventId
      }).unwrap();

      setScheduleDialog({ open: false, consultation: null, scheduled_time: "" });
      // Optional: clear token or keep it for session? Keeping it is better UX.
    } catch (err) {
      console.error("Failed to schedule consultation:", err);
      alert("Failed to schedule consultation. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Google Login Hook
  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      setGoogleAccessToken(codeResponse.access_token);
      finalizeSchedule(codeResponse.access_token);
    },
    onError: (error) => console.log('Login Failed:', error),
    scope: 'https://www.googleapis.com/auth/calendar.events', // Request Calendar write scope
  });

  const handleSchedule = () => {
    if (!scheduleDialog.consultation || !scheduleDialog.scheduled_time) {
      alert("Please select a date and time");
      return;
    }

    if (googleAccessToken) {
      // Already authenticated, proceed directly
      finalizeSchedule(googleAccessToken);
    } else {
      // Trigger OAuth flow
      login();
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.consultation) return;

    try {
      await rejectConsultation({
        consultation_id: rejectDialog.consultation.id,
        reason: rejectDialog.reason,
      }).unwrap();
      setRejectDialog({ open: false, consultation: null, reason: "" });
    } catch (err) {
      console.error("Failed to reject consultation:", err);
      alert("Failed to reject consultation.");
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDialog.consultation || !rescheduleDialog.newTime) {
      alert("Please select a new date and time");
      return;
    }

    try {
      // For rescheduling, we might also want to update Calendar, but keeping it simple for now (backend handles logic or just updates time)
      // If we want to use the same flow, we'd need a separate handler. For now, using standard backend call.
      await rescheduleConsultation({
        consultation_id: rescheduleDialog.consultation.id,
        scheduled_time: new Date(rescheduleDialog.newTime).toISOString(),
      }).unwrap();
      setRescheduleDialog({ open: false, consultation: null, newTime: "" });
    } catch (err) {
      console.error("Failed to reschedule consultation:", err);
      alert("Failed to reschedule consultation.");
    }
  };

  const handleCancel = async () => {
    if (!cancelDialog.consultation) return;

    try {
      await cancelConsultation({
        consultation_id: cancelDialog.consultation.id,
        reason: cancelDialog.reason,
      }).unwrap();
      setCancelDialog({ open: false, consultation: null, reason: "" });
    } catch (err) {
      console.error("Failed to cancel consultation:", err);
      alert("Failed to cancel consultation.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load consultations. Please try again.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Consultations</h1>
        <p className="text-muted-foreground mt-2">
          Manage your patient video consultation requests and schedules.
        </p>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Patient Consultations
              </CardTitle>
              <CardDescription>
                {filteredConsultations.length} {selectedStatus === 'all' ? 'total' : selectedStatus.toLowerCase()} consultations found
              </CardDescription>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus("all")}
              >
                All
              </Button>
              <Button
                variant={selectedStatus === "PENDING" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus("PENDING")}
              >
                Pending
              </Button>
              <Button
                variant={selectedStatus === "SCHEDULED" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus("SCHEDULED")}
              >
                Scheduled
              </Button>
              <Button
                variant={selectedStatus === "COMPLETED" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus("COMPLETED")}
              >
                Completed
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Consultations Table */}
          {filteredConsultations.length === 0 ? (
            <EmptyState
              title="No consultations found"
              description={`You don't have any ${selectedStatus !== 'all' ? selectedStatus.toLowerCase() : ''} consultations at the moment.`}
              icon={Video}
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-background">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Patient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Scheduled Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConsultations.map((consultation) => (
                    <TableRow key={consultation.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{consultation.patient_name}</p>
                            <p className="text-xs text-muted-foreground">{consultation.patient_email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${STATUS_STYLES[consultation.status]}`}>
                          {consultation.status_display}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(consultation.requested_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {consultation.scheduled_time ? (
                          <div className="space-y-1">
                            <p className="flex items-center gap-1.5 font-medium">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              {new Date(consultation.scheduled_time).toLocaleDateString()}
                            </p>
                            <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(consultation.scheduled_time).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">Not scheduled</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 flex-wrap">
                          {consultation.status === "PENDING" && (
                            <>
                              <Dialog open={scheduleDialog.open && scheduleDialog.consultation?.id === consultation.id} onOpenChange={(open) => {
                                if (!open) {
                                  setScheduleDialog({ open: false, consultation: null, scheduled_time: "" });
                                } else {
                                  setScheduleDialog({ ...scheduleDialog, open: true, consultation });
                                }
                              }}>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    Schedule
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Schedule Consultation</DialogTitle>
                                    <DialogDescription>
                                      Select a date and time for the consultation with {consultation.patient_name}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <form onSubmit={(e) => { e.preventDefault(); handleSchedule(); }}>
                                    <div className="space-y-4 pt-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="datetime">Date & Time</Label>
                                        <Input
                                          id="datetime"
                                          type="datetime-local"
                                          value={scheduleDialog.scheduled_time}
                                          onChange={(e) => setScheduleDialog({ ...scheduleDialog, scheduled_time: e.target.value })}
                                          min={new Date().toISOString().slice(0, 16)}
                                          required
                                        />
                                      </div>
                                      <Button
                                        type="submit"
                                        disabled={isScheduling || isProcessing}
                                        className="w-full bg-green-600 hover:bg-green-700"
                                      >
                                        {isScheduling || isProcessing ? 'Scheduling...' : 'Confirm Schedule'}
                                      </Button>
                                    </div>
                                  </form>
                                </DialogContent>
                              </Dialog>

                              <Dialog open={rejectDialog.open && rejectDialog.consultation?.id === consultation.id} onOpenChange={(open) => {
                                if (!open) {
                                  setRejectDialog({ open: false, consultation: null, reason: "" });
                                } else {
                                  setRejectDialog({ ...rejectDialog, open: true, consultation });
                                }
                              }}>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    Reject
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Reject Consultation</DialogTitle>
                                    <DialogDescription>
                                      Provide a reason for rejecting this consultation request
                                    </DialogDescription>
                                  </DialogHeader>
                                  <form onSubmit={(e) => { e.preventDefault(); handleReject(); }}>
                                    <div className="space-y-4 pt-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="reason">Reason (optional)</Label>
                                        <textarea
                                          id="reason"
                                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                          placeholder="Why are you rejecting this consultation?"
                                          value={rejectDialog.reason}
                                          onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
                                          rows="3"
                                        />
                                      </div>
                                      <Button
                                        type="submit"
                                        disabled={isRejecting}
                                        variant="destructive"
                                        className="w-full"
                                      >
                                        {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
                                      </Button>
                                    </div>
                                  </form>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}

                          {consultation.status === "SCHEDULED" && (
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              {consultation.meet_link && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="gap-2"
                                  onClick={() => window.open(consultation.meet_link, "_blank")}
                                >
                                  <Video className="h-3.5 w-3.5" />
                                  Join
                                </Button>
                              )}

                              <Dialog open={rescheduleDialog.open && rescheduleDialog.consultation?.id === consultation.id} onOpenChange={(open) => {
                                if (!open) {
                                  setRescheduleDialog({ open: false, consultation: null, newTime: "" });
                                } else {
                                  setRescheduleDialog({ ...rescheduleDialog, open: true, consultation });
                                }
                              }}>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2"
                                  >
                                    <Clock className="h-3.5 w-3.5" />
                                    Reschedule
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Reschedule Consultation</DialogTitle>
                                    <DialogDescription>
                                      Select a new date and time for the consultation
                                    </DialogDescription>
                                  </DialogHeader>
                                  <form onSubmit={(e) => { e.preventDefault(); handleReschedule(); }}>
                                    <div className="space-y-4 pt-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="new-datetime">New Date & Time</Label>
                                        <Input
                                          id="new-datetime"
                                          type="datetime-local"
                                          value={rescheduleDialog.newTime}
                                          onChange={(e) => setRescheduleDialog({ ...rescheduleDialog, newTime: e.target.value })}
                                          min={new Date().toISOString().slice(0, 16)}
                                          required
                                        />
                                      </div>
                                      <Button
                                        type="submit"
                                        disabled={isRescheduling}
                                        className="w-full"
                                      >
                                        {isRescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
                                      </Button>
                                    </div>
                                  </form>
                                </DialogContent>
                              </Dialog>

                              <Dialog open={cancelDialog.open && cancelDialog.consultation?.id === consultation.id} onOpenChange={(open) => {
                                if (!open) {
                                  setCancelDialog({ open: false, consultation: null, reason: "" });
                                } else {
                                  setCancelDialog({ ...cancelDialog, open: true, consultation });
                                }
                              }}>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    Cancel
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Cancel Consultation</DialogTitle>
                                    <DialogDescription>
                                      Provide a reason for cancelling this scheduled consultation
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="cancel-reason">Reason (optional)</Label>
                                      <textarea
                                        id="cancel-reason"
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Why are you cancelling this consultation?"
                                        value={cancelDialog.reason}
                                        onChange={(e) => setCancelDialog({ ...cancelDialog, reason: e.target.value })}
                                        rows="3"
                                      />
                                    </div>
                                    <Button
                                      onClick={handleCancel}
                                      disabled={isCancelling}
                                      variant="destructive"
                                      className="w-full"
                                    >
                                      {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorConsultations;
