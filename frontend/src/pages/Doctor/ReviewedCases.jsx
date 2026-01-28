import React from 'react';
import { Link } from 'react-router-dom';
import { useGetDoctorReviewedCasesQuery } from '../../app/api/doctorApiSlice';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import { AlertCircle, FileCheck, ArrowRight, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { formatDistanceToNow } from "date-fns";

const ReviewedCases = () => {
    const { data: reviews, isLoading, error } = useGetDoctorReviewedCasesQuery();

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
                <AlertDescription>Failed to load reviewed cases.</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Reviewed Cases</h1>
                <p className="text-muted-foreground">History of your diagnostic reviews and decisions.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileCheck className="h-5 w-5 text-green-600" />
                        Case History
                    </CardTitle>
                    <CardDescription>
                        {reviews?.length || 0} cases reviewed
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!reviews || reviews.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No reviewed cases found.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Test Type</TableHead>
                                    <TableHead>Decision</TableHead>
                                    <TableHead>Reviewed</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reviews.map((review) => (
                                    <TableRow key={review.id}>
                                        <TableCell className="font-medium">{review.patient_name}</TableCell>
                                        <TableCell>{review.test_type}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                review.decision === 'CONFIRM' ? 'default' :
                                                    review.decision === 'OVERRIDE' ? 'destructive' : 'secondary'
                                            }>
                                                {review.decision}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {formatDistanceToNow(new Date(review.reviewed_at), { addSuffix: true })}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate text-muted-foreground">
                                            {review.notes || "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button asChild variant="ghost" size="sm">
                                                <Link to={`/doctor/cases/${review.test_id}`}>
                                                    View Case <ArrowRight className="ml-2 h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ReviewedCases;
