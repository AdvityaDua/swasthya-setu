import React, { useState, useEffect } from "react";
import { useGetDoctorProfileQuery, useUpdateDoctorProfileMutation } from "../../app/api/doctorApiSlice";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Loader2, Stethoscope, Building2, Clock, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { LocationPicker } from "../../components/LocationPicker";

const DAYS_OF_WEEK = [
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
];

const DEFAULT_TIMINGS = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = { available: false, start: "09:00", end: "17:00" };
    return acc;
}, {});

const Profile = () => {
    const { data: profile, isLoading, error, refetch } = useGetDoctorProfileQuery();
    const [updateProfile, { isLoading: isUpdating }] = useUpdateDoctorProfileMutation();

    const [formData, setFormData] = useState({
        specialization: "",
        hospital_name: "",
        registration_number: "",
        years_of_experience: "",
        is_teleconsult_available: false,
    });

    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [availabilityTimings, setAvailabilityTimings] = useState(DEFAULT_TIMINGS);

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (profile) {
            setFormData({
                specialization: profile.specialization || "",
                hospital_name: profile.hospital_name || "",
                registration_number: profile.registration_number || "",
                years_of_experience: profile.years_of_experience || "",
                is_teleconsult_available: profile.is_teleconsult_available || false,
            });
            setLatitude(profile.latitude ? Number(profile.latitude) : null);
            setLongitude(profile.longitude ? Number(profile.longitude) : null);

            // Merge existing timings with default structure to ensure all days exist
            if (profile.availability_timings) {
                setAvailabilityTimings(prev => ({ ...prev, ...profile.availability_timings }));
            }
        }
    }, [profile]);

    useEffect(() => {
        if (successMessage || errorMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage("");
                setErrorMessage("");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, errorMessage]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTimingChange = (day, field, value) => {
        setAvailabilityTimings(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [field]: value
            }
        }));
    };

    const roundTo6Decimals = (value) => {
        if (value == null) return null;
        return Number(Number(value).toFixed(6));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const payload = {
                ...formData,
                availability_timings: availabilityTimings,
                latitude: roundTo6Decimals(latitude),
                longitude: roundTo6Decimals(longitude)
            };

            await updateProfile(payload).unwrap();
            setSuccessMessage("Profile updated successfully!");
            refetch();
        } catch (err) {
            console.error(err);
            setErrorMessage("Failed to update profile. Please try again.");
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
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Failed to load profile. Please refresh the page.</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-10">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Doctor Profile</h1>
                <p className="text-muted-foreground">Manage your professional details, availability, and location.</p>
            </div>

            {successMessage && (
                <Alert className="bg-green-100 border-green-400 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
            )}

            {errorMessage && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Professional Details */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Stethoscope className="h-5 w-5 text-blue-600" />
                                Professional Details
                            </CardTitle>
                            <CardDescription>Your medical credentials and workplace info.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="specialization">Specialization</Label>
                                <Select
                                    value={formData.specialization}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, specialization: val }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Specialization" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TB">Tuberculosis</SelectItem>
                                        <SelectItem value="ONCOLOGY">Oncology</SelectItem>
                                        <SelectItem value="GENERAL">General Medicine</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="registration_number">Registration Number</Label>
                                <Input
                                    id="registration_number"
                                    name="registration_number"
                                    value={formData.registration_number}
                                    onChange={handleChange}
                                    placeholder="Medical Council Registration"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="hospital_name">Hospital / Clinic Name</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9"
                                        id="hospital_name"
                                        name="hospital_name"
                                        value={formData.hospital_name}
                                        onChange={handleChange}
                                        placeholder="Hospital Name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="years_of_experience">Years of Experience</Label>
                                <Input
                                    id="years_of_experience"
                                    name="years_of_experience"
                                    type="number"
                                    value={formData.years_of_experience}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>

                            <div className="flex items-center justify-between space-x-2 border p-3 rounded-lg md:col-span-2">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Teleconsultation Available</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Enable if you accept video consultation requests.
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.is_teleconsult_available}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_teleconsult_available: checked }))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Weekly Availability */}
                    <Card className="md:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-green-600" />
                                Weekly Schedule
                            </CardTitle>
                            <CardDescription>Set your standard availability hours.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {DAYS_OF_WEEK.map((day) => (
                                <div key={day} className="flex flex-col gap-2 border-b pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id={`avail-${day}`}
                                                checked={availabilityTimings[day]?.available}
                                                onCheckedChange={(checked) => handleTimingChange(day, "available", checked)}
                                            />
                                            <Label htmlFor={`avail-${day}`} className="capitalize font-medium">
                                                {day}
                                            </Label>
                                        </div>
                                    </div>
                                    {availabilityTimings[day]?.available && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <Input
                                                type="time"
                                                className="h-8 text-sm"
                                                value={availabilityTimings[day]?.start}
                                                onChange={(e) => handleTimingChange(day, "start", e.target.value)}
                                            />
                                            <span className="text-muted-foreground">-</span>
                                            <Input
                                                type="time"
                                                className="h-8 text-sm"
                                                value={availabilityTimings[day]?.end}
                                                onChange={(e) => handleTimingChange(day, "end", e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Location with Map */}
                    <Card className="md:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-red-600" />
                                Clinic Location
                            </CardTitle>
                            <CardDescription>Pin your clinic location on the map.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-sm text-muted-foreground">
                                Click on the map or search to set your clinic's precise location.
                            </div>
                            <LocationPicker
                                latitude={latitude}
                                longitude={longitude}
                                onChange={(lat, lng) => {
                                    setLatitude(lat);
                                    setLongitude(lng);
                                }}
                                height="400px"
                            />

                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isUpdating} size="lg" className="w-full md:w-auto">
                        {isUpdating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving Changes...
                            </>
                        ) : (
                            "Save Profile"
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default Profile;
