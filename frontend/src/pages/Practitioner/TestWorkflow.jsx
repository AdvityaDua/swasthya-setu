import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetTestDetailQuery,
  useUploadTestImageMutation,
  useAddClinicalContextMutation,
  useRunAIInferenceMutation,
  useGetAIResultQuery,
  useReferToDoctorMutation,
  useSearchPatientQuery,
  useGetDoctorsListQuery,
} from "../../app/api/practitionerApiSlice";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import ReportManager from "@/components/ReportManager";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Loader2, AlertCircle, CheckCircle2, Upload, FileText, Zap, Share2, Image, Activity } from "lucide-react";

export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi (हिन्दी)" },
  { code: "mr", name: "Marathi (मराठी)" },
  { code: "ta", name: "Tamil (தமிழ்)" },
  { code: "te", name: "Telugu (తెలుగు)" },
  { code: "kn", name: "Kannada (ಕನ್ನಡ)" },
  { code: "gu", name: "Gujarati (ગુજરાતી)" },
  { code: "bn", name: "Bengali (বাংলা)" },
  { code: "ml", name: "Malayalam (മലയാളം)" },
  { code: "pa", name: "Punjabi (ਪੰਜਾਬੀ)" },
];

const TestWorkflow = () => {
  const { test_id } = useParams();
  const navigate = useNavigate();

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [imageFile, setImageFile] = useState(null);
  const [symptoms, setSymptoms] = useState("");
  const [vitals, setVitals] = useState({ bp: "", temperature: "", heart_rate: "" });
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [urgency, setUrgency] = useState("ROUTINE");
  const [referralReason, setReferralReason] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedLang, setSelectedLang] = useState("en");

  // API hooks
  const { data: testDetail, isLoading: testLoading, error: testError } = useGetTestDetailQuery(test_id);
  const [uploadImage, { isLoading: uploadingImage }] = useUploadTestImageMutation();
  const [addContext, { isLoading: addingContext }] = useAddClinicalContextMutation();
  const [runAI, { isLoading: runningAI }] = useRunAIInferenceMutation();
  // determine whether we should fetch AI results: when current step >=3 OR test already has AI_DONE/REFERRED
  const shouldFetchAI = (testDetail && (testDetail.status === "AI_DONE" || testDetail.status === "REFERRED")) || currentStep >= 3;
  const { data: aiResult, isLoading: aiResultLoading, refetch: refetchAIResult } = useGetAIResultQuery(test_id, {
    skip: !shouldFetchAI,
  });
  const [referToDoctor, { isLoading: referringDoctor }] = useReferToDoctorMutation();

  // Fetch doctors list, filtering by test type if available
  const { data: doctorsList, isLoading: doctorsLoading } = useGetDoctorsListQuery(
    testDetail ? { test_type: testDetail.test_type } : { test_type: null }
  );

  // set initial/current step based on existing test data
  useEffect(() => {
    if (!testDetail) return;
    if (testDetail.status === "AI_DONE" || testDetail.status === "REFERRED") {
      setCurrentStep(4);
      // ensure ai result is loaded
      setTimeout(() => refetchAIResult(), 200);
    } else if (testDetail.status === "UPLOADED") {
      // if image already present, advance to clinical context step
      if (testDetail.image) {
        setCurrentStep(2);
      } else {
        setCurrentStep(1);
      }
    }
  }, [testDetail, refetchAIResult]);

  // Handlers for each step
  const handleImageUpload = async () => {
    if (!imageFile) {
      setErrorMessage("Please select an image file.");
      return;
    }

    // 5MB limit
    if (imageFile.size > 5 * 1024 * 1024) {
      setErrorMessage("File size exceeds 5MB limit.");
      return;
    }

    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      await uploadImage({ test_id, formData }).unwrap();
      setSuccessMessage("Image uploaded successfully!");
      setErrorMessage("");
      setCurrentStep(2);
    } catch (err) {
      setErrorMessage(err.data?.detail || "Failed to upload image.");
    }
  };

  const handleClinicalContextSubmit = async () => {
    if (!symptoms.trim()) {
      setErrorMessage("Please describe the symptoms.");
      return;
    }

    const contextData = {
      symptoms: symptoms,
      vitals: vitals.bp || vitals.temperature || vitals.heart_rate ? vitals : null,
    };

    try {
      await addContext({ test_id, body: contextData }).unwrap();
      setSuccessMessage("Clinical context saved!");
      setErrorMessage("");
      setCurrentStep(3);
    } catch (err) {
      setErrorMessage(err.data?.detail || "Failed to save clinical context.");
    }
  };

  const handleRunAI = async () => {
    try {
      await runAI({ test_id, language: selectedLang }).unwrap();
      setSuccessMessage("AI inference completed!");
      setErrorMessage("");
      setCurrentStep(4);
      // Refetch AI results
      setTimeout(() => refetchAIResult(), 500);
    } catch (err) {
      setErrorMessage(err.data?.detail || "Failed to run AI inference.");
    }
  };

  const handleReferToDoctor = async () => {
    if (!selectedDoctor) {
      setErrorMessage("Please select a doctor.");
      return;
    }
    if (!referralReason.trim()) {
      setErrorMessage("Please provide a reason for referral.");
      return;
    }

    try {
      await referToDoctor({
        test_id,
        body: {
          doctor: selectedDoctor,
          urgency: urgency,
          reason: referralReason,
        },
      }).unwrap();
      setSuccessMessage("Referral submitted successfully!");
      setErrorMessage("");
      setTimeout(() => navigate("/practitioner"), 2000);
    } catch (err) {
      setErrorMessage(err.data?.detail || "Failed to submit referral.");
    }
  };

  if (testLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (testError || !testDetail) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load test details. Please try again.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Test Workflow</h1>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`flex-1 p-3 rounded-lg text-center font-semibold transition-all ${step === currentStep
                ? "bg-blue-600 text-white"
                : step < currentStep
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-200 text-gray-600"
                }`}
            >
              Step {step}
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert className="bg-green-100 border-green-400 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-200">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Image Upload */}
      {currentStep >= 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Step 1: Upload Diagnostic Image
            </CardTitle>
            <CardDescription>Upload DICOM, PNG, or JPG diagnostic image</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-input">Select Image File</Label>
              <Input
                id="image-input"
                type="file"
                accept=".dcm,.png,.jpg,.jpeg"
                onChange={(e) => setImageFile(e.target.files?.[0])}
                disabled={currentStep > 1}
              />
              {imageFile && <p className="text-sm text-muted-foreground">Selected: {imageFile.name}</p>}
            </div>
            {currentStep === 1 && (
              <Button onClick={handleImageUpload} disabled={uploadingImage || !imageFile} className="w-full">
                {uploadingImage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Image
                  </>
                )}
              </Button>
            )}
            {currentStep > 1 && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="mr-2 h-3 w-3" />
                Completed
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Clinical Context */}
      {currentStep >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Step 2: Clinical Context & Vitals
            </CardTitle>
            <CardDescription>Provide symptoms and vital signs for context-aware AI analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={(e) => { e.preventDefault(); handleClinicalContextSubmit(); }}>
              <div className="space-y-2">
                <Label htmlFor="symptoms">Symptoms & Clinical Notes</Label>
                <textarea
                  id="symptoms"
                  placeholder="Describe patient symptoms, complaints, and clinical observations..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  disabled={currentStep > 2}
                  className="w-full p-3 border rounded-md min-h-24 text-sm"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="bp">Blood Pressure (mmHg)</Label>
                  <Input
                    id="bp"
                    placeholder="e.g., 120/80"
                    value={vitals.bp}
                    onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                    disabled={currentStep > 2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temp">Temperature (°C)</Label>
                  <Input
                    id="temp"
                    placeholder="e.g., 37.5"
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={vitals.temperature}
                    onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                    disabled={currentStep > 2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hr">Heart Rate (bpm)</Label>
                  <Input
                    id="hr"
                    placeholder="e.g., 72"
                    type="number"
                    min="0"
                    max="300"
                    value={vitals.heart_rate}
                    onChange={(e) => setVitals({ ...vitals, heart_rate: e.target.value })}
                    disabled={currentStep > 2}
                  />
                </div>
              </div>

              {currentStep === 2 && (
                <Button type="submit" disabled={addingContext} className="w-full mt-4">
                  {addingContext ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Activity className="mr-2 h-4 w-4" />
                      Save Clinical Context
                    </>
                  )}
                </Button>
              )}
              {currentStep > 2 && (
                <Badge className="bg-green-100 text-green-800 mt-4">
                  <CheckCircle2 className="mr-2 h-3 w-3" />
                  Completed
                </Badge>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Run AI Inference */}
      {currentStep >= 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Step 3: AI Analysis
            </CardTitle>
            <CardDescription>Run AI inference with patient health context</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!aiResult && currentStep === 3 && (
              <>
                <p className="text-sm text-muted-foreground">
                  Click the button below to run AI analysis on the uploaded image with clinical context.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="ai-lang-select">Report Language</Label>
                  <Select value={selectedLang} onValueChange={setSelectedLang}>
                    <SelectTrigger id="ai-lang-select">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The report will be generated in this language.
                  </p>
                </div>

                <Button onClick={handleRunAI} className="w-full">
                  {runningAI ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running AI Inference...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Run AI Analysis
                    </>
                  )}
                </Button>
              </>
            )}

            {aiResult && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-semibold text-muted-foreground">Detection</p>
                    <p className="text-lg font-bold mt-2 text-blue-600">{aiResult.prediction_label || "N/A"}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-semibold text-muted-foreground">Risk Level</p>
                    <Badge
                      className={`mt-2 ${aiResult.risk_level === "HIGH"
                        ? "bg-red-100 text-red-800"
                        : aiResult.risk_level === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                        }`}
                    >
                      {aiResult.risk_level}
                    </Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-semibold text-muted-foreground">Risk Score</p>
                    <p className="text-2xl font-bold mt-2">{aiResult.risk_score?.toFixed(2) || "N/A"}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-semibold text-muted-foreground">Confidence</p>
                    <p className="text-2xl font-bold mt-2">{aiResult.confidence != null ? (aiResult.confidence * 100).toFixed(2) : "N/A"}%</p>
                  </div>
                </div>

                {aiResult.heatmap && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">AI Heatmap Visualization</p>
                    <img src={aiResult.heatmap} alt="AI Heatmap" className="w-full border rounded-lg max-h-[500px] object-contain bg-black" />
                  </div>
                )}

                {aiResult.summary && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900 mb-2">AI Summary</p>
                    <p className="text-sm text-blue-800">{aiResult.summary}</p>
                  </div>
                )}

                {aiResult && (() => {
                  return (
                    <div className="pt-2">
                      <ReportManager
                        testId={test_id}
                        initialLanguage={selectedLang}
                        reportUrl={aiResult.report_pdf}
                      />
                    </div>
                  );
                })()}

                <p className="text-xs text-muted-foreground italic">
                  ⚠️ AI results are assistive only and must be reviewed by a doctor before patient disclosure.
                </p>
              </div>
            )}

            {currentStep > 3 && aiResult && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="mr-2 h-3 w-3" />
                Completed
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Refer to Doctor */}
      {currentStep >= 4 && aiResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Step 4: Refer to Doctor
            </CardTitle>
            <CardDescription>Submit referral with AI results for doctor review</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={(e) => { e.preventDefault(); handleReferToDoctor(); }}>
              <div className="space-y-2">
                <Label htmlFor="doctor-select">Select Doctor</Label>
                <Select value={selectedDoctor} onValueChange={setSelectedDoctor} required>
                  <SelectTrigger id="doctor-select">
                    <SelectValue placeholder={doctorsLoading ? "Loading doctors..." : "Choose a doctor..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {doctorsLoading ? (
                      <SelectItem disabled value="loading_doctors">Loading...</SelectItem>
                    ) : doctorsList && doctorsList.length > 0 ? (
                      doctorsList.map((doctor) => (
                        <SelectItem key={doctor.doctor_id} value={doctor.doctor_id}>
                          Dr. {doctor.name} - {doctor.specialization}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem disabled value="no_doctors_available">No doctors available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency-select">Urgency Level</Label>
                <Select value={urgency} onValueChange={setUrgency}>
                  <SelectTrigger id="urgency-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ROUTINE">Routine</SelectItem>
                    <SelectItem value="HIGH">High (Urgent)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Referral Reason</Label>
                <textarea
                  id="reason"
                  placeholder="Explain why you're referring this case to the doctor..."
                  value={referralReason}
                  onChange={(e) => setReferralReason(e.target.value)}
                  className="w-full p-3 border rounded-md min-h-20 text-sm"
                  required
                />
              </div>

              {currentStep === 4 && (
                <Button type="submit" disabled={referringDoctor || !selectedDoctor} className="w-full">
                  {referringDoctor ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Share2 className="mr-2 h-4 w-4" />
                      Submit Referral
                    </>
                  )}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TestWorkflow;
