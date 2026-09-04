import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";

export default function Home() {
  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />

      {/* Footer */}
      <footer className="bg-gray-50 h-32 flex items-center justify-center border-t border-gray-200">
        <p className="text-gray-500">© 2026 Youva EdAi. All rights reserved.</p>
      </footer>
    </div>
  );
}
