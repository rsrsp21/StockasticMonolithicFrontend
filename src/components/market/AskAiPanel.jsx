import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, MessageSquareText, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { askMarketAi } from '../../api/marketAiApi';
import { cn } from '../../utils/utils';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Textarea } from '../ui/textarea';

const QUICK_PROMPTS = [
    'What are the top gainers right now?',
    'Summarize the strongest buy ideas today.',
    'Which losers look weakest from current market data?',
];

const getErrorMessage = (error) =>
    error?.response?.data?.message ||
    error?.message ||
    'Unable to get an AI market answer right now.';

const AskAiPanel = () => {
    const [query, setQuery] = useState('');
    const [lastResponse, setLastResponse] = useState(null);
    const textareaRef = useRef(null);

    const aiMutation = useMutation({
        mutationFn: askMarketAi,
        onSuccess: (data) => {
            setLastResponse(data);
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    const handleAsk = async (promptOverride) => {
        const nextQuery = (promptOverride ?? query).trim();

        if (!nextQuery) {
            toast.error('Enter a stock-market question before asking AI.');
            return;
        }

        if (nextQuery.length < 8) {
            toast.error('Ask a slightly more specific market question.');
            return;
        }

        await aiMutation.mutateAsync({
            query: nextQuery,
        });

        if (promptOverride) {
            setQuery(promptOverride);
        }
    };

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) {
            return;
        }

        textarea.style.height = '0px';
        const nextHeight = Math.min(textarea.scrollHeight, 220);
        textarea.style.height = `${Math.max(nextHeight, 56)}px`;
    }, [query]);

    return (
        <Card
            variant="default"
            className="overflow-hidden border-border/60 bg-card shadow-sm"
        >
            <CardContent className="space-y-6 p-5 sm:p-7">
                <div className="space-y-3 rounded-[28px] border border-border/70 bg-background p-5 shadow-sm">
                    <p className="text-sm font-semibold text-foreground">What do you want to know?</p>
                    <div className="relative rounded-[26px] border border-border/70 bg-muted/20 px-4 py-3 pr-36 transition-colors focus-within:bg-background">
                        <Textarea
                            ref={textareaRef}
                            rows={1}
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Example: Compare TCS and INFY today. Who looks stronger from current market data?"
                            className="min-h-[56px] resize-none border-0 bg-transparent px-0 py-0 text-sm leading-7 shadow-none outline-none ring-0 ring-offset-0 placeholder:text-muted-foreground/80 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                        />

                        <Button
                            onClick={() => handleAsk()}
                            disabled={aiMutation.isPending}
                            className="absolute bottom-3 right-3 h-11 rounded-full px-4"
                        >
                            {aiMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Asking
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Ask AI
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        <MessageSquareText className="h-3.5 w-3.5" />
                        Quick prompts
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                    {QUICK_PROMPTS.map((prompt) => (
                        <button
                            key={prompt}
                            type="button"
                            onClick={() => handleAsk(prompt)}
                            disabled={aiMutation.isPending}
                            className={cn(
                                'rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground transition-all',
                                'hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:text-foreground',
                                aiMutation.isPending && 'cursor-not-allowed opacity-60'
                            )}
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
                </div>

                {lastResponse && (
                    <div className="rounded-[28px] border border-border/70 bg-muted/20 p-5 sm:p-6">
                        <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            AI answer
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/95">
                            {lastResponse.answer}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default AskAiPanel;
