import { useEffect, useRef, useState } from 'react';
import { getWebSocketEndpoint } from '../utils/websocket';

/**
 * Hook to subscribe to multiple stock price updates over a single WebSocket connection.
 * @param {Array<number>} stockIds - List of stock IDs to subscribe to
 * @param {boolean} enabled - Whether to connect
 */
export function useMultipleStocksWebSocket(stockIds = [], enabled = true) {
    const [prices, setPrices] = useState({}); // Map: stockId -> price object
    const [connected, setConnected] = useState(false);
    const socketsRef = useRef({}); // Map: stockId -> WebSocket
    const reconnectRefs = useRef({}); // Map: stockId -> timeoutId
    const shouldReconnectRef = useRef(true);

    useEffect(() => {
        if (!enabled) return;
        shouldReconnectRef.current = true;

        const socketUrl = getWebSocketEndpoint();
        const activeIds = new Set(stockIds.map(id => String(id)));

        const connectSocket = (idStr) => {
            const url = `${socketUrl}${socketUrl.includes('?') ? '&' : '?'}stockId=${encodeURIComponent(idStr)}`;
            const socket = new WebSocket(url);
            socketsRef.current[idStr] = socket;

            socket.onopen = () => {
                setConnected(true);
            };

            socket.onmessage = (event) => {
                try {
                    const priceData = JSON.parse(event.data);
                    setPrices(prev => ({
                        ...prev,
                        [idStr]: priceData
                    }));
                } catch (e) {
                    console.error(`Error parsing price for stock ${idStr}`, e);
                }
            };

            socket.onclose = () => {
                if (shouldReconnectRef.current) {
                    reconnectRefs.current[idStr] = setTimeout(() => {
                        connectSocket(idStr);
                    }, 5000);
                }
            };

            socket.onerror = (err) => {
                console.error('WebSocket error:', err);
            };
        };

        // Close sockets for removed ids
        Object.keys(socketsRef.current).forEach(idStr => {
            if (!activeIds.has(idStr)) {
                const sock = socketsRef.current[idStr];
                if (sock) {
                    sock.close();
                }
                delete socketsRef.current[idStr];
                if (reconnectRefs.current[idStr]) {
                    clearTimeout(reconnectRefs.current[idStr]);
                    delete reconnectRefs.current[idStr];
                }
                setPrices(prev => {
                    const next = { ...prev };
                    delete next[idStr];
                    return next;
                });
            }
        });

        // Open sockets for new ids
        stockIds.forEach(id => {
            const idStr = String(id);
            if (socketsRef.current[idStr]) {
                return;
            }
            connectSocket(idStr);
        });

        return () => {
            shouldReconnectRef.current = false;
            Object.values(reconnectRefs.current).forEach(timeoutId => clearTimeout(timeoutId));
            reconnectRefs.current = {};
            Object.values(socketsRef.current).forEach(socket => {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.close();
                }
            });
            socketsRef.current = {};
            setConnected(false);
        };
    }, [enabled, JSON.stringify([...stockIds].sort())]);

    return { prices, connected };
}
