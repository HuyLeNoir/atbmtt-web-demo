import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import FeaturesSection from "../components/features";
import KeyGenSection from "../components/keygen";
import ControlTab from "@/components/tab";
export default function App() {
    return (
        <div className="w-full flex flex-col">
            <Navigation className="w-full"></Navigation>
            <div className="Content col-span-12 mx-10 mt-10">
                <HeroSection className="col-span-12 gap-5"></HeroSection>
                <FeaturesSection></FeaturesSection>
                <KeyGenSection></KeyGenSection>
                <ControlTab />
            </div>
        </div>
    );
}
