import { Sparkles } from 'lucide-react';
import AskAiPanel from '../components/market/AskAiPanel';
import { usePageTitle } from '../hooks/usePageTitle';

const AskAi = () => {
    usePageTitle('Ask AI');

    return (
        <div className="space-y-6">
            <div>
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
                        <Sparkles className="h-7 w-7 text-primary" />
                        Ask AI
                    </h1>
                    <p className="text-muted-foreground">
                        Get advisor-style market insights grounded in Stockastic data. Informational only, not personalized financial advice.
                    </p>
                </div>
            </div>

            <AskAiPanel />
        </div>
    );
};

export default AskAi;
