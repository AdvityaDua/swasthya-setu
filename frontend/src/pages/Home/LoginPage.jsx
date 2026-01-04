import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../app/api/userApiSlice";
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
import { Button } from "../../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { login as loginAction } from "../../app/slices/userSlice";
const LoginPage = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading, error }] = useLoginMutation();
  const user = useSelector((state) => state.user);
  useEffect(() => {
    if (user.role === "PATIENT") {
      navigate("/patient"); 
    }
    else if (user.role === "DOCTOR") {
      navigate("/doctor");
    }
    else if (user.role === "PRACTITIONER") {
      navigate("/practitioner");
    }
  }, []);
  useEffect(() => {
    if (error) {
      if (error.data) {
        setErrorMessage(error.data.detail || "Login failed. Please try again.");
      } else if (error.status === "FETCH_ERROR") {
        setErrorMessage("Network error. Please check your internet connection.");
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
      setSuccessMessage("");
    } else {
      setErrorMessage("");
      setSuccessMessage("");
    }
  }, [error]);
  useEffect(() => {
    
    }, [])
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (!phone || !password) {
      setErrorMessage("Phone number and password are required.");
      return;
    }

    try {
      const userData = await login({ phone, password }).unwrap();
      dispatch(loginAction(userData));
      setSuccessMessage("Login successful! You are being redirected to your dashboard.");
      setPhone("");
      setPassword("");      
      // Add a delay to show success before navigating
      setTimeout(() => {
        navigate("/patient");
      }, 2000); // 2 second delay
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <article className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-900 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Login</CardTitle>
            <CardDescription>
              Enter your phone number and password to access your account.
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
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="text"
                  placeholder="e.g., 9876543210"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Button variant="link" className="p-0 h-auto">
                <NavLink to="/register">Register</NavLink>
              </Button>
            </p>
          </CardFooter>
        </Card>
      </article>
      <Footer />
    </main>
  );
};

export default LoginPage;