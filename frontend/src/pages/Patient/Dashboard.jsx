import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  InfoIcon,
  ShieldCheckIcon,
  HandshakeIcon,
  UserCircleIcon,
  ClipboardCheckIcon,
  ArrowRightIcon,
  ActivityIcon,
  HeartPulseIcon,
} from "lucide-react"

const Dashboard = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Section 1: Welcome & Context */}
      <section className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold tracking-wide border border-primary/20">
          <ActivityIcon size={14} />
          <span>Patient Portal v1.0</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Welcome to <span className="text-primary">Swasthya-Setu</span>
          </h1>
          <p className="text-xl text-slate-500 font-medium">
            Your gateway to AI-assisted, doctor-supervised healthcare
          </p>
        </div>
        <p className="text-lg text-slate-600 leading-relaxed">
          Swasthya-Setu connects you with verified diagnostic centers where tests are conducted with utmost care. Our
          advanced AI assists qualified doctors in analyzing medical images, ensuring a precise and reliable diagnosis.
          Patient safety and privacy are our top priorities.
        </p>
      </section>

      {/* Section 2: Government Health Awareness */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Government Health Initiatives</h2>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="group relative overflow-hidden bg-blue-50/50 border-blue-100 hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <HeartPulseIcon size={80} className="text-blue-600" />
            </div>
            <CardHeader className="relative pb-2">
              <CardTitle className="text-blue-700 font-bold">Ayushman Bharat – PM-JAY</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-blue-800/80 leading-relaxed font-medium">
                Provides health coverage up to ₹5 lakh per family per year for secondary and tertiary care.
              </p>
              <div className="mt-4 flex items-center text-xs font-bold text-blue-600 uppercase tracking-widest gap-1 cursor-pointer hover:gap-2 transition-all">
                Learn More <ArrowRightIcon size={12} />
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-emerald-50/50 border-emerald-100 hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <UserCircleIcon size={80} className="text-emerald-600" />
            </div>
            <CardHeader className="relative pb-2">
              <CardTitle className="text-emerald-700 font-bold">ABHA Health Account</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-emerald-800/80 leading-relaxed font-medium">
                A unique digital health ID that enables seamless access to your medical records across providers.
              </p>
              <div className="mt-4 flex items-center text-xs font-bold text-emerald-600 uppercase tracking-widest gap-1 cursor-pointer hover:gap-2 transition-all">
                Manage ID <ArrowRightIcon size={12} />
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-indigo-50/50 border-indigo-100 hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <ClipboardCheckIcon size={80} className="text-indigo-600" />
            </div>
            <CardHeader className="relative pb-2">
              <CardTitle className="text-indigo-700 font-bold">Preventive Care Awareness</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <ul className="space-y-2 text-indigo-800/80 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>Regular screening saves lives through early detection.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>Early diagnosis significantly improves treatment outcomes.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 3: How Swasthya-Setu Works */}
      <section className="bg-slate-50/50 rounded-3xl p-8 lg:p-12 border border-slate-100">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">How Swasthya-Setu Works</h2>
          <p className="text-slate-500">Your journey from diagnostic to trusted report</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {[
            { icon: InfoIcon, text: "1. Visit a diagnostic center", color: "bg-slate-100 text-slate-600" },
            { icon: HandshakeIcon, text: "2. Practitioner uploads verified data", color: "bg-blue-100 text-blue-600" },
            { icon: ShieldCheckIcon, text: "3. AI analyzes medical images", color: "bg-emerald-100 text-emerald-600" },
            {
              icon: UserCircleIcon,
              text: "4. Doctor reviews and confirms results",
              color: "bg-indigo-100 text-indigo-600",
            },
            { icon: ClipboardCheckIcon, text: "5. Patient views final report", color: "bg-purple-100 text-purple-600" },
          ].map((step, i) => (
            <Card key={i} className="border-none bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className={`p-3 rounded-2xl ${step.color}`}>
                  <step.icon size={24} />
                </div>
                <p className="font-bold text-slate-800 text-sm leading-snug">{step.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Section 4: Quick Guidance */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">What can you do next?</h2>
          <Card className="bg-white border-slate-100 shadow-sm overflow-hidden group">
            <CardContent className="p-0">
              <div className="p-6 space-y-4 font-medium text-slate-600">
                {[
                  "View your latest diagnostic tests",
                  "Track active doctor referrals",
                  "Update your profile and health history",
                  "Contact healthcare providers if advised",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 group/item">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300 group-hover/item:bg-primary transition-colors" />
                    <span className="group-hover/item:text-slate-900 transition-colors">{item}</span>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-center">
                <Button variant="link" className="text-primary font-bold">
                  View Full Portal Actions <ArrowRightIcon size={14} className="ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 5: Disclaimer & Trust */}
        <section className="space-y-6 flex flex-col">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Standards</h2>
          <Card className="flex-1 bg-primary text-white border-none shadow-lg shadow-primary/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <CardContent className="p-8 space-y-6 relative">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-white/20">
                  <InfoIcon size={20} />
                </div>
                <p className="font-semibold text-lg leading-snug">
                  AI outputs are advisory and always reviewed by qualified doctors before being finalized.
                </p>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-white/20">
                  <ShieldCheckIcon size={20} />
                </div>
                <p className="font-semibold text-lg leading-snug">
                  This platform follows strict ethical AI and healthcare data standards (DISHA & GDPR).
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}

export default Dashboard
