import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SkeletonStockDetail } from "../components/ui/skeleton";
import { getStockById } from "../services/stockPriceService";
import { isInternationalExchange } from "../utils/marketType";
import StockDetailDomestic from "./StockDetailDomestic";
import StockDetailInternational from "./StockDetailInternational";

export default function StockDetail() {
    const { stockId } = useParams();

    const { data: stock, isLoading } = useQuery({
        queryKey: ["stockRouteType", stockId],
        queryFn: () => getStockById(stockId),
        enabled: !!stockId,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    if (isLoading) {
        return <SkeletonStockDetail />;
    }

    if (isInternationalExchange(stock?.exchange)) {
        return <StockDetailInternational />;
    }

    return <StockDetailDomestic />;
}
