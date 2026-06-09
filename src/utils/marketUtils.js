/**
 * Market Utility Functions
 * Handles market operating hours, weekends, and holidays.
 */

// List of NSE/BSE Market Holidays.
// Format: YYYY-MM-DD => Holiday Name
export const MARKET_HOLIDAY_MAP = {
    "2024-01-22": "Special Holiday",
    "2024-01-26": "Republic Day",
    "2024-03-08": "Mahashivratri",
    "2024-03-25": "Holi",
    "2024-03-29": "Good Friday",
    "2024-04-11": "Id-Ul-Fitr",
    "2024-04-17": "Ram Navami",
    "2024-05-01": "Maharashtra Day",
    "2024-06-17": "Bakri Id",
    "2024-07-17": "Moharram",
    "2024-08-15": "Independence Day",
    "2024-10-02": "Gandhi Jayanti",
    "2024-11-01": "Diwali",
    "2024-11-15": "Gurunanak Jayanti",
    "2024-12-25": "Christmas",
    "2025-01-26": "Republic Day",
    "2025-08-15": "Independence Day",
    "2025-10-02": "Gandhi Jayanti",
    "2025-12-25": "Christmas",

    // 2026 Holidays (aligned with backend MarketHoursService)
    "2026-01-26": "Republic Day",
    "2026-03-03": "Holi",
    "2026-03-26": "Shri Ram Navami",
    "2026-03-31": "Shri Mahavir Jayanti",
    "2026-04-03": "Good Friday",
    "2026-04-14": "Dr. Ambedkar Jayanti",
    "2026-05-01": "Maharashtra Day",
    "2026-05-28": "Bakri Id",
    "2026-06-26": "Muharram",
    "2026-09-14": "Ganesh Chaturthi",
    "2026-10-02": "Gandhi Jayanti",
    "2026-10-20": "Dussehra",
    "2026-11-10": "Diwali-Balipratipada",
    "2026-11-24": "Guru Nanak Jayanti",
    "2026-12-25": "Christmas",
};

export const MARKET_HOLIDAYS = Object.keys(MARKET_HOLIDAY_MAP);

const getISTDateString = (dateObj = new Date()) => {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    const parts = formatter.formatToParts(dateObj);
    const year = parts.find((p) => p.type === "year")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;
    return `${year}-${month}-${day}`;
};

export const getHolidayName = (dateObj = new Date()) => {
    const istDate = getISTDateString(dateObj);
    return MARKET_HOLIDAY_MAP[istDate] || null;
};

const getISTTimeParts = (dateObj = new Date()) => {
    const partsFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        weekday: 'long'
    });

    const parts = partsFormatter.formatToParts(dateObj);
    const getPart = (type) => parts.find(p => p.type === type)?.value;

    return {
        weekday: getPart('weekday'),
        hour: parseInt(getPart('hour'), 10),
        minute: parseInt(getPart('minute'), 10),
        second: parseInt(getPart('second'), 10),
    };
};

/**
 * Check if today (or provided date) is a trading day (Monday-Friday, not a holiday)
 * @param {Date} dateObj Optional date object, defaults to now
 * @returns {boolean} true if it's a trading day
 */
export const isTradingDay = (dateObj = new Date()) => {
    const istDate = getISTDateString(dateObj);

    // 1. Check Holidays
    if (MARKET_HOLIDAYS.includes(istDate)) {
        return false;
    }

    // 2. Check Weekends
    const partsFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long'
    });
    const weekday = partsFormatter.format(dateObj);

    if (weekday === 'Saturday' || weekday === 'Sunday') {
        return false;
    }

    return true;
};

export const isPostCloseSyncWindow = (dateObj = new Date()) => {
    if (!isTradingDay(dateObj)) {
        return false;
    }

    const { hour, minute } = getISTTimeParts(dateObj);
    return hour === 15 && (minute === 30 || minute === 31);
};

/**
 * Checks if the Indian Stock Market is currently open.
 * Market Hours: 09:15 AM to 03:30 PM IST
 * Closed on: Saturdays, Sundays, and Listed Holidays.
 * @returns {boolean} true if market is open, false otherwise.
 */
export const isMarketOpen = () => {
    const now = new Date();

    const istDate = getISTDateString(now);

    // 1. Check Holidays
    if (MARKET_HOLIDAYS.includes(istDate)) {
        return false;
    }

    // Get IST components for time/day checks
    const partsFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: 'numeric',
        minute: 'numeric',
        weekday: 'long'
    });

    const parts = partsFormatter.formatToParts(now);
    const getPart = (type) => parts.find(p => p.type === type)?.value;

    const weekday = getPart('weekday');
    const hour = parseInt(getPart('hour'), 10);
    const minute = parseInt(getPart('minute'), 10);

    // 2. Check Weekends
    if (weekday === 'Saturday' || weekday === 'Sunday') {
        return false;
    }

    // 3. Check Time (09:15 to 15:30)
    // Before 9:15 AM
    if (hour < 9 || (hour === 9 && minute < 15)) {
        return false;
    }
    // After 3:30 PM
    if (hour > 15 || (hour === 15 && minute > 30)) {
        return false;
    }

    return true;
};

/**
 * Get the reason why market is closed (if it is closed)
 * @returns {string|null} Reason or null if open
 */
export const getMarketClosedReason = () => {
    if (isMarketOpen()) return null;

    const now = new Date();
    const istDate = getISTDateString(now);

    // Check Holidays
    if (MARKET_HOLIDAYS.includes(istDate)) {
        const holidayName = getHolidayName(now);
        return holidayName ? `Market Holiday - ${holidayName}` : "Market Holiday";
    }

    const partsFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
    });

    const parts = partsFormatter.formatToParts(now);
    const getPart = (type) => parts.find(p => p.type === type)?.value;
    const weekday = getPart('weekday');
    const hour = parseInt(getPart('hour'), 10);
    const minute = parseInt(getPart('minute'), 10);

    if (weekday === 'Saturday' || weekday === 'Sunday') {
        return "Weekend";
    }

    if (hour < 9 || (hour === 9 && minute < 15)) {
        return "Pre-market hours";
    }
    if (hour > 15 || (hour === 15 && minute > 30)) {
        return "Post-market hours";
    }

    return "Closed";
};

/**
 * Calculate milliseconds until the next market state change.
 * Returns exact time until:
 * - 9:00 AM (chart switch from previous day to empty)
 * - 9:15 AM (market opens, WebSocket connects)
 * - 3:30 PM (market closes, WebSocket disconnects)
 * 
 * @returns {number|null} Milliseconds until next transition, or null if no more changes today
 */
export const getMillisecondsUntilNextMarketChange = () => {
    const now = new Date();
    const istDate = getISTDateString(now);

    // Get IST components
    const partsFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        weekday: 'long'
    });

    const parts = partsFormatter.formatToParts(now);
    const getPart = (type) => parts.find(p => p.type === type)?.value;

    const weekday = getPart('weekday');
    const hour = parseInt(getPart('hour'), 10);
    const minute = parseInt(getPart('minute'), 10);
    const second = parseInt(getPart('second'), 10);

    // Weekend/holiday - no transitions at all
    if (MARKET_HOLIDAYS.includes(istDate)) {
        return null;
    }

    if (weekday === 'Saturday' || weekday === 'Sunday') {
        return null;
    }

    // Calculate current time in seconds since midnight
    const currentSeconds = hour * 3600 + minute * 60 + second;
    const time0900 = 9 * 3600;       // 9:00 AM
    const time0915 = 9 * 3600 + 900; // 9:15 AM
    const time1530 = 15 * 3600 + 1800; // 3:30 PM
    const time1532 = 15 * 3600 + 1920; // 3:32 PM

    let targetSeconds;

    if (currentSeconds < time0900) {
        // Before 9:00 AM → Wait until 9:00 AM (chart switch)
        targetSeconds = time0900;
    } else if (currentSeconds < time0915) {
        // Between 9:00-9:15 → Wait until 9:15 AM (market opens)
        targetSeconds = time0915;
    } else if (currentSeconds < time1530) {
        // Market open → Wait until 3:30 PM (market closes)
        targetSeconds = time1530;
    } else if (currentSeconds < time1532 && isPostCloseSyncWindow(now)) {
        targetSeconds = time1532;
    } else {
        // After 3:30 PM → No more changes today
        return null;
    }

    const secondsUntilChange = targetSeconds - currentSeconds;
    // Add 1 second buffer to ensure we're past the threshold
    return (secondsUntilChange * 1000) + 1000;
};

export const getTodayMarketClosureNotice = () => {
    if (isMarketOpen()) {
        return null;
    }

    const now = new Date();
    const holidayName = getHolidayName(now);

    if (holidayName) {
        return `Market is closed today due to ${holidayName}.`;
    }

    const partsFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
    });
    const weekday = partsFormatter.format(now);

    if (weekday === "Saturday" || weekday === "Sunday") {
        return "Market is closed today (weekend).";
    }

    return "Market is closed right now. Trading resumes during market hours (9:15 AM to 3:30 PM IST).";
};
