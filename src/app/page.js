import BrandHeader from "@/components/BrandHeader";
import CameraTest from "@/components/CameraTest";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <BrandHeader />
      <main className="min-h-screen pt-12 bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#16213e]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          
          {/* Hero Section */}
          <div className="text-center mb-4">
            
            
            <h1 className="text-4xl md:text-5xl font-semibold mb-4 leading-tight">
              Master interviews with{" "}
              <span className="text-gradient">AI precision</span>
            </h1>
            
            <p className="text-white/60 text-lg mb-6 max-w-2xl mx-auto">
              Practice with our intelligent interviewer. Get instant feedback. 
              Land your dream job.
            </p>
          </div>

          {/* Setup Section */}
          <div className="max-w-2xl mx-auto">
            <CameraTest />
          </div>

        </div>
      </main>
    </>
  );
}
