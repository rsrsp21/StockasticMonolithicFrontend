const WS_PATH = "/ws/stocks";
const NOTIFICATION_WS_PATH = "/ws/notifications";

function upgradeForSecurePage(url) {
  if (typeof window === "undefined") {
    return url;
  }

  const resolved = new URL(url, window.location.origin);
  if (window.location.protocol === "https:" && resolved.protocol === "http:") {
    resolved.protocol = "https:";
  }

  return resolved.toString();
}

function toWebSocketUrl(url) {
  if (!url) {
    return url;
  }

  if (url.startsWith("ws://") || url.startsWith("wss://")) {
    return url;
  }

  if (url.startsWith("http://")) {
    return `ws://${url.slice("http://".length)}`;
  }

  if (url.startsWith("https://")) {
    return `wss://${url.slice("https://".length)}`;
  }

  return url;
}

export function getWebSocketEndpoint() {
  const explicitWsUrl = import.meta.env.VITE_WS_URL;
  if (explicitWsUrl) {
    return toWebSocketUrl(upgradeForSecurePage(explicitWsUrl));
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (apiBaseUrl) {
    return toWebSocketUrl(
      upgradeForSecurePage(`${apiBaseUrl.replace(/\/$/, "")}${WS_PATH}`)
    );
  }

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}${WS_PATH}`;
  }

  return `ws://localhost:8080${WS_PATH}`;
}

export function getNotificationWebSocketEndpoint() {
  const explicitWsUrl = import.meta.env.VITE_NOTIFICATION_WS_URL;
  if (explicitWsUrl) {
    return toWebSocketUrl(upgradeForSecurePage(explicitWsUrl));
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (apiBaseUrl) {
    return toWebSocketUrl(
      upgradeForSecurePage(`${apiBaseUrl.replace(/\/$/, "")}${NOTIFICATION_WS_PATH}`)
    );
  }

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}${NOTIFICATION_WS_PATH}`;
  }

  return `ws://localhost:8080${NOTIFICATION_WS_PATH}`;
}
