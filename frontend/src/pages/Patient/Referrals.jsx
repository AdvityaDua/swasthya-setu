import React from "react";
import { useGetPatientReferralsQuery } from "../../app/api/patientApiSlice";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { FolderSearchIcon, Loader2 } from "lucide-react";

const Referrals = () => {
  const { data: referrals, isLoading, isSuccess, isError, error } = useGetPatientReferralsQuery();
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
        <AlertDescription>Failed to load referrals: {error.message || "An unknown error occurred."}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Referrals</CardTitle>
        <CardDescription>View your current and past referrals.</CardDescription>
      </CardHeader>
      <CardContent>
        {isSuccess && referrals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <FolderSearchIcon className="h-12 w-12 mb-4" />
            <p className="text-lg font-semibold">No referrals found.</p>
            <p className="text-sm">You don't have any referrals at the moment.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor Name</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Decision</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals && referrals.map((referral) => (
                <TableRow key={referral.id}>
                  <TableCell className="font-medium">{referral.doctor_name}</TableCell>
                  <TableCell>{new Date(referral.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        referral.urgency === "HIGH"
                          ? "destructive"
                          : referral.urgency === "MEDIUM"
                          ? "warning"
                          : "default"
                      }
                    >
                      {referral.urgency}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        referral.status === "ACCEPTED"
                          ? "success"
                          : referral.status === "PENDING"
                          ? "secondary"
                          : referral.status === "REJECTED"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {referral.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{referral.decision || "N/A"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default Referrals;

