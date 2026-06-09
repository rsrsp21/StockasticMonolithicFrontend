/**
 * Custom hook for WebSocket connection to receive real-time stock prices
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { getWebSocketEndpoint } from '../utils/websocket';

export function useStockWebSocket(stockId, enabled = true) {
    const [price, setPrice] = useState(null);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
    const socketRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const shouldReconnectRef = useRef(true);

    const connect = useCallback(() => {
        if (!stockId || !enabled) return;

        try {
            const socketUrl = getWebSocketEndpoint();
            const url = `${socketUrl}${socketUrl.includes('?') ? '&' : '?'}stockId=${encodeURIComponent(stockId)}`;
            const socket = new WebSocket(url);
            socketRef.current = socket;

            socket.onopen = () => {
                console.log('WebSocket connected for stock:', stockId);
                setConnected(true);
                setError(null);
            };

            socket.onmessage = (event) => {
                try {
                    const priceData = JSON.parse(event.data);
                    setPrice(priceData);
                } catch (e) {
                    console.error('Error parsing price data:', e);
                }
            };

            socket.onclose = () => {
                console.log('WebSocket disconnected');
                setConnected(false);
                if (shouldReconnectRef.current) {
                    reconnectTimeoutRef.current = setTimeout(connect, 5000);
                }
            };

            socket.onerror = (err) => {
                console.error('WebSocket error:', err);
                setError('Connection error');
            };
        } catch (err) {
            console.error('WebSocket connection error:', err);
            setError(err.message);
        }
    }, [stockId, enabled]);

    const disconnect = useCallback(() => {
        shouldReconnectRef.current = false;
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
        setConnected(false);
    }, []);

    useEffect(() => {
        shouldReconnectRef.current = true;
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    useEffect(() => {
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        }
    }, []);

    return { price, connected, error, reconnect: connect };
}

export default useStockWebSocket;
