import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Search, Loader2, UserCircleIcon, Stethoscope, Mail, Phone, CalendarDays } from "lucide-react";
import { useSearchPatientQuery } from "../../app/api/practitionerApiSlice";
import { Link } from "react-router-dom";

const PatientLookup = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBy, setSearchBy] = useState("phone"); // 'phone' or 'abha_id'
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce the search query to avoid excessive API calls
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: patient, isLoading, isSuccess, isError, error } = useSearchPatientQuery(
        searchBy === "phone" ? { phone: debouncedSearchQuery } : { abha_id: debouncedSearchQuery },
    {
      skip: !debouncedSearchQuery,
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setDebouncedSearchQuery(searchQuery);
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
              {patient.abha_id && (
                <div className="flex items-center space-x-2 text-green-800">
                  <CalendarDays className="h-4 w-4" />
                  <p className="text-sm">ABHA ID: {patient.abha_id}</p>
                </div>
              )}
            </div>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link to={`/practitioner/create-test?patient_id=${patient[0].id}&patient_name=${patient[0].name}`}>
                Create Diagnostic Test
                <Stethoscope className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (debouncedSearchQuery && !isLoading && !isError && (!patient || patient.length === 0 || !patient[0].id) && (
        <Alert variant="info">
          <AlertTitle>No Patient Found</AlertTitle>
          <AlertDescription>No patient matches the provided {searchBy === "phone" ? "phone number" : "ABHA ID"}.</AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

export default PatientLookup;

