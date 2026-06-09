const DOMESTIC_EXCHANGES = new Set(["NSE", "BSE"]);

export const isInternationalExchange = (exchange) => {
    if (!exchange) return false;
    return !DOMESTIC_EXCHANGES.has(String(exchange).trim().toUpperCase());
};

export const getMarketTypeForExchange = (exchange) =>
    isInternationalExchange(exchange) ? "international" : "domestic";
