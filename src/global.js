// global.js

// Function to get the global object (browser or server)
export function getGlobalObject() {
    if (typeof globalThis !== 'undefined') return globalThis;
    if (typeof self !== 'undefined') return self;
    if (typeof window !== 'undefined') return window;
    if (typeof global !== 'undefined') return global;
    throw new Error('Unable to determine global object');
}

// Function to set a global variable
export function setGlobalVariable(key, value) {
    const globalObject = getGlobalObject();
    globalObject[key] = value;
}

// Function to get a global variable
export function getGlobalVariable(key) {
    const globalObject = getGlobalObject();
    return globalObject[key];
}

// Function to check if running in a browser environment
export function isBrowser() {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
}

// Function to check if running in a Node.js environment
export function isNode() {
    return typeof process !== 'undefined' && process.versions && process.versions.node;
}

// Function to check if running in a Bun.js environment
export function isBun() {
    return typeof Bun !== 'undefined';
}

// Function to detect the runtime environment
export function getRuntime() {
    if (isBrowser()) return 'browser';
    if (isBun()) return 'bun';
    if (isNode()) return 'node';
    return 'unknown';
}
