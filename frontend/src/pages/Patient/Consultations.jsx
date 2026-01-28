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
import { Loader2, AlertCircle, Video, Calendar, Clock, User, Trash2, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const Consultations = () => {
  const { data: consultations = [], isLoading, error } = useGetPatientConsultationsQuery();
  const [cancelConsultation, { isLoading: isCancelling }] = useCancelConsultationMutation();
  const [selectedStatus, setSelectedStatus] = useState("all");

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
            My Consultations
          </CardTitle>
          <CardDescription>
            View and manage your doctor consultations
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
                You haven't requested any consultations yet. Visit the Doctors page to request a consultation.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Specialization</TableHead>
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
                          <p className="font-semibold">{consultation.doctor_name}</p>
                          <p className="text-xs text-muted-foreground">{consultation.doctor_hospital}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {consultation.doctor_specialization}
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
                          <p className="text-muted-foreground">Awaiting doctor response</p>
                        )}
                      </TableCell>
                      <TableCell className="space-y-2">
                        {consultation.status === "SCHEDULED" && consultation.meet_link && (
                          <Button
                            size="sm"
                            className="w-full gap-2"
                            onClick={() => handleJoinMeeting(consultation.meet_link)}
                          >
                            <Video className="h-3 w-3" />
                            Join Meeting
                          </Button>
                        )}
                        {consultation.meet_link && consultation.status !== "SCHEDULED" && (
                          <a
                            href={consultation.meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Meeting Link
                          </a>
                        )}
                        {["PENDING", "SCHEDULED"].includes(consultation.status) && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full gap-2"
                            onClick={() => handleCancel(consultation.id)}
                            disabled={isCancelling}
                          >
                            {isCancelling ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                            Cancel
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
    </div>
  );
};

export default Consultations;
