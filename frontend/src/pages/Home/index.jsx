import React from 'react'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import HeroSection from './HeroSection'
import HowItWorks from './HowItWorks'
import WhySection from './WhySection'


function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header/>
      <article className="flex-1">
        <HeroSection />
        <HowItWorks />
        <WhySection />
      </article>
      <Footer />
    </main>
  )
}

export default HomePage