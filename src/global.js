// global.js
export function getGlobalObject() {
    if (typeof globalThis !== 'undefined') {
        return globalThis;
    }
    if (typeof self !== 'undefined') {
        return self;
    }
    if (typeof window !== 'undefined') {
        return window;
    }
    if (typeof global !== 'undefined') {
        return global;
    }
    throw new Error('Unable to determine global object');
}

export function setGlobalVariable(key, value) {
    const globalObject = getGlobalObject();
    globalObject[key] = value;
}

export function getGlobalVariable(key) {
    const globalObject = getGlobalObject();
    return globalObject[key];
}
