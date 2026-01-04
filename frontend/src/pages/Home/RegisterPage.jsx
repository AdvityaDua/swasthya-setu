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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Loader2 } from "lucide-react";
import { useRegisterMutation } from "../../app/api/userApiSlice";

function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [abhaId, setAbhaId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const [register, { isLoading, error }] = useRegisterMutation();

  useEffect(() => {
    if (error) {
      if (error.data) {
        setErrorMessage(error.data.detail || error.data.phone?.[0] || "Registration failed. Please try again.");
      } else if (error.status === "FETCH_ERROR") {
        setErrorMessage("Network error. Please check your internet connection.");
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
      setSuccessMessage("");
    } else {
      setErrorMessage("");
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!fullName || !phone || !role || !password) {
      setErrorMessage("Full Name, Phone Number, Role, and Password are required.");
      return;
    }

    try {
      const userData = await register({
        full_name: fullName,
        phone,
        email: email || null,
        role,
        abha_id: abhaId || null,
        password,
      }).unwrap();
      setSuccessMessage("Registration successful! You can now log in.");
      setFullName("");
      setPhone("");
      setEmail("");
      setRole("");
      setAbhaId("");
      setPassword("");
      
      // Add a delay to show success before navigating
      setTimeout(() => {
        navigate("/login");
      }, 2000); // 2 second delay
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <article className="flex-1 flex items-center justify-center py-8 bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Register</CardTitle>
            <CardDescription>
              Create your account to get started with Swasthya Setu.
            </CardDescription>
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
                <Alert variant="success" className="bg-green-100 border-green-400 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-200">
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}
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
                  <SelectTrigger id="role">
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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Button variant="link" className="p-0 h-auto">
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