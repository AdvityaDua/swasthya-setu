
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useRegenerateReportMutation } from "@/app/api/practitionerApiSlice";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LANGUAGES } from "@/pages/Practitioner/TestWorkflow";

const ReportManager = ({ testId, initialLanguage = "en", reportUrl: initialReportUrl }) => {
    const [language, setLanguage] = useState(initialLanguage);

    // If we have an initial static URL, use it. Otherwise, assume standard media path if known.
    // Actually, backend now returns a full URL on regenerate. 
    // For initial load, we might rely on the prop or construct it if predictable.
    // Let's rely on state which can be updated.
    const [currentReportUrl, setCurrentReportUrl] = useState(initialReportUrl);
    // Sync state with prop updates (e.g. when parent TestWorkflow gets new AI result)

    useEffect(() => {
        if (initialReportUrl) {
            setCurrentReportUrl(initialReportUrl);
        }
    }, [initialReportUrl]);

    const [notification, setNotification] = useState(null);

    const [regenerateReport, { isLoading }] = useRegenerateReportMutation();

    const handleUpdateLanguage = async () => {
        setNotification(null);
        try {
            const res = await regenerateReport({ test_id: testId, language }).unwrap();
            setCurrentReportUrl(res.report_url);
            setNotification({
                type: "default", // or 'success' if configured, but 'default' is standard. 'destructive' for error.
                title: "Success",
                message: "Report updated successfully in " + language,
                icon: <CheckCircle2 className="h-4 w-4" />
            });
            // Auto dismiss after 3 seconds
            setTimeout(() => setNotification(null), 3000);
        } catch (err) {
            console.error(err);
            setNotification({
                type: "destructive",
                title: "Error",
                message: "Failed to update report language.",
                icon: <AlertCircle className="h-4 w-4" />
            });
        }
    };

    const handleViewReport = () => {
        setNotification(null);
        if (currentReportUrl) {
            window.open(currentReportUrl, "_blank");
        } else {
            // Fallback Construction if URL not explicitly provided yet (e.g. first load)
            // This assumes standard naming or api endpoint if we prefer to point to the file directly
            // But wait, the previous static file logic was causing issues.
            // Ideally we use the URL returned by backend. 
            // If no URL is available, we might disable the button or try a default pattern? 
            // For now, let's assume parent passes a valid url or we updated it.
            setNotification({
                type: "destructive",
                title: "Error",
                message: "Report URL not available. Please try updating the language.",
                icon: <AlertCircle className="h-4 w-4" />
            });
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-slate-50 w-full">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">Report Language:</span>
                    <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="w-[140px] h-8 text-xs bg-white">
                            <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                            {LANGUAGES.map((lang) => (
                                <SelectItem key={lang.code} value={lang.code}>
                                    {lang.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUpdateLanguage}
                    disabled={isLoading}
                    className="h-8 text-xs"
                >
                    {isLoading ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                        <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    Update
                </Button>

                <div className="h-6 w-px bg-slate-200 mx-2" />

                <Button
                    size="sm"
                    onClick={handleViewReport}
                    className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={isLoading} // Disable if no URL OR loading
                >
                    <FileText className="h-3 w-3 mr-1" />
                    View PDF
                </Button>
            </div>

            {notification && (
                <Alert variant={notification.type === "destructive" ? "destructive" : "default"} className={notification.type === "default" && "border-green-500 text-green-700"}>
                    {notification.icon}
                    <div className="ml-2">
                        <AlertTitle>{notification.title}</AlertTitle>
                        <AlertDescription>{notification.message}</AlertDescription>
                    </div>
                </Alert>
            )}
        </div>
    );
};

export default ReportManager;

