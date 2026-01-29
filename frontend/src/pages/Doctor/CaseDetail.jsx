import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    useGetDoctorCaseDetailQuery,
    useSubmitDoctorReviewMutation,
    useCloseDoctorReferralMutation,
    useCreateAndScheduleConsultationMutation
} from '../../app/api/doctorApiSlice';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import {
    ArrowLeft, Loader2, AlertCircle, FileText, User, Calendar,
    Stethoscope, Activity, FileCheck, CheckCircle, Video, Clock, CheckCircle2
} from 'lucide-react';
import { formatDistanceToNow } from "date-fns";

const LANGUAGES = [
    { code: "en", name: "English" },
    { code: "hi", name: "Hindi (हिन्दी)" },
    { code: "mr", name: "Marathi (मराठी)" },
    { code: "ta", name: "Tamil (தமிழ்)" },
    { code: "te", name: "Telugu (తెలుగు)" },
    { code: "kn", name: "Kannada (ಕನ್ನಡ)" },
    { code: "gu", name: "Gujarati (ગુજરાતી)" },
    { code: "bn", name: "Bengali (বাংলা)" },
    { code: "ml", name: "Malayalam (മലയാളം)" },
    { code: "pa", name: "Punjabi (ਪੰਜਾਬী)" },
];

const CaseDetail = () => {
    const { test_id } = useParams();
    const navigate = useNavigate();

    // API Hooks
    const { data: caseDetail, isLoading, error } = useGetDoctorCaseDetailQuery(test_id);
    const [submitReview, { isLoading: isSubmitting }] = useSubmitDoctorReviewMutation();
    const [closeReferral, { isLoading: isClosing }] = useCloseDoctorReferralMutation();
    const [createSchedule, { isLoading: isScheduling }] = useCreateAndScheduleConsultationMutation();

    // Local State
    const [reviewDecision, setReviewDecision] = useState("");
    const [reviewNotes, setReviewNotes] = useState("");
    const [isConsultationDialogOpen, setIsConsultationDialogOpen] = useState(false);
    const [scheduleDateTime, setScheduleDateTime] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [selectedLang, setSelectedLang] = useState("en");

    // Clear messages on route change or after timeout
    useEffect(() => {
        if (successMessage || errorMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage("");
                setErrorMessage("");
            }, 5000); // Auto-dismiss after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [successMessage, errorMessage]);

    const handleReviewSubmit = async () => {
        setErrorMessage("");
        setSuccessMessage("");
        if (!reviewDecision) {
            setErrorMessage("Please select a decision");
            return;
        }

        try {
            await submitReview({
                referral_id: caseDetail.referral_id,
                decision: reviewDecision,
                notes: reviewNotes
            }).unwrap();
            setSuccessMessage("Review submitted successfully");
            setTimeout(() => navigate('/doctor/referrals'), 1500);
        } catch (err) {
            setErrorMessage("Failed to submit review");
            console.error(err);
        }
    };

    const handleCloseCase = async () => {
        setErrorMessage("");
        setSuccessMessage("");
        try {
            await closeReferral(caseDetail.referral_id).unwrap();
            setSuccessMessage("Case closed successfully");
            setTimeout(() => navigate('/doctor/referrals'), 1500);
        } catch (err) {
            setErrorMessage("Failed to close case");
        }
    };

    const handleDirectSchedule = async () => {
        setErrorMessage("");
        setSuccessMessage("");
        if (!scheduleDateTime) {
            setErrorMessage("Please select a date and time");
            return;
        }

        try {
            await createSchedule({
                patient_id: caseDetail.patient_id,
                scheduled_time: new Date(scheduleDateTime).toISOString(),
            }).unwrap();

            setSuccessMessage("Consultation scheduled and Meet link created");
            setIsConsultationDialogOpen(false);
        } catch (err) {
            setErrorMessage("Failed to schedule consultation");
            console.error(err);
        }
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
            <div className="space-y-4">
                <Button asChild variant="ghost" className="gap-2">
                    <Link to="/doctor/referrals">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Referrals
                    </Link>
                </Button>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Failed to load case details. Please try again.</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8 -ml-2">
                            <Link to="/doctor/referrals">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold tracking-tight">Case Review</h1>
                    </div>
                    {/* Messages */}
                    {errorMessage && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>
                    )}
                    {successMessage && (
                        <Alert className="mt-4 bg-green-100 border-green-400 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-200">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertTitle>Success</AlertTitle>
                            <AlertDescription>{successMessage}</AlertDescription>
                        </Alert>
                    )}
                    <p className="text-muted-foreground ml-8">
                        {caseDetail.test_type} • ID: {caseDetail.id.slice(0, 8)}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={isConsultationDialogOpen} onOpenChange={setIsConsultationDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Video className="h-4 w-4" />
                                Schedule Consultation
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Schedule Consultation</DialogTitle>
                                <DialogDescription>
                                    Directly schedule a video with {caseDetail.patient_name}. A Google Meet link will be generated automatically.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Date & Time</Label>
                                    <Input
                                        type="datetime-local"
                                        value={scheduleDateTime}
                                        onChange={(e) => setScheduleDateTime(e.target.value)}
                                        min={new Date().toISOString().slice(0, 16)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsConsultationDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleDirectSchedule} disabled={isScheduling}>
                                    {isScheduling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Schedule & Generate Link
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {caseDetail.status !== 'CLOSED' && (
                        <Button variant="secondary" onClick={handleCloseCase} disabled={isClosing}>
                            {isClosing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Close Case"}
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Patient & AI Data */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Patient Info */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" />
                                Patient Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground block">Full Name</span>
                                <span className="font-medium">{caseDetail.patient_name}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Age / Gender</span>
                                <span className="font-medium text-muted-foreground italic">
                                    {caseDetail.patient_age ? `${caseDetail.patient_age} yrs` : 'N/A'} / {caseDetail.patient_gender || 'N/A'}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Test Date</span>
                                <span className="font-medium">
                                    {new Date(caseDetail.test_date).toLocaleDateString()}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Status</span>
                                <Badge variant="outline">{caseDetail.status}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Diagnostic Image & AI Result */}
                    <Card className="overflow-hidden">
                        <CardHeader className="bg-muted/30">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Activity className="h-5 w-5 text-purple-600" />
                                AI Analysis
                            </CardTitle>
                            <CardDescription>
                                Automated screening results (Review required)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid md:grid-cols-2">
                                {/* Raw Image */}
                                <div className="p-4 border-r border-b md:border-b-0 space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground mb-2">Original Scan</p>
                                    <div className="min-h-[300px] bg-black rounded-lg overflow-hidden flex items-center justify-center relative border">
                                        {caseDetail.raw_image ? (
                                            <img
                                                src={caseDetail.raw_image}
                                                alt="Raw Scan"
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <span className="text-gray-500 text-xs">No image available</span>
                                        )}
                                    </div>
                                </div>

                                {/* Heatmap / Results */}
                                <div className="p-4 space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground mb-2">AI Heatmap</p>
                                        <div className="min-h-[300px] bg-black rounded-lg overflow-hidden flex items-center justify-center relative border">
                                            {caseDetail.ai_result?.heatmap_image ? (
                                                <img
                                                    src={caseDetail.ai_result.heatmap_image}
                                                    alt="AI Heatmap"
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <div className="text-center p-4">
                                                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                                    <span className="text-gray-500 text-xs text-center block">Heatmap not generated</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                            <span className="text-sm font-semibold text-blue-900">AI Detection</span>
                                            <span className="text-sm font-bold text-blue-800">{caseDetail.ai_result?.prediction_label || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                            <span className="text-sm text-muted-foreground">Risk Category</span>
                                            <Badge
                                                className={`
                                                    ${caseDetail.ai_result?.risk_level === 'HIGH' ? 'bg-red-100 text-red-700 hover:bg-red-200' : ''}
                                                    ${caseDetail.ai_result?.risk_level === 'MODERATE' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : ''}
                                                    ${caseDetail.ai_result?.risk_level === 'LOW' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}
                                                `}
                                                variant="outline"
                                            >
                                                {caseDetail.ai_result?.risk_level || "UNKNOWN"} RISK
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center text-sm px-2 border-b pb-3">
                                            <span className="text-muted-foreground">Confidence Score</span>
                                            <span className="font-mono font-medium">
                                                {(caseDetail.ai_result?.confidence * 100).toFixed(1)}%
                                            </span>
                                        </div>

                                        <div className="pt-2 space-y-3 px-2">
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="report-lang" className="text-xs text-muted-foreground">Report Language:</Label>
                                                <select
                                                    id="report-lang"
                                                    value={selectedLang}
                                                    onChange={(e) => setSelectedLang(e.target.value)}
                                                    className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {LANGUAGES.map((lang) => (
                                                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <Button asChild variant="outline" size="sm" className="w-full gap-2 text-indigo-700 border-indigo-200 hover:bg-indigo-50">
                                                <a
                                                    href={`http://127.0.0.1:8000/api/practitioner/tests/${caseDetail.id}/report/?lang=${selectedLang}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                    View Diagnostic Report
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Clinical Context */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Stethoscope className="h-5 w-5 text-green-600" />
                                Clinical Context
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {caseDetail.clinical_context ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-muted/30 rounded-lg space-y-1">
                                            <p className="text-xs font-semibold uppercase text-muted-foreground">Symptoms</p>
                                            <div className="flex flex-wrap gap-1">
                                                {Object.entries(caseDetail.clinical_context.symptoms || {}).map(([key, val]) => (
                                                    val && <Badge key={key} variant="secondary" className="text-xs">{key.replace(/_/g, ' ')}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-muted/30 rounded-lg space-y-1">
                                            <p className="text-xs font-semibold uppercase text-muted-foreground">Vitals</p>
                                            <div className="gird grid-cols-2 gap-x-4 text-sm">
                                                {Object.entries(caseDetail.clinical_context.vitals || {}).map(([key, val]) => (
                                                    <div key={key} className="flex justify-between">
                                                        <span className="text-muted-foreground capitalize">{key}:</span>
                                                        <span>{val}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-muted/30 rounded-lg space-y-1">
                                        <p className="text-xs font-semibold uppercase text-muted-foreground">Patient History</p>
                                        <p className="text-sm text-muted-foreground">
                                            {/* Render simplified history or check JSON structure */}
                                            {JSON.stringify(caseDetail.clinical_context.history || "No history available").slice(0, 100)}...
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No clinical context provided.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Actions */}
                <div className="space-y-6">
                    {/* Review Action or Summary */}
                    {caseDetail.review_details ? (
                        <Card className="border-l-4 border-l-green-600 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileCheck className="h-5 w-5 text-green-600" />
                                    Review Submitted
                                </CardTitle>
                                <CardDescription>
                                    You reviewed this case {formatDistanceToNow(new Date(caseDetail.review_details.reviewed_at), { addSuffix: true })}.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs uppercase font-semibold">Decision</Label>
                                    <div>
                                        <Badge variant={
                                            caseDetail.review_details.decision === 'CONFIRM_AI' ? 'default' :
                                                caseDetail.review_details.decision === 'OVERRIDE' ? 'destructive' : 'secondary'
                                        }>
                                            {caseDetail.review_details.decision}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs uppercase font-semibold">Clinical Notes</Label>
                                    <div className="p-3 bg-muted/40 rounded-md text-sm whitespace-pre-wrap">
                                        {caseDetail.review_details.notes || "No notes provided."}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-l-4 border-l-blue-600 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileCheck className="h-5 w-5" />
                                    Review & Diagnosis
                                </CardTitle>
                                <CardDescription>
                                    Verify AI results and provide your formal diagnosis.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Decision</Label>
                                    <Select value={reviewDecision} onValueChange={setReviewDecision}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select decision" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CONFIRM_AI">Confirm AI Result</SelectItem>
                                            <SelectItem value="OVERRIDE">Override / Correct Result</SelectItem>
                                            <SelectItem value="RECOMMEND_TESTS">Recommend Further Testing</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Clinical Notes</Label>
                                    <Textarea
                                        placeholder="Add your observations, diagnosis, and recommendations here..."
                                        className="min-h-[120px]"
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={handleReviewSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        "Submit Diagnosis"
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {/* Disclaimer Card */}
                    <Alert className="bg-blue-50 text-blue-900 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertTitle>Important</AlertTitle>
                        <AlertDescription className="text-xs mt-1">
                            Your review is legally binding. Please ensure you have examined the original raw scans and patient history before submitting.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        </div>
    );
};

export default CaseDetail;
