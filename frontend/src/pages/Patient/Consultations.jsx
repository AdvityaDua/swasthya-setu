import React, { useState } from "react";
import { useGetPatientConsultationsQuery, useCancelConsultationMutation } from "../../app/api/patientApiSlice";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Loader2, AlertCircle, Video, Calendar, Clock, User, Trash2, ExternalLink, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const Consultations = () => {
  const { data: consultations = [], isLoading, error } = useGetPatientConsultationsQuery();
  const [cancelConsultation, { isLoading: isCancelling }] = useCancelConsultationMutation();
  const [selectedStatus, setSelectedStatus] = useState("all");

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

  const handleCancel = async (consultationId) => {
    if (window.confirm("Are you sure you want to cancel this consultation request?")) {
      try {
        await cancelConsultation(consultationId).unwrap();
      } catch (err) {
        console.error("Failed to cancel consultation:", err);
      }
    }
  };

  const handleJoinMeeting = (meetLink) => {
    if (meetLink) {
      window.open(meetLink, "_blank");
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
        <h1 className="text-3xl font-bold tracking-tight">My Consultations</h1>
        <p className="text-muted-foreground mt-2">
          View and join your scheduled video consultations with doctors.
        </p>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Consultation History
              </CardTitle>
              <CardDescription>
                {filteredConsultations.length} {selectedStatus === 'all' ? 'total' : selectedStatus.toLowerCase()} consultations
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
            <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-lg border border-dashed">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Video className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No consultations found</h3>
              <p className="text-muted-foreground max-w-sm mt-1">
                You don't have any {selectedStatus !== 'all' && selectedStatus.toLowerCase()} consultations at the moment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-background">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Doctor</TableHead>
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
                            <p className="font-semibold text-sm">{consultation.doctor_name}</p>
                            <p className="text-xs text-muted-foreground">{consultation.doctor_specialization} • {consultation.doctor_hospital}</p>
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
                          <span className="text-muted-foreground text-xs italic">Awaiting confirmation</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 flex-wrap">
                          {consultation.status === "SCHEDULED" && consultation.meet_link && (
                            <Button
                              size="sm"
                              variant="default"
                              className="gap-2"
                              onClick={() => handleJoinMeeting(consultation.meet_link)}
                            >
                              <Video className="h-3.5 w-3.5" />
                              Join
                            </Button>
                          )}

                          {["PENDING", "SCHEDULED"].includes(consultation.status) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleCancel(consultation.id)}
                              disabled={isCancelling}
                            >
                              {isCancelling ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5" />
                              )}
                              Cancel
                            </Button>
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
export default Consultations;
