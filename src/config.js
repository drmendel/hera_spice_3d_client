// ─────────────────────────────────────────────
// WebSocketUrl Helpers
// ─────────────────────────────────────────────

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const host = window.location.host;

// ─────────────────────────────────────────────
// Global Configuration
// ─────────────────────────────────────────────

export let webSocketUrl = `${protocol}://${host}/ws/`;              // WebSocket URL
export const requestPerSec = 10;                                    // request/second

export const darkColor = 'rgb(128,128,128)';                      // Color for buttons
export const lightColor = 'rgb(175,175,175)';                     // Color for buttons when active

export const minDate = new Date("2024-10-07T23:58:51.818Z");        // Minimum allowed date
export const maxDate = new Date("2028-01-01T00:00:00.000Z");        // Maximum allowed date
export const defaultDate = new Date("2025-03-12T09:27:00.000Z");    // Default date for simulation