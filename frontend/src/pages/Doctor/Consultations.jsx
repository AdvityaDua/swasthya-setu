import React, { useState } from "react";
import { useGetDoctorConsultationsQuery, useScheduleConsultationMutation, useRejectConsultationMutation, useRescheduleConsultationMutation } from "../../app/api/doctorApiSlice";
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

const DoctorConsultations = () => {
  const { data: consultations = [], isLoading, error } = useGetDoctorConsultationsQuery();
  const [scheduleConsultation, { isLoading: isScheduling }] = useScheduleConsultationMutation();
  const [rejectConsultation, { isLoading: isRejecting }] = useRejectConsultationMutation();
  const [rescheduleConsultation, { isLoading: isRescheduling }] = useRescheduleConsultationMutation();

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [scheduleDialog, setScheduleDialog] = useState({ open: false, consultation: null });
  const [rejectDialog, setRejectDialog] = useState({ open: false, consultation: null, reason: "" });
  const [rescheduleDialog, setRescheduleDialog] = useState({ open: false, consultation: null, newTime: "" });

  const STATUS_COLORS = {
    PENDING: "bg-yellow-100 text-yellow-800",
    SCHEDULED: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-800",
    REJECTED: "bg-red-100 text-red-800",
    NO_SHOW: "bg-orange-100 text-orange-800",
  };

  const filteredConsultations = selectedStatus === "all" 
    ? consultations 
    : consultations.filter(c => c.status === selectedStatus);

  const handleSchedule = async () => {
    if (!scheduleDialog.consultation || !scheduleDialog.scheduled_time) {
      alert("Please select a date and time");
      return;
    }

    try {
      await scheduleConsultation({
        consultation_id: scheduleDialog.consultation.id,
        scheduled_time: new Date(scheduleDialog.scheduled_time).toISOString(),
      }).unwrap();
      setScheduleDialog({ open: false, consultation: null, scheduled_time: "" });
    } catch (err) {
      console.error("Failed to schedule consultation:", err);
      alert("Failed to schedule consultation. Please check the time and try again.");
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Consultations</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Consultations</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Failed to load consultations. Please try again.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Patient Consultations
          </CardTitle>
          <CardDescription>
            Manage consultation requests from patients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedStatus === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus("all")}
            >
              All ({consultations.length})
            </Button>
            <Button
              variant={selectedStatus === "PENDING" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus("PENDING")}
            >
              Pending ({consultations.filter(c => c.status === "PENDING").length})
            </Button>
            <Button
              variant={selectedStatus === "SCHEDULED" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus("SCHEDULED")}
            >
              Scheduled ({consultations.filter(c => c.status === "SCHEDULED").length})
            </Button>
            <Button
              variant={selectedStatus === "COMPLETED" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus("COMPLETED")}
            >
              Completed ({consultations.filter(c => c.status === "COMPLETED").length})
            </Button>
          </div>

          {/* Consultations Table */}
          {filteredConsultations.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No consultations</AlertTitle>
              <AlertDescription>
                You don't have any consultation requests yet.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Scheduled Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConsultations.map((consultation) => (
                    <TableRow key={consultation.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-semibold flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {consultation.patient_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{consultation.patient_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[consultation.status]}>
                          {consultation.status_display}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(consultation.requested_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {consultation.scheduled_time ? (
                          <div className="space-y-1">
                            <p className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(consultation.scheduled_time).toLocaleDateString()}
                            </p>
                            <p className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(consultation.scheduled_time).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-xs">Not scheduled</p>
                        )}
                      </TableCell>
                      <TableCell className="space-y-2">
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
                                  className="w-full gap-2 bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-3 w-3" />
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
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="datetime">Date & Time</Label>
                                    <Input
                                      id="datetime"
                                      type="datetime-local"
                                      value={scheduleDialog.scheduled_time}
                                      onChange={(e) => setScheduleDialog({ ...scheduleDialog, scheduled_time: e.target.value })}
                                    />
                                  </div>
                                  <Button
                                    onClick={handleSchedule}
                                    disabled={isScheduling}
                                    className="w-full"
                                  >
                                    {isScheduling ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Scheduling...
                                      </>
                                    ) : (
                                      "Confirm Schedule"
                                    )}
                                  </Button>
                                </div>
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
                                  variant="destructive"
                                  className="w-full gap-2"
                                >
                                  <XCircle className="h-3 w-3" />
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
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="reason">Reason (optional)</Label>
                                    <textarea
                                      id="reason"
                                      className="w-full p-2 border rounded-md text-sm"
                                      placeholder="Why are you rejecting this consultation?"
                                      value={rejectDialog.reason}
                                      onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
                                      rows="3"
                                    />
                                  </div>
                                  <Button
                                    onClick={handleReject}
                                    disabled={isRejecting}
                                    variant="destructive"
                                    className="w-full"
                                  >
                                    {isRejecting ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Rejecting...
                                      </>
                                    ) : (
                                      "Confirm Rejection"
                                    )}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}

                        {consultation.status === "SCHEDULED" && (
                          <>
                            {consultation.meet_link && (
                              <Button
                                size="sm"
                                className="w-full gap-2"
                                onClick={() => window.open(consultation.meet_link, "_blank")}
                              >
                                <Video className="h-3 w-3" />
                                Join Meeting
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
                                  className="w-full gap-2"
                                >
                                  <AlertTriangle className="h-3 w-3" />
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
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="new-datetime">New Date & Time</Label>
                                    <Input
                                      id="new-datetime"
                                      type="datetime-local"
                                      value={rescheduleDialog.newTime}
                                      onChange={(e) => setRescheduleDialog({ ...rescheduleDialog, newTime: e.target.value })}
                                    />
                                  </div>
                                  <Button
                                    onClick={handleReschedule}
                                    disabled={isRescheduling}
                                    className="w-full"
                                  >
                                    {isRescheduling ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Rescheduling...
                                      </>
                                    ) : (
                                      "Confirm Reschedule"
                                    )}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}

                        {consultation.status === "COMPLETED" && (
                          <Badge variant="outline">Completed</Badge>
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
    </div>
  );
};

export default DoctorConsultations;
