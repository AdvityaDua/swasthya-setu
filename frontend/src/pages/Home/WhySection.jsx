import { Shield, Clock, Users, Globe } from "lucide-react"

export default function WhySection() {
  const benefits = [
    {
      icon: <Shield className="text-primary" />,
      title: "Unmatched Trust",
      description: "Operated under strict government guidelines to ensure your data privacy and security.",
    },
    {
      icon: <Clock className="text-primary" />,
      title: "Instant Triage",
      description: "Reduce waiting times with AI that prioritizes urgent cases for immediate doctor review.",
    },
    {
      icon: <Users className="text-primary" />,
      title: "Human Expertise",
      description: "Every AI suggestion is verified by a human professional before reaching the patient.",
    },
    {
      icon: <Globe className="text-primary" />,
      title: "Rural Accessibility",
      description: "Bringing top-tier medical expertise to the remotest parts of the country through digital means.",
    },
  ]

  return (
    <section id="#whyChoose" className="py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="w-full lg:w-1/2 flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Why Choose Swasthya-Setu?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We combine the efficiency of artificial intelligence with the empathy and accuracy of human healthcare
                providers to create a safer medical ecosystem.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-3 p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="bg-primary/5 w-10 h-10 rounded-lg flex items-center justify-center">
                    {benefit.icon}
                  </div>
                  <h3 className="font-bold text-lg">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-1/2 bg-primary p-8 md:p-12 rounded-3xl text-primary-foreground relative overflow-hidden shadow-2xl">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

            <div className="relative z-10 flex flex-col gap-6">
              <h3 className="text-2xl md:text-3xl font-bold leading-tight">
                AI with Human Oversight: The Swasthya-Setu Model
              </h3>
              <p className="text-primary-foreground/90 text-lg leading-relaxed">
                While AI handles complex data processing and initial triage, it never makes a final clinical decision.
                Our model ensures a{" "}
                <span className="underline decoration-accent decoration-4 underline-offset-4">
                  "Doctor-in-the-Loop"
                </span>{" "}
                at every critical juncture.
              </p>
              <ul className="flex flex-col gap-4 mt-2">
                <li className="flex items-start gap-3">
                  <div className="bg-accent rounded-full p-1 mt-1 text-white">
                    <Shield size={12} />
                  </div>
                  <span>Clinical accuracy validated by licensed practitioners.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-accent rounded-full p-1 mt-1 text-white">
                    <Shield size={12} />
                  </div>
                  <span>Ethical AI guidelines strictly enforced for patient safety.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-accent rounded-full p-1 mt-1 text-white">
                    <Shield size={12} />
                  </div>
                  <span>Empathetic care that machines cannot replicate.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
