import React from "react";
import { Link } from "react-router-dom";
import { useGetDoctorDashboardStatsQuery, useGetDoctorReferralsQuery } from "../../app/api/doctorApiSlice";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Loader2, AlertCircle, FileText, CheckCircle, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { formatDistanceToNow } from "date-fns";

const Dashboard = () => {
    const { data: stats, isLoading: statsLoading, error: statsError } = useGetDoctorDashboardStatsQuery();
    const { data: referrals, isLoading: referralsLoading, error: referralsError } = useGetDoctorReferralsQuery();

    const isLoading = statsLoading || referralsLoading;
    const error = statsError || referralsError;

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Failed to load dashboard data. Please try again.</AlertDescription>
            </Alert>
        );
    }

    // Get first 5 pending referrals
    const recentReferrals = referrals?.slice(0, 5) || [];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground mt-2">Welcome back, Doctor. Here's your daily overview.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Referrals</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center dark:bg-blue-900/20">
                            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.pending_referrals_count || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Cases waiting for review</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reviewed Today</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center dark:bg-green-900/20">
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.reviewed_today_count || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Cases processed today</p>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Referrals List */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 border-none shadow-md">
                    <CardHeader>
                        <CardTitle>Recent Referrals</CardTitle>
                        <CardDescription>
                            Latest cases assigned to you for review.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {recentReferrals.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                        <FileText className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground">No pending referrals.</p>
                                </div>
                            ) : (
                                recentReferrals.map((referral) => (
                                    <div key={referral.id} className="flex items-center justify-between group">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">{referral.patient_name}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Badge variant="secondary" className="text-[10px] uppercase">{referral.test_type}</Badge>
                                                <span>•</span>
                                                <span className={referral.urgency === 'HIGH' ? 'text-destructive font-medium' : ''}>{referral.urgency}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(referral.created_at), { addSuffix: true })}
                                            </div>
                                            <Button asChild size="sm" variant="ghost" className="hover:bg-primary/10 hover:text-primary">
                                                <Link to={`/doctor/cases/${referral.test_id}`}>Review</Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {recentReferrals.length > 0 && (
                            <div className="mt-6 pt-6 border-t">
                                <Button asChild variant="outline" className="w-full">
                                    <Link to="/doctor/referrals">View All Pending Referrals</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Ethical AI Disclaimer */}
                <Card className="col-span-3 h-fit bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                            <AlertCircle className="h-5 w-5" />
                            Ethical AI Use
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground space-y-4">
                            <p>
                                <strong className="text-foreground">AI is Assistive, Not Authoritative.</strong> The AI models provided in this dashboard are designed to support your clinical judgment, not replace it.
                            </p>
                            <p>
                                Always review the original diagnostic images and patient context before confirming any diagnosis.
                            </p>
                            <ul className="space-y-2 mt-2">
                                <li className="flex items-start gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5" />
                                    <span>Verify AI-highlighted regions (heatmaps).</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5" />
                                    <span>Consider patient history and vitals.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5" />
                                    <span>You have the final say (Confirm/Override).</span>
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
