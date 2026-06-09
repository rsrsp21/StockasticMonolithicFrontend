import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { usePageTitle } from "../hooks/usePageTitle";

const Terms = () => {
    usePageTitle("Terms of Service");
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
                    <h1 className="text-3xl font-bold mb-6 text-foreground">Terms of Service</h1>

                    <div className="space-y-6 text-muted-foreground">
                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
                            <p>By accessing or using our service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-3">2. Accounts</h2>
                            <p>When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-3">3. Intellectual Property</h2>
                            <p>The Service and its original content, features, and functionality are and will remain the exclusive property of Stockastic and its licensors.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-3">4. Termination</h2>
                            <p>We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-3">5. Limitation of Liability</h2>
                            <p>In no event shall Stockastic, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages.</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Terms;
