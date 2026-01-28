import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Search, Loader2, UserCircleIcon, Stethoscope, Mail, Phone, CalendarDays, FlaskConical } from "lucide-react";
import { useSearchPatientQuery, useCreateDiagnosticTestMutation } from "../../app/api/practitionerApiSlice";
import { Link, useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

const PatientLookup = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBy, setSearchBy] = useState("phone"); // 'phone' or 'abha_id'
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [testType, setTestType] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  const { data: patient, isLoading, isSuccess, isError, error } = useSearchPatientQuery(
    searchBy === "phone" ? { phone: debouncedSearchQuery } : { abha_id: debouncedSearchQuery },
    {
      skip: !debouncedSearchQuery,
    }
  );

  const [createDiagnosticTest, { isLoading: isTestCreating, isError: isTestError, error: testError, isSuccess: isTestSuccess, data: createdTest }] = useCreateDiagnosticTestMutation();


  // Debounce the search query to avoid excessive API calls
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  React.useEffect(() => {
    if (isSuccess && patient && patient.length > 0 && patient[0].id) {
      setSelectedPatient(patient[0]);
    } else {
      setSelectedPatient(null);
    }
  }, [isSuccess, patient]);


  const handleSubmit = (e) => {
    e.preventDefault();
    setDebouncedSearchQuery(searchQuery);
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!selectedPatient?.id) {
      setErrorMessage("No patient selected. Please search and select a patient.");
      return;
    }
    if (!testType) {
      setErrorMessage("Please select a test type.");
      return;
    }

    try {
      const result = await createDiagnosticTest({ patient: selectedPatient.id, test_type: testType }).unwrap();
      console.log("Create test succeeded:", result);
      setSuccessMessage(`Diagnostic test for ${selectedPatient.name} (${testType}) created successfully!`);
      setTimeout(() => {
        navigate(`/practitioner/tests/${result.test_id}/workflow`);
      }, 1500);
    } catch (err) {
      setErrorMessage(err.data?.detail || "Failed to create diagnostic test. Please try again.");
      console.error("Create test failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Patient Lookup</h1>
      <p className="text-muted-foreground">Search for existing patients by phone number or ABHA ID.</p>

      <Card>
        <CardHeader>
          <CardTitle>Search Patient</CardTitle>
          <CardDescription>Enter patient's phone number or ABHA ID to find their record.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="search-input">Search by {searchBy === "phone" ? "Phone Number" : "ABHA ID"}</Label>
              <div className="flex space-x-2">
                <Input
                  id="search-input"
                  type="text"
                  placeholder={searchBy === "phone" ? "e.g., 9876543210" : "e.g., xxxx-xxxx-xxxx-xxxx"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-grow"
                />
                <Button type="button" variant="outline" onClick={() => setSearchBy(searchBy === "phone" ? "abha_id" : "phone")}>
                  Toggle to {searchBy === "phone" ? "ABHA ID" : "Phone"}
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                  Search
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {debouncedSearchQuery && isLoading && (
        <div className="flex items-center justify-center min-h-[20vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to search patient: {error.message || "An unknown error occurred."}</AlertDescription>
        </Alert>
      )}

      {isSuccess && patient && patient.length > 0 && patient[0].id ? (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-700">Patient Found</CardTitle>
            <CardDescription className="text-green-800">Details of the matched patient.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center space-x-3">
              <UserCircleIcon className="h-6 w-6 text-green-600" />
              <p className="text-lg font-semibold text-green-900">{patient[0].name}</p>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center space-x-2 text-green-800">
                <Phone className="h-4 w-4" />
                <p className="text-sm">Phone: {patient[0].phone}</p>
              </div>
              {patient[0].email && (
                <div className="flex items-center space-x-2 text-green-800">
                  <Mail className="h-4 w-4" />
                  <p className="text-sm">Email: {patient[0].email}</p>
                </div>
              )}
              {patient[0].abha_id && (
                <div className="flex items-center space-x-2 text-green-800">
                  <CalendarDays className="h-4 w-4" />
                  <p className="text-sm">ABHA ID: {patient[0].abha_id}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (debouncedSearchQuery && !isLoading && !isError && (!patient || patient.length === 0 || !patient[0].id) && (
        <Alert variant="info">
          <AlertTitle>No Patient Found</AlertTitle>
          <AlertDescription>No patient matches the provided {searchBy === "phone" ? "phone number" : "ABHA ID"}.</AlertDescription>
        </Alert>
      ))}

      {selectedPatient && (
        <Card>
          <CardHeader>
            <CardTitle>Create Diagnostic Test</CardTitle>
            <CardDescription>Select the type of diagnostic test for {selectedPatient.name}.</CardDescription>
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
              <Input type="text" value={selectedPatient.name || "N/A"} readOnly className="bg-muted" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="testType">Test Type</Label>
              <Select value={testType} onValueChange={setTestType} disabled={isTestCreating}>
                <SelectTrigger id="testType">
                  <SelectValue placeholder="Select Test Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TB">Tuberculosis (TB) Scan</SelectItem>
                  <SelectItem value="BREAST_CANCER">Breast Cancer Scan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateTest} disabled={isTestCreating || !selectedPatient?.id || !testType}>
              {isTestCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Test...
                </>
              ) : (
                "Create Test"
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PatientLookup;

