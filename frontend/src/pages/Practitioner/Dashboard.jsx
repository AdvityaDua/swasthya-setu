import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { Search, FilePlus, UploadCloud, FlaskConical, Stethoscope } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="space-y-8">
      {/* Section 1: Welcome & Context */}
      <section className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Welcome, Practitioner!</h1>
        <p className="text-lg text-muted-foreground">
          Your essential platform for managing diagnostic workflows
        </p>
        <p className="text-base text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
          As a valued practitioner on Swasthya-Setu, you play a critical role in the digital healthcare journey.
          This portal empowers you to efficiently manage patient diagnostic tests, from initial creation and
          image upload to AI inference and doctor referrals. Our streamlined workflow ensures accuracy and
          expedited patient care.
        </p>
      </section>

      <Separator />

      {/* Section 2: Practitioner Workflow Steps */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Your Workflow at a Glance</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 text-center">
          <Card className="bg-blue-50 border-blue-200 shadow-sm">
            <CardContent className="p-4 flex flex-col items-center">
              <Search className="h-10 w-10 text-blue-600 mb-3" />
              <p className="font-semibold text-lg">1. Search Patient</p>
              <p className="text-sm text-blue-800">Find existing patients by phone or ABHA ID.</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200 shadow-sm">
            <CardContent className="p-4 flex flex-col items-center">
              <FilePlus className="h-10 w-10 text-green-600 mb-3" />
              <p className="font-semibold text-lg">2. Create Test</p>
              <p className="text-sm text-green-800">Initiate a new diagnostic test for a patient.</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200 shadow-sm">
            <CardContent className="p-4 flex flex-col items-center">
              <UploadCloud className="h-10 w-10 text-yellow-600 mb-3" />
              <p className="font-semibold text-lg">3. Upload Data</p>
              <p className="text-sm text-yellow-800">Upload relevant diagnostic images.</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200 shadow-sm">
            <CardContent className="p-4 flex flex-col items-center">
              <FlaskConical className="h-10 w-10 text-purple-600 mb-3" />
              <p className="font-semibold text-lg">4. Run AI Inference</p>
              <p className="text-sm text-purple-800">Initiate AI analysis of the uploaded images.</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200 shadow-sm">
            <CardContent className="p-4 flex flex-col items-center">
              <Stethoscope className="h-10 w-10 text-red-600 mb-3" />
              <p className="font-semibold text-lg">5. Refer to Doctor</p>
              <p className="text-sm text-red-800">Refer the case to a doctor for final review.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;

