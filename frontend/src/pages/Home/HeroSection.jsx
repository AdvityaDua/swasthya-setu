import { Button } from "@/components/ui/button"
import { ArrowRight, ShieldCheck } from "lucide-react"

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 md:pb-28">
      {/* Subtle Background Elements */}
      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col gap-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-primary/5 text-primary border border-primary/20 px-3 py-1 rounded-full w-fit mx-auto lg:mx-0 text-sm font-medium">
            <ShieldCheck size={16} />
            <span>Official Government Initiative</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
            Swasthya-Setu: <span className="text-primary">AI-Assisted</span> Healthcare with Human Oversight
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Revolutionizing healthcare delivery through intelligent AI triage and dedicated doctor supervision. Bridging
            the gap between technology and traditional medicine for every citizen.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
            <Button size="lg" className="px-8 h-12 text-base font-semibold">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="px-8 h-12 text-base font-semibold bg-transparent">
              Learn More
            </Button>
          </div>

          <div className="flex items-center justify-center lg:justify-start gap-8 mt-8 opacity-70 grayscale">
            {/* PLACEHOLDER: ABHA / Ayushman Bharat logo */}
            <img
              src="/home/ayushman.png"
              width="120px"
              height="40px"
              alt="Ayushman Bharat Logo"
              className="border-none bg-transparent"
            />
            <img src="/home/abha.webp" width="100px" height="40px" alt="ABHA Logo" className="border-none bg-transparent" />
          </div>
        </div>

        <div className="relative">
          {/* PLACEHOLDER: Healthcare illustration */}
          <img
          src="/home/center.png"
            width="100%"
            height="450px"
            alt="Modern Healthcare AI Illustration with Doctors"
            className="shadow-2xl rounded-2xl border-none"
          />

          {/* Subtle Stats Overlay */}
          <div className="absolute -bottom-6 -left-6 bg-background p-4 rounded-xl shadow-lg border border-border hidden md:block">
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 p-2 rounded-lg text-accent">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">Trust Rating</p>
                <p className="text-xl font-bold">100% Secured</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
