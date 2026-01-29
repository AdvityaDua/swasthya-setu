import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useRegisterMutation } from "../../app/api/userApiSlice";
import { LocationPicker } from "../../components/LocationPicker";

const PREFERRED_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "bn", label: "Bengali" },
  { value: "mr", label: "Marathi" },
  { value: "gu", label: "Gujarati" },
  { value: "kn", label: "Kannada" },
  { value: "ml", label: "Malayalam" },
  { value: "pa", label: "Punjabi" },
  { value: "or", label: "Odia" },
  { value: "as", label: "Assamese" },
  { value: "ur", label: "Urdu" },
];

const SPECIALIZATIONS = [
  { value: "TB", label: "Tuberculosis" },
  { value: "BREAST_CANCER", label: "Breast Cancer" },
  { value: "DIABETIC_RETINOPATHY", label: "Diabetic Retinopathy" },
  { value: "PNEUMONIA", label: "Pneumonia" },
  { value: "FRACTURE", label: "Hairline Fracture" },
  { value: "GENERAL", label: "General Medicine" },
];

const BLOOD_GROUPS = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-",
];

function RegisterPage() {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [abhaId, setAbhaId] = useState("");
  const [password, setPassword] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("en");

  // Patient profile
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [knownAllergies, setKnownAllergies] = useState("");
  const [chronicConditions, setChronicConditions] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [address, setAddress] = useState("");

  // Doctor profile
  const [specialization, setSpecialization] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [isTeleconsultAvailable, setIsTeleconsultAvailable] = useState(true);
  const [doctorLat, setDoctorLat] = useState(null);
  const [doctorLng, setDoctorLng] = useState(null);

  // Practitioner profile
  const [designation, setDesignation] = useState("");
  const [diagnosticCenterName, setDiagnosticCenterName] = useState("");
  const [centerLocation, setCenterLocation] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [practitionerLat, setPractitionerLat] = useState(null);
  const [practitionerLng, setPractitionerLng] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const [register, { isLoading, error }] = useRegisterMutation();

  useEffect(() => {
    if (error) {
      const d = error.data;
      let msg = "Registration failed. Please try again.";
      if (d) {
        if (typeof d === "string") msg = d;
        else if (d.detail) msg = typeof d.detail === "string" ? d.detail : JSON.stringify(d.detail);
        else if (d.phone?.[0]) msg = d.phone[0];
        else if (d.patient_profile_data) msg = typeof d.patient_profile_data === "string" ? d.patient_profile_data : d.patient_profile_data[Object.keys(d.patient_profile_data)[0]]?.[0] || msg;
        else if (d.doctor_profile_data) msg = typeof d.doctor_profile_data === "string" ? d.doctor_profile_data : d.doctor_profile_data[Object.keys(d.doctor_profile_data)[0]]?.[0] || msg;
        else if (d.practitioner_profile_data) msg = typeof d.practitioner_profile_data === "string" ? d.practitioner_profile_data : d.practitioner_profile_data[Object.keys(d.practitioner_profile_data)[0]]?.[0] || msg;
      } else if (error.status === "FETCH_ERROR") {
        msg = "Network error. Please check your internet connection.";
      }
      setErrorMessage(msg);
      setSuccessMessage("");
    } else {
      setErrorMessage("");
    }
  }, [error]);

  const buildPayload = () => {
    const base = {
      full_name: fullName,
      phone,
      email: email || null,
      role,
      abha_id: abhaId || null,
      password,
      preferred_language: preferredLanguage,
    };
    if (role === "PATIENT") {
      base.patient_profile_data = {
        date_of_birth: dateOfBirth || null,
        blood_group: bloodGroup && bloodGroup !== "__none__" ? bloodGroup : null,
        known_allergies: knownAllergies || null,
        chronic_conditions: chronicConditions || null,
        emergency_contact: emergencyContact,
        address,
      };
    } else if (role === "DOCTOR") {
      base.doctor_profile_data = {
        specialization,
        hospital_name: hospitalName,
        registration_number: registrationNumber,
        years_of_experience: parseInt(yearsOfExperience, 10),
        is_teleconsult_available: isTeleconsultAvailable,
        ...(doctorLat != null && doctorLng != null && { latitude: doctorLat, longitude: doctorLng }),
      };
    } else if (role === "PRACTITIONER") {
      base.practitioner_profile_data = {
        designation,
        diagnostic_center_name: diagnosticCenterName,
        center_location: centerLocation,
        experience_years: parseInt(experienceYears, 10),
        ...(practitionerLat != null && practitionerLng != null && { latitude: practitionerLat, longitude: practitionerLng }),
      };
    }
    return base;
  };

  const validateStep1 = () => {
    if (!fullName || !phone || !role || !password) {
      setErrorMessage("Full Name, Phone Number, Role, and Password are required.");
      return false;
    }
    setErrorMessage("");
    return true;
  };

  const validateStep2 = () => {
    if (role === "PATIENT") {
      if (!emergencyContact.trim() || !address.trim()) {
        setErrorMessage("Emergency contact and Address are required.");
        return false;
      }
    } else if (role === "DOCTOR") {
      if (!specialization || !hospitalName.trim() || !registrationNumber.trim() || !yearsOfExperience.trim()) {
        setErrorMessage("Specialization, Hospital name, Registration number, and Years of experience are required.");
        return false;
      }
      const yrs = parseInt(yearsOfExperience, 10);
      if (Number.isNaN(yrs) || yrs < 0) {
        setErrorMessage("Years of experience must be a non-negative number.");
        return false;
      }
    } else if (role === "PRACTITIONER") {
      if (!designation.trim() || !diagnosticCenterName.trim() || !centerLocation.trim() || !experienceYears.trim()) {
        setErrorMessage("Designation, Diagnostic center name, Center location, and Experience years are required.");
        return false;
      }
      const yrs = parseInt(experienceYears, 10);
      if (Number.isNaN(yrs) || yrs < 0) {
        setErrorMessage("Experience years must be a non-negative number.");
        return false;
      }
    }
    setErrorMessage("");
    return true;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!validateStep1()) return;
    setErrorMessage("");
    setStep(2);
  };

  const handleBack = () => {
    setErrorMessage("");
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (step === 1) {
      handleNext(e);
      return;
    }
    if (!validateStep2()) return;
    try {
      await register(buildPayload()).unwrap();
      setSuccessMessage("Registration successful! You can now log in.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  const renderStep1 = () => (
    <>
      <div className="grid gap-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="John Doe"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="text"
          placeholder="9876543210"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email (Optional)</Label>
        <Input
          id="email"
          type="email"
          placeholder="john.doe@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="role">Role</Label>
        <Select value={role} onValueChange={setRole} required>
          <SelectTrigger id="role" className="w-full">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PATIENT">Patient</SelectItem>
            <SelectItem value="PRACTITIONER">Practitioner</SelectItem>
            <SelectItem value="DOCTOR">Doctor</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="abhaId">ABHA ID (Optional)</Label>
        <Input
          id="abhaId"
          type="text"
          placeholder="xxxx-xxxx-xxxx-xxxx"
          value={abhaId}
          onChange={(e) => setAbhaId(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="preferredLanguage">Preferred Language</Label>
        <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
          <SelectTrigger id="preferredLanguage" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PREFERRED_LANGUAGES.map(({ value, label }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="button" className="w-full" onClick={handleNext}>
        Next <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </>
  );

  const renderPatientStep2 = () => (
    <>
      <div className="grid gap-2">
        <Label htmlFor="dateOfBirth">Date of Birth (Optional)</Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="bloodGroup">Blood Group (Optional)</Label>
        <Select value={bloodGroup || "__none__"} onValueChange={(v) => setBloodGroup(v === "__none__" ? "" : v)}>
          <SelectTrigger id="bloodGroup" className="w-full">
            <SelectValue placeholder="Select blood group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {BLOOD_GROUPS.map((bg) => (
              <SelectItem key={bg} value={bg}>{bg}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="knownAllergies">Known Allergies (Optional)</Label>
        <Textarea
          id="knownAllergies"
          placeholder="e.g. Penicillin, pollen"
          value={knownAllergies}
          onChange={(e) => setKnownAllergies(e.target.value)}
          rows={2}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="chronicConditions">Chronic Conditions (Optional)</Label>
        <Textarea
          id="chronicConditions"
          placeholder="e.g. Hypertension, Type 2 Diabetes"
          value={chronicConditions}
          onChange={(e) => setChronicConditions(e.target.value)}
          rows={2}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="emergencyContact">Emergency Contact *</Label>
        <Input
          id="emergencyContact"
          type="text"
          placeholder="9876543210"
          required
          value={emergencyContact}
          onChange={(e) => setEmergencyContact(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="address">Address *</Label>
        <Textarea
          id="address"
          placeholder="Full address"
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
        />
      </div>
    </>
  );

  const renderDoctorStep2 = () => (
    <>
      <div className="grid gap-2">
        <Label htmlFor="specialization">Specialization *</Label>
        <Select value={specialization} onValueChange={setSpecialization} required>
          <SelectTrigger id="specialization" className="w-full">
            <SelectValue placeholder="Select specialization" />
          </SelectTrigger>
          <SelectContent>
            {SPECIALIZATIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="hospitalName">Hospital Name *</Label>
        <Input
          id="hospitalName"
          type="text"
          placeholder="e.g. Apollo Hospital"
          required
          value={hospitalName}
          onChange={(e) => setHospitalName(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="registrationNumber">Registration Number *</Label>
        <Input
          id="registrationNumber"
          type="text"
          placeholder="Medical council registration number"
          required
          value={registrationNumber}
          onChange={(e) => setRegistrationNumber(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
        <Input
          id="yearsOfExperience"
          type="number"
          min="0"
          placeholder="e.g. 10"
          required
          value={yearsOfExperience}
          onChange={(e) => setYearsOfExperience(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="teleconsult">Teleconsultation Available</Label>
        <Select
          value={isTeleconsultAvailable ? "yes" : "no"}
          onValueChange={(v) => setIsTeleconsultAvailable(v === "yes")}
        >
          <SelectTrigger id="teleconsult" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Clinic / hospital location (optional)</Label>
        <p className="text-xs text-muted-foreground">Click on the map to set your location.</p>
        <LocationPicker
          latitude={doctorLat}
          longitude={doctorLng}
          onChange={(lat, lng) => {
            setDoctorLat(lat);
            setDoctorLng(lng);
          }}
          height="200px"
        />
      </div>
    </>
  );

  const renderPractitionerStep2 = () => (
    <>
      <div className="grid gap-2">
        <Label htmlFor="designation">Designation *</Label>
        <Input
          id="designation"
          type="text"
          placeholder="e.g. Lab Technician, Radiologist"
          required
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="diagnosticCenterName">Diagnostic Center Name *</Label>
        <Input
          id="diagnosticCenterName"
          type="text"
          placeholder="e.g. City Diagnostic Lab"
          required
          value={diagnosticCenterName}
          onChange={(e) => setDiagnosticCenterName(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="centerLocation">Center Location *</Label>
        <Input
          id="centerLocation"
          type="text"
          placeholder="Address or area of the center"
          required
          value={centerLocation}
          onChange={(e) => setCenterLocation(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="experienceYears">Years of Experience *</Label>
        <Input
          id="experienceYears"
          type="number"
          min="0"
          placeholder="e.g. 5"
          required
          value={experienceYears}
          onChange={(e) => setExperienceYears(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label>Diagnostic center location (optional)</Label>
        <p className="text-xs text-muted-foreground">Click on the map to set your center&apos;s location.</p>
        <LocationPicker
          latitude={practitionerLat}
          longitude={practitionerLng}
          onChange={(lat, lng) => {
            setPractitionerLat(lat);
            setPractitionerLng(lng);
          }}
          height="200px"
        />
      </div>
    </>
  );

  const renderStep2 = () => {
    if (role === "PATIENT") return renderPatientStep2();
    if (role === "DOCTOR") return renderDoctorStep2();
    if (role === "PRACTITIONER") return renderPractitionerStep2();
    return null;
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <article className="flex-1 flex items-center justify-center py-8 bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Register</CardTitle>
            <CardDescription>
              {step === 1
                ? "Create your account to get started with Swasthya Setu."
                : `Complete your ${role === "PATIENT" ? "patient" : role === "DOCTOR" ? "doctor" : "practitioner"} profile.`}
            </CardDescription>
            {step === 2 && (
              <p className="text-sm text-muted-foreground mt-1">
                Step 2 of 2
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
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
              {step === 1 ? renderStep1() : renderStep2()}
              {step === 2 && (
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      "Register"
                    )}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Button variant="link" className="p-0 h-auto" asChild>
                <NavLink to="/login">Login</NavLink>
              </Button>
            </p>
          </CardFooter>
        </Card>
      </article>
      <Footer />
    </main>
  );
}

export default RegisterPage;
