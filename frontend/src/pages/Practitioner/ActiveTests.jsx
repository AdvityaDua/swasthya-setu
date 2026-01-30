import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGetPractitionerActiveTestsQuery } from "../../app/api/practitionerApiSlice";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Loader2, AlertCircle, TrendingUp, Zap, CheckCircle2, Clock, FileText } from "lucide-react";
import { API_ORIGIN } from "../../app/api";
import ReportManager from "@/components/ReportManager";

const ActiveTests = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const { data: tests, isLoading, error } = useGetPractitionerActiveTestsQuery();

  // Filter tests by status
  const filteredTests = useMemo(() => {
    if (!tests) return [];
    if (statusFilter === "ALL") return tests;
    return tests.filter((test) => test.status === statusFilter);
  }, [tests, statusFilter]);

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case "UPLOADED":
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1"><Clock className="h-3 w-3" /> Awaiting Context</Badge>;
      case "AI_DONE":
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> AI Analysis Complete</Badge>;
      case "REFERRED":
        return <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Referred to Doctor</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get test type display
  const getTestTypeBadge = (testType) => {
    const colors = {
      TB: "bg-orange-100 text-orange-800",
      BREAST_CANCER: "bg-pink-100 text-pink-800",
      DIABITIES: "bg-indigo-100 text-indigo-800",
    };
    return <Badge className={colors[testType] || "bg-gray-100 text-gray-800"}>{testType}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading tests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load active tests. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Active Tests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage and monitor your diagnostic tests across all stages of the workflow.
        </p>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Tests</SelectItem>
              <SelectItem value="UPLOADED">Awaiting Context (Uploaded)</SelectItem>
              <SelectItem value="AI_DONE">AI Analysis Complete</SelectItem>
              <SelectItem value="REFERRED">Referred to Doctor</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Tests Grid/Table */}
      {filteredTests && filteredTests.length > 0 ? (
        <div className="grid gap-4">
          {filteredTests.map((test) => (
            <Card key={test.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-muted-foreground">Patient</p>
                      <p className="font-medium text-lg">{test.patient_name || `Patient #${test.patient}`}</p>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-sm font-semibold text-muted-foreground">Status</p>
                      {getStatusBadge(test.status)}
                    </div>
                  </div>

                  {/* Details Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Test Type</p>
                      <p className="mt-1">{getTestTypeBadge(test.test_type)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Created</p>
                      <p className="text-sm mt-1">{formatDate(test.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Progress</p>
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          <span>Image Uploaded</span>
                        </div>
                        {test.status !== "UPLOADED" && (
                          <div className="flex items-center gap-2 text-xs">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span>Clinical Context</span>
                          </div>
                        )}
                        {(test.status === "AI_DONE" || test.status === "REFERRED") && (
                          <div className="flex items-center gap-2 text-xs">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span>AI Analysis</span>
                          </div>
                        )}
                        {test.status === "REFERRED" && (
                          <div className="flex items-center gap-2 text-xs">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span>Doctor Referred</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={() => navigate(`/practitioner/tests/${test.id}/workflow`)}
                        variant={test.status === "REFERRED" ? "secondary" : "default"}
                        size="sm"
                        className="w-full"
                      >
                        {test.status === "REFERRED" ? "View Details" : "Continue"}
                      </Button>
                    </div>
                  </div>

                  {/* AI Risk Level if available */}
                  {test.ai_result && test.ai_result.risk_level && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-muted-foreground flex gap-3 items-center">
                          <div className="flex gap-1">
                            <Zap className="h-3 w-3" /> AI Result
                          </div>
                          {test.ai_result.report_pdf && (() => {
                            return (
                              <div className="flex gap-2">
                                <ReportManager
                                  testId={test.id}
                                  initialLanguage="en" // Default to en as we don't store language preference on test model yet
                                  reportUrl={test.ai_result.report_pdf}
                                />
                              </div>
                            );
                          })()}
                        </span>
                        <Badge
                          className={`${test.ai_result.risk_level === "HIGH"
                            ? "bg-red-100 text-red-800"
                            : test.ai_result.risk_level === "MEDIUM"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                            }`}
                        >
                          Risk: {test.ai_result.risk_level}
                        </Badge>
                        {test.ai_result.risk_score && (
                          <span className="text-sm font-medium">Score: {test.ai_result.risk_score.toFixed(2)}</span>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-12 pb-12 text-center space-y-3">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="font-semibold text-lg">No tests found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {statusFilter === "ALL"
                  ? "Create a new test by uploading a diagnostic image."
                  : `No tests with status "${statusFilter}" found.`}
              </p>
            </div>
            <Button onClick={() => navigate("/practitioner/create-test")} className="mt-4">
              Create New Test
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ActiveTests;
