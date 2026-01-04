import React from "react";
import { useGetPatientTestsQuery } from "../../app/api/patientApiSlice";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { RocketIcon, Loader2 } from "lucide-react";

const MyTests = () => {
  const { data: tests, isLoading, isSuccess, isError, error } = useGetPatientTestsQuery();

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
        <AlertDescription>Failed to load tests: {error.message || "An unknown error occurred."}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Diagnostic Tests</CardTitle>
      </CardHeader>
      <CardContent>
        {isSuccess && tests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <RocketIcon className="h-12 w-12 mb-4" />
            <p className="text-lg font-semibold">No diagnostic tests found.</p>
            <p className="text-sm">It looks like you haven't taken any tests yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests && tests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell className="font-medium">{test.test_type}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        test.status === "COMPLETED"
                          ? "success"
                          : test.status === "PENDING"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {test.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {test.risk_level ? (
                      <Badge
                        variant={
                          test.risk_level === "HIGH"
                            ? "destructive"
                            : test.risk_level === "MEDIUM"
                            ? "warning"
                            : "default"
                        }
                      >
                        {test.risk_level}
                      </Badge>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/patient/tests/${test.id}`}>View Details</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default MyTests;

