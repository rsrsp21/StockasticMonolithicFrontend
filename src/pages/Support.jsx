import { ArrowLeft, Mail, MessageSquare, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import { MESSAGES } from "../utils/constants/messages";
import { usePageTitle } from "../hooks/usePageTitle";

const Support = () => {
    usePageTitle("Help & Support");
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        toast.success(MESSAGES.SUPPORT.TICKET_SUBMITTED);
    };

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

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold mb-4 text-foreground">Help & Support</h1>
                            <p className="text-muted-foreground">
                                Have questions or need assistance? Our team is here to help you with your trading journey.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="glass-card p-6 rounded-xl border border-white/10 flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                                    <Mail className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Email Us</h3>
                                    <p className="text-sm text-muted-foreground mb-2">For general inquiries and support</p>
                                    <a href="mailto:support@stockastic.com" className="text-primary hover:underline">support@stockastic.com</a>
                                </div>
                            </div>

                            <div className="glass-card p-6 rounded-xl border border-white/10 flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                                    <MessageSquare className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Live Chat</h3>
                                    <p className="text-sm text-muted-foreground mb-2">Chat with our support team</p>
                                    <span className="text-sm text-green-400">Available Mon-Fri, 9am-5pm IST</span>
                                </div>
                            </div>

                            <div className="glass-card p-6 rounded-xl border border-white/10 flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                                    <Phone className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Phone Support</h3>
                                    <p className="text-sm text-muted-foreground mb-2">Urgent account issues</p>
                                    <a href="tel:+15550123456" className="text-primary hover:underline">+91 8247830899</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-8 rounded-xl border border-white/10">
                        <h2 className="text-xl font-semibold mb-6 text-foreground">Send us a message</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                                <Input placeholder="Enter your full name" required className="bg-white/5 border-white/10" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                                <Input type="email" placeholder="Enter your email" required className="bg-white/5 border-white/10" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Topic</label>
                                <Input placeholder="What is this about?" required className="bg-white/5 border-white/10" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Message</label>
                                <Textarea
                                    placeholder="Describe your issue..."
                                    className="min-h-[120px] bg-white/5 border-white/10"
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full">
                                Send Message
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Support;
