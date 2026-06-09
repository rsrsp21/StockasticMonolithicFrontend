import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";

export function Footer() {
    return (
        <footer className="relative py-6 px-4 lg:px-8 border-t border-border/30 mt-auto">
            <div className="container mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="Stockastic" className="h-6 w-6 object-contain opacity-80" />
                        <span className="font-semibold text-foreground/80 text-sm">Stockastic</span>
                    </div>

                    <div className="flex items-center gap-6 text-xs text-muted-foreground">
                        <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                        <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                        <Link to="/support" className="hover:text-foreground transition-colors">Support</Link>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} Stockastic
                    </p>
                </div>
            </div>
        </footer>
    );
}
