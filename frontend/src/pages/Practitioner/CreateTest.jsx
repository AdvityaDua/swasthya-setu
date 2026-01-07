import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Loader2, FlaskConical } from "lucide-react";
import { useCreateDiagnosticTestMutation } from "../../app/api/practitionerApiSlice";

const CreateTest = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const patientId = queryParams.get("patient_id");
  const patientName = queryParams.get("patient_name");

  const [testType, setTestType] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [createDiagnosticTest, { isLoading, isError, error, isSuccess, data: createdTest }] = useCreateDiagnosticTestMutation();

  const handleCreateTest = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!patientId) {
      setErrorMessage("No patient selected. Please go back to Patient Lookup and select a patient.");
      return;
    }
    if (!testType) {
      setErrorMessage("Please select a test type.");
      return;
    }

    try {
      const result = await createDiagnosticTest({ patient: patientId, test_type: testType }).unwrap();
      setSuccessMessage(`Diagnostic test for ${patientName} (${testType}) created successfully!`);
      console.log("Test created:", result);
      // Redirect to the TestWorkflow page with the new test ID
    } catch (err) {
      setErrorMessage(err.data?.detail || "Failed to create diagnostic test. Please try again.");
      console.error("Create test failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Create Diagnostic Test</h1>
      <p className="text-muted-foreground">Initiate a new diagnostic test for the selected patient.</p>

      <Card>
        <CardHeader>
          <CardTitle>Test Details</CardTitle>
          <CardDescription>Select the patient and the type of diagnostic test.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          {successMessage && (
            <Alert className="bg-green-100 border-green-400 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-200">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label>Patient Name</Label>
            <Input type="text" value={patientName || "N/A"} readOnly className="bg-muted" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="testType">Test Type</Label>
            <Select value={testType} onValueChange={setTestType} disabled={isLoading}>
              <SelectTrigger id="testType">
                <SelectValue placeholder="Select Test Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TB">Tuberculosis (TB) Scan</SelectItem>
                <SelectItem value="BREAST_CANCER">Breast Cancer Scan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreateTest} disabled={isLoading || !patientId || !testType}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Test...
              </>
            ) : (
              "Create Test"
            )}
          </Button>
          {isSuccess && createdTest && (
            <Button asChild>
              <Link to={`/practitioner/tests/${createdTest.id}/workflow`}>Proceed to Workflow</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateTest;

