import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { usePageTitle } from "../hooks/usePageTitle";

const Privacy = () => {
    usePageTitle("Privacy Policy");
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background elements to match the theme */}
            <div className="gradient-orb gradient-orb-1 opacity-20" />
            <div className="gradient-orb gradient-orb-2 opacity-20" />
            <div className="noise-bg fixed inset-0 pointer-events-none z-0" />

            <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
                <Button
                    variant="ghost"
                    className="mb-6 hover:bg-white/10"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>

                <div className="glass-card p-8 rounded-xl border border-white/10">
                    <h1 className="text-3xl font-bold mb-6 text-foreground">Privacy Policy</h1>

                    <div className="space-y-6 text-muted-foreground">
                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
                            <p>We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with us. This may include your name, email address, and financial information necessary for the service.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
                            <p>We use the information we collect to provide, maintain, and improve our services, including processing transactions, authenticating users, and analyzing usage patterns.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-3">3. Data Security</h2>
                            <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-3">4. Cookies and Tracking</h2>
                            <p>We use cookies and similar technologies to track activity on our service and hold certain information to enhance your experience.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-3">5. Contact Us</h2>
                            <p>If you have any questions about this Privacy Policy, please contact us at privacy@stockastic.com.</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Privacy;
