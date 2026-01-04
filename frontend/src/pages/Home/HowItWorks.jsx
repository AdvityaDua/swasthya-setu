import { User, ClipboardList, Stethoscope } from "lucide-react"

export default function HowItWorks() {
  const steps = [
    {
      icon: <User className="w-8 h-8" />,
      title: "Patient Inquiry",
      description: "Patients input their symptoms and health history through our secure AI interface.",
    },
    {
      icon: <ClipboardList className="w-8 h-8" />,
      title: "Practitioner Review",
      description: "Health practitioners review the AI-analyzed data for accuracy and context.",
    },
    {
      icon: <Stethoscope className="w-8 h-8" />,
      title: "Doctor Oversight",
      description: "Qualified doctors provide the final diagnosis and treatment plan with human expertise.",
    },
  ]

  return (
    <section id="#howItWorks" className="py-20 bg-[#f8f9fa]">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">How It Works</h2>
          <div className="h-1.5 w-20 bg-primary mx-auto rounded-full mb-6"></div>
          <p className="text-muted-foreground text-lg">
            Our multi-tier verification system ensures that every diagnosis is backed by both cutting-edge technology
            and experienced medical professionals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 z-0"></div>

          {steps.map((step, index) => (
            <div
              key={index}
              className="relative z-10 flex flex-col items-center text-center bg-background p-8 rounded-2xl shadow-sm border border-border group hover:border-primary/50 transition-colors"
            >
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              <div className="mt-4 text-primary font-bold text-lg opacity-20">0{index + 1}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
