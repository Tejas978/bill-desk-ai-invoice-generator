import React from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Footer from "../components/Footer";
import Pricing from "../components/Pricing";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased">
      <Navbar />
      <main className="">
        <Hero />
        <div className=" ">
          <Features />
        </div>
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
