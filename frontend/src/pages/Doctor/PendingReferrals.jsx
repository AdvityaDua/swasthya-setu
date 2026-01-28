import React from "react";
import { useGetDoctorReferralsQuery } from "../../app/api/doctorApiSlice";
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
import { Loader2, AlertCircle, FileText, Calendar, Clock, User, ArrowRight, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

const PendingReferrals = () => {
    const { data: referrals = [], isLoading, error } = useGetDoctorReferralsQuery();
    const navigate = useNavigate();

    const URGENCY_STYLES = {
        ROUTINE: "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200",
        HIGH: "bg-red-100 text-red-800 hover:bg-red-200 border-red-200",
        CRITICAL: "bg-red-600 text-white hover:bg-red-700 border-red-700", // Hypothetical
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
                <AlertDescription>Failed to load pending referrals. Please try again.</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Pending Referrals</h1>
                <p className="text-muted-foreground mt-2">
                    Review and take action on diagnostic cases referred to you.
                </p>
            </div>

            <Card className="border-none shadow-md">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Referral Queue
                            </CardTitle>
                            <CardDescription>
                                {referrals.length} cases waiting for review
                            </CardDescription>
                        </div>
                        {/* Future: Add filters here */}
                    </div>
                </CardHeader>
                <CardContent>
                    {referrals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-lg border border-dashed">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                <FileText className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold">No pending referrals</h3>
                            <p className="text-muted-foreground max-w-sm mt-1">
                                Great job! You have cleared your referral queue.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border bg-background">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Test Type</TableHead>
                                        <TableHead>Urgency</TableHead>
                                        <TableHead>Referred By</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {referrals.map((referral) => (
                                        <TableRow key={referral.id} className="hover:bg-muted/50">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <span className="font-semibold text-primary">
                                                            {referral.patient_name.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm">{referral.patient_name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {/* Future: Add Age/Gender if available in serializer */}
                                                            Patient
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono">
                                                    {referral.test_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`${URGENCY_STYLES[referral.urgency] || "bg-gray-100"}`}>
                                                    {referral.urgency === 'HIGH' && <AlertTriangle className="mr-1 h-3 w-3" />}
                                                    {referral.urgency}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <div className="space-y-0.5">
                                                    <p className="font-medium">{referral.referred_by_name || "Unknown Practitioner"}</p>
                                                    <p className="text-xs text-muted-foreground">{referral.referred_by_center}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                <div className="flex flex-col gap-1">
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {new Date(referral.created_at).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-xs">
                                                        {formatDistanceToNow(new Date(referral.created_at), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    className="gap-2"
                                                    onClick={() => navigate(`/doctor/cases/${referral.test_id}`)}
                                                >
                                                    Review Case
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
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

export default PendingReferrals;
