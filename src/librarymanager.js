import { isBrowser, isNode, isBun, getRuntime } from "./global.js";
import { getGlobalObject, setGlobalVariable, getGlobalVariable } from './global.js';

// export const root = getGlobalObject();

// node modules ::
// path
// fs
// vm
// node-fetch
// ws
// http
// socket-io
// socket-io-client

export class LibraryManager {
    constructor() {
        this.libraries_known = {};
        this.libraries_loaded = {};
        this.libraries_state = {};
        this.fs = null;
        this.path = null;

        // Dynamically import Node.js modules (avoid errors in browsers)
        if (!isBrowser()) {
            this.importNodeModules();
        }

        setGlobalVariable("LibraryManager", this);
    }

    async importNodeModules() {
        // ERROR in NuNu when packing
        try {
            this.fs = await import("fs").then(m => m.default || m);
        } catch (e) {
            console.warn("Error importing 'fs':", e);
        }
        try {
            this.path = await import("path").then(m => m.default || m);
        } catch (e) {
            console.warn("Error importing 'path':", e);
        }
        try {
            this.vm = await import("vm").then(m => m.default || m);
            this.fetch = await import("node-fetch").then(m => m.default || m);
        } catch (e) {
            console.warn("Error importing Node.js modules:", e);
        }
        console.log("imported modules");
    }

    /**
     * Register a library with flexible options (structured object or simple format).
     * If the library is already registered, merge new data with the existing one.
     * Options:
     *  - key, version, globalObject, defaultExport
     *  - browser: { local, remote, target } where target can be "client", "both"
     *  - server: { npm, remote, target } where target can be "server", "both"
     */
    registerLibrary(...args) {
        let newLib = {};
        if (typeof args[0] === "object" && !Array.isArray(args[0])) {
            const { key, version, globalObject, browser = {}, server = {}, defaultExport } = args[0];
            newLib = {
                key,
                version,
                globalObject,
                localPaths: this.ensureArray(browser.local),
                remoteUrls: this.ensureArray(browser.remote),
                browserTarget: browser.target || "both",
                npmPackages: this.ensureArray(server.npm),
                serverRemoteUrls: this.ensureArray(server.remote),
                serverTarget: server.target || "both",
                defaultExport
            };
        } else {
            const [key, version, globalObject, localPaths, remoteUrls, npmPackages, serverRemoteUrls, defaultExport] = args;
            newLib = {
                key,
                version,
                globalObject,
                localPaths: this.ensureArray(localPaths),
                remoteUrls: this.ensureArray(remoteUrls),
                browserTarget: "both",
                npmPackages: this.ensureArray(npmPackages),
                serverRemoteUrls: this.ensureArray(serverRemoteUrls),
                serverTarget: "both",
                defaultExport
            };
        }

        // If already registered, merge configurations.
        if (this.libraries_known[newLib.key]) {
            const existing = this.libraries_known[newLib.key];
            // Merge arrays using a Set to ensure uniqueness.
            existing.localPaths = Array.from(new Set([...existing.localPaths, ...newLib.localPaths]));
            existing.remoteUrls = Array.from(new Set([...existing.remoteUrls, ...newLib.remoteUrls]));
            existing.npmPackages = Array.from(new Set([...existing.npmPackages, ...newLib.npmPackages]));
            existing.serverRemoteUrls = Array.from(new Set([...existing.serverRemoteUrls, ...newLib.serverRemoteUrls]));
            // Optionally update version if provided new value (here we override if different).
            if (newLib.version && existing.version !== newLib.version) {
                existing.version = newLib.version;
            }
            // Merge target flags: if they differ, default to "both"
            if (existing.browserTarget !== newLib.browserTarget) {
                existing.browserTarget = "both";
            }
            if (existing.serverTarget !== newLib.serverTarget) {
                existing.serverTarget = "both";
            }
            // Update default export if provided.
            if (newLib.defaultExport) {
                existing.defaultExport = newLib.defaultExport;
            }
            // Do not change the load state if already loaded.
            this.libraries_known[newLib.key] = existing;
        } else {
            // First registration: simply add it.
            this.libraries_known[newLib.key] = newLib;
            this.libraries_state[newLib.key] = "not_loaded";
        }
    }

    /**
     * Helper function to ensure a value is always an array.
     */
    ensureArray(value) {
        return Array.isArray(value) ? value : value ? [value] : [];
    }

    camelize(str) {
        return str.replace(/[^a-zA-Z0-9_$]/g, '_').replace(/^[0-9]/, '_$&');
    }

    // **Load a library dynamically (includes all specified files)**
    async loadLibrary(key, callback) {
        if (!this.libraries_known[key]) {
            console.error(`Library ${key} not registered.`);
            return;
        }

        if (this.libraries_state[key] === "loading") {
            console.warn(`Library ${key} is already loading.`);
            return;
        }

        if (this.libraries_state[key] === "loaded") {
            console.warn(`Library ${key} is already loaded.`);
            callback && callback(this.libraries_loaded[key]);
            return;
        }

        this.libraries_state[key] = "loading";
        const library = this.libraries_known[key];

        try {
            let loadedModules = [];

            if (isBrowser()) {
                loadedModules = await this.loadBrowserLibrary(library);
            } else if (isNode() || isBun()) {
                loadedModules = await this.loadServerLibrary(library);
            }

            this.libraries_state[key] = "loaded";
            this.libraries_loaded[key] = loadedModules;
            console.log(`Library ${key} loaded.`);
            callback && callback(loadedModules);
        } catch (error) {
            this.libraries_state[key] = "error";
            console.error(`Failed to load library ${key}:`, error);
        }
    }

    // **Load all specified browser files**
    async loadBrowserLibrary(library) {
        const loadedScripts = [];

        for (const localPath of library.localPaths) {
            console.log(`Loading local browser script: ${localPath}`);
            try {
                loadedScripts.push(await this.loadScript(localPath, library.globalObject));
            } catch (error) {
                console.warn(`Failed to load local file: ${localPath}`);
            }
            return loadedScripts;
        }

        for (const remoteUrl of library.remoteUrls) {
            console.log(`Loading remote browser script: ${remoteUrl}`);
            try {
                loadedScripts.push(await this.loadScript(remoteUrl, library.globalObject));
            } catch (error) {
                console.warn(`Failed to load remote script: ${remoteUrl}`);
            }
            return loadedScripts;
        }

        if (loadedScripts.length === 0) {
            if(library.localPaths.length == 0 && library.remoteUrls.length == 0){
                return []; // no files required
            }else{
                throw new Error(`Could not load any files for ${library.key}`);
            }
        }

        return loadedScripts;
    }

    // **Load all specified server files (Node.js/Bun)**
    async loadServerLibrary(library) {
        if (!this.fs || !this.path) {
            await this.importNodeModules();
            if (!this.fs || !this.path) {
                console.warn("Node.js 'fs' and 'path' modules are not available.");
                return;
            }
        }

        const loadedModules = [];
        const packageFile = "required-packages.txt";

        // Read existing package list (if available)
        let existingPackages = new Set();
        try {
            if (this.fs.existsSync(packageFile)) {
                const data = this.fs.readFileSync(packageFile, "utf8");
                existingPackages = new Set(data.split("\n").map(pkg => pkg.trim()).filter(Boolean));
            }
        } catch (error) {
            console.warn("Failed to read required-packages.txt:", error);
        }

        for (const npmPackage of library.npmPackages) {
            console.log(`Loading NPM package: ${npmPackage}`);
            try {
                let modX = null;
                modX = await import(npmPackage);

                if (library.globalObject && library.globalObject !== "") {
                    if(library.defaultExport && typeof(modX)=="object"){
                        if(typeof(modX[library.defaultExport])!=="undefined"){
                            modX = modX[library.defaultExport];
                            console.debug(`Library ${npmPackage} got from default export`, modX);
                        }else{
                            console.warn(`Library ${npmPackage} NOT FOUND default export`, modX);
                        }
                    }else{
                        // RECHECK WHEN AND IF NEEDED (could use defaultExport? mod to get deep property)
                        // modX = modX?.default ?? modX;
                    }
                    setGlobalVariable(library.globalObject, modX);
                    // TODO save in local libs modX;
                    console.log(`Included package: ${npmPackage} as global ${library.globalObject}`);
                    // console.log(`${modX}}`);
                }else{
                    console.log(`NOT Included package: ${npmPackage} as global ${library.globalObject} result ${modX} of ${loadedModules}`);
                }
                
                loadedModules.push(modX);

            } catch (error) {
                console.warn(`Failed to import NPM package: ${npmPackage}`, error);

                // Add missing package to the list
                if (!existingPackages.has(npmPackage)) {
                    existingPackages.add(npmPackage);
                    console.warn(`Adding missing package to required-packages.txt: ${npmPackage}`);
                }
            }
        }

        // Write updated package list
        if(existingPackages.length){
            try {
                this.fs.writeFileSync(packageFile, [...existingPackages].join("\n") + "\n", "utf8");
            } catch (error) {
                console.warn("Failed to update required-packages.txt:", error);
            }
        }

        for (const remoteUrl of library.serverRemoteUrls) {
            console.log(`Loading remote module: ${remoteUrl}`);
            try {
                loadedModules.push(await this.loadServerRemoteScript(remoteUrl));
            } catch (error) {
                console.warn(`Failed to import remote module: ${remoteUrl}`, error);
            }
        }

        if (loadedModules.length === 0) {
            if(library.localPaths.npmPackages == 0 && npmPackages && library.serverRemoteUrls.length == 0){
                return []; // no files required
            }else{
                throw new Error(`Could not import anything for ${library.key}`);
            }
        }

        return loadedModules;
    }

    getLib(libKey) {
        if (this.getLibraryState(libKey) != "loaded") {
            console.warn(`[NodeJsSys] Library '${libKey}' is not loaded. Attempting to load...`);
            this.loadLibrary(libKey);
            return null;
        }
        const library = this.libraries_known[libKey];
        return library ? getGlobalVariable(library.globalObject) || null : null;
    }

     /**
     * Wait for a library to be loaded.
     * @param {string} libKey - The key of the library.
     * @param {number} timeout - Maximum wait time in milliseconds.
     * @returns {Promise<any>} Resolves with the global object for the library.
     */
    waitForLib(libKey, timeout = 9000) {
        return new Promise((resolve, reject) => {
            const checkInterval = 50;
            let elapsed = 0;
            const intervalId = setInterval(() => {
                if (this.getLibraryState(libKey) === "loaded") {
                    clearInterval(intervalId);
                    resolve(getGlobalVariable(this.libraries_known[libKey].globalObject));
                } else {
                    elapsed += checkInterval;
                    if (timeout && elapsed >= timeout) {
                        clearInterval(intervalId);
                        reject(new Error(`Library ${libKey} did not load within ${timeout}ms`));
                    }
                }
            }, checkInterval);
        });
    }

    async loadServerRemoteScript(url) {
        if (!this.fetch || !this.vm) throw new Error("Node.js modules 'fetch' and 'vm' are required.");

        console.log(`Fetching remote script: ${url}`);
        const response = await this.fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);

        const scriptText = await response.text();
        const script = new this.vm.Script(scriptText);
        const sandbox = { window: {}, module: {}, exports: {} };
        script.runInNewContext(sandbox);

        console.log("✅ Loaded from remote:", url);
        return sandbox.module.exports || sandbox.exports;
    }

    // // **Load a script dynamically in a browser**
    // loadScript(url, globalObject) {
    //     return new Promise((resolve, reject) => {
    //         console.log(`Loading script: ${url}`);
    //         const script = document.createElement("script");
    //         script.src = url;
    //         script.type = "text/javascript";
    //         script.onload = () => resolve(window[globalObject]);
    //         script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    //         document.head.appendChild(script);
    //     });
    // }

    // **Detect and Load JavaScript as Module or CommonJS**
    async loadScript(url, globalObject="library_last") {
        /* TODO get slugged file name as default */
        console.debug("Load script", url, globalObject);
        return new Promise(async (resolve, reject) => {
            let isModule = await this.isESModule(url);
            console.debug("loadScript", isModule?"MODULE":"COMMONJS", url);
            if (isModule) {
                let script = document.createElement("script");
                script.type = "module";
                // WIP CLEAN importing module

                const jsName = this.camelize(globalObject);

                script.textContent = `
                    import * as ${jsName} from '${url}';
                    var root = {};
                    if (typeof globalThis !== 'undefined') root = globalThis;
                    else if (typeof self !== 'undefined') root = self;
                    else if (typeof window !== 'undefined') root = window;
                    else if (typeof global !== 'undefined') root = global;
                    if (LibraryManager){
                        LibraryManager.${jsName} = ${jsName};
                        console.log('LibraryManager attached ${jsName}',LibraryManager.${jsName});
                    }
                    if (root.LibraryManager){
                        root.LibraryManager.${jsName} = ${jsName};
                        console.log('rootLibraryManager attached ${jsName}',root.LibraryManager.${jsName});
                    }
                    // LiteGraph.LibraryManager.${jsName} = ${jsName};
                    // alert('loaded ${jsName}');
                `;
                //alert(script.textContent);
                document.head.appendChild(script);
                resolve();
            } else {
                let script = document.createElement("script");
                script.type = "text/javascript";
                script.src = url;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            }
        });
    }

    // **Check if a script is an ES Module**
    async isESModule(url) {
        try {
            let response = await fetch(url);
            let text = await response.text();
            return /export\s|import\s/.test(text); // Detect ES Module keywords
        } catch (e) {
            return false; // Default to CommonJS if fetch fails
        }
    }

    // Load CSS
    loadCSS(href) {
        return new Promise((resolve, reject) => {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = href;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    // **Unload a library**
    unloadLibrary(key) {
        if (!this.libraries_known[key]) {
            console.error(`Library ${key} not registered.`);
            return;
        }

        if (this.libraries_state[key] !== "loaded") {
            console.warn(`Library ${key} is not loaded.`);
            return;
        }

        const library = this.libraries_known[key];
        library.localPaths.forEach(file => {
            if (file.endsWith(".js")) {
                document.querySelectorAll(`script[src="${file}"]`).forEach(el => el.remove());
            } else if (file.endsWith(".css")) {
                document.querySelectorAll(`link[href="${file}"]`).forEach(el => el.remove());
            }
        });
        library.remoteUrls.forEach(file => {
            if (file.endsWith(".js")) {
                document.querySelectorAll(`script[src="${file}"]`).forEach(el => el.remove());
            } else if (file.endsWith(".css")) {
                document.querySelectorAll(`link[href="${file}"]`).forEach(el => el.remove());
            }
        });

        this.libraries_state[key] = "not_loaded";
        delete this.libraries_loaded[key];
        console.log(`Library ${key} unloaded.`);
    }

    // **Get the state of a library**
    getLibraryState(key) {
        return this.libraries_state[key] || false;
    }

    /**
     * Check if all registered libraries are loaded.
     * @returns {boolean} True if every library's state is "loaded", false otherwise.
     */
    areAllLibrariesLoaded() {
        for (const key in this.libraries_state) {
            if (this.libraries_state[key] !== "loaded") {
                return false;
            }
        }
        return true;
    }

    /**
     * Attempt to install NPM packages required for a library.
     * This method is only supported in Node.js or Bun environments.
     * @param {string} libKey The key of the library.
     * @returns {Promise<string>} The stdout from the npm install command.
     */
    async npmInstall(libKey, command="npm install") {
        if (!isNode() && !isBun()) {
            console.warn('npmInstall is only supported in Node.js or Bun environments.');
            return;
        }
        if (!this.libraries_known[libKey]) {
            console.error(`Library ${libKey} not registered.`);
            return;
        }
        const library = this.libraries_known[libKey];
        if (!library.npmPackages || library.npmPackages.length === 0) {
            console.warn(`Library ${libKey} has no npm packages to install.`);
            return;
        }
        let child_process;
        try {
            child_process = await import("child_process").then(m => m.default || m);
        } catch (e) {
            console.error("Failed to import child_process:", e);
            return;
        }
        const packages = library.npmPackages.join(" ");
        const cmd = command + ` ${packages}`;
        return new Promise((resolve, reject) => {
            child_process.exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error installing npm packages for ${libKey}:`, error);
                    reject(error);
                    return;
                }
                console.log(`npm install output for ${libKey}:`, stdout);
                resolve(stdout);
            });
        });
    }

    /**
     * Wait until all registered libraries have been loaded.
     * @returns {Promise<void>} Resolves when all libraries are in the "loaded" state.
     */
    async waitAllLibrariesLoaded() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (this.areAllLibrariesLoaded()) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }

    /**
     * Load all registered libraries concurrently.
     * @returns {Promise<void>} Resolves when all libraries have attempted to load.
     */
    async loadAllLibraries() {
        const keys = Object.keys(this.libraries_known);
        await Promise.all(keys.map(key => this.loadLibrary(key)));
    }

    /**
     * Unload all loaded libraries.
     */
    unloadAllLibraries() {
        Object.keys(this.libraries_known).forEach(key => {
            if (this.libraries_state[key] === "loaded") {
                this.unloadLibrary(key);
            }
        });
    }

    /**
     * Get a list of all registered library keys.
     * @returns {string[]} An array of registered library keys.
     */
    getRegisteredLibraries() {
        return Object.keys(this.libraries_known);
    }
}

export default LibraryManager;