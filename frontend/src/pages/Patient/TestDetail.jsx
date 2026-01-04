import React from "react";
import { useParams } from "react-router-dom";
import { useGetPatientTestDetailQuery } from "../../app/api/patientApiSlice";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { FrownIcon, InfoIcon, TrendingUpIcon, ShieldAlertIcon, Loader2 } from "lucide-react";

const TestDetail = () => {
  const { test_id } = useParams();
  const { data: testDetail, isLoading, isSuccess, isError, error } = useGetPatientTestDetailQuery(test_id);

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
        <AlertDescription>Failed to load test details: {error.message || "An unknown error occurred."}</AlertDescription>
      </Alert>
    );
  }

  if (!isSuccess || !testDetail) {
    return (
      <Alert variant="info">
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>Test details could not be found.</AlertDescription>
      </Alert>
    );
  }

  const getRiskLevelBadge = (riskLevel) => {
    switch (riskLevel) {
      case "HIGH":
        return <Badge variant="destructive">High</Badge>;
      case "MEDIUM":
        return <Badge variant="warning">Medium</Badge>;
      case "LOW":
        return <Badge variant="success">Low</Badge>;
      default:
        return <Badge variant="outline">N/A</Badge>;
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>Test Summary</CardTitle>
          <CardDescription>Overview of the diagnostic test.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Test Type</p>
            <p className="text-lg font-semibold">{testDetail.test_type}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <Badge
              variant={
                testDetail.status === "COMPLETED"
                  ? "success"
                  : testDetail.status === "PENDING"
                  ? "secondary"
                  : "outline"
              }
            >
              {testDetail.status}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Risk Level</p>
            {getRiskLevelBadge(testDetail.risk_level)}
          </div>
        </CardContent>
      </Card>

      {testDetail.ai_result && (
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>AI Result</CardTitle>
            <CardDescription>Analysis provided by AI.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Risk Level</p>
              {getRiskLevelBadge(testDetail.ai_result.risk_level)}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Risk Score</p>
              <p className="text-lg font-semibold">{testDetail.ai_result.risk_score}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Confidence</p>
              <p className="text-lg font-semibold">{(testDetail.ai_result.confidence * 100).toFixed(2)}%</p>
            </div>
            {/* Add more AI result details as needed */}
          </CardContent>
        </Card>
      )}

      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>Doctor Review</CardTitle>
          <CardDescription>Detailed review by a medical professional.</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>No doctor review available yet.</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>Referral Status</CardTitle>
          <CardDescription>Current status of any associated referrals.</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>No referral information available.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestDetail;

