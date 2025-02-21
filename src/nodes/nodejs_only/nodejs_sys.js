/**
 * NodeJsSysHelper - Centralized Library Manager for Node.js System Utilities
 */
class NodeJsSysHelper {
    static getLib(libKey) {
        return LiteGraph.LibraryManager.getLib(libKey);
    }
    static logError(nodeTitle, error) {
        console.warn(`SysUtil Error: ${nodeTitle}: ${error.message || error} (line ${error.lineNumber || "?"})`);
    }
}

// ------------------ Register Node.js Libraries ------------------ //
LiteGraph.LibraryManager.registerLibrary({
    key: "os",
    globalObject: "os",
    server: { npm: "os" }
});

LiteGraph.LibraryManager.registerLibrary({
    key: "fs",
    globalObject: "fs",
    server: { npm: "fs" }
});

LiteGraph.LibraryManager.registerLibrary({
    key: "diskusage",
    version: "1.1.3",
    globalObject: "diskusage",
    server: { npm: "diskusage" }
});

LiteGraph.LibraryManager.registerLibrary({
    key: "node-os-utils",
    version: "0.3.4",
    globalObject: "nodeOsUtils",
    server: { npm: "node-os-utils" }
});

LiteGraph.LibraryManager.registerLibrary({
    key: "ps-list",
    version: "latest",
    globalObject: "psList",
    server: { npm: "ps-list" }
});

// Load libraries at runtime
["os", "fs", "diskusage", "node-os-utils", "ps-list"].forEach(lib => LiteGraph.LibraryManager.loadLibrary(lib));

/**
 * SysUtil_InfoNode - Retrieves System Information (OS, CPU, Memory, Network, Disk)
 */
class SysUtil_InfoNode {
    static title = "System Info";
    static desc = "Get OS, CPU, Memory, Uptime, Disk, Network, and system details";

    constructor() {
        this.addInput("refresh", LiteGraph.ACTION);
        this.addOutput("onRefresh", LiteGraph.EVENT);
        this.addOutput("info", "object");
        this.properties = {};
        this.cachedData = {};
        this.libsReady = false;
    }

    onGetOutputs() {
        return [
            ["os", "string"],
            ["cpuModel", "string"],
            ["memoryUsage", "string"],
            ["uptime", "number"],
            ["hostname", "string"],
            ["ipAddress", "string"],
            ["cpuLoad", "number"],
            ["diskUsage", "string"],
            ["networkSpeed", "string"]
        ].filter(([key]) => !this.outputs.some(o => o.name === key));
    }

    onAction(action) {
        if (action === "refresh") {
            this.fetchSystemInfo();
        }
    }

    async fetchSystemInfo() {
        let os = NodeJsSysHelper.getLib("os");
        let diskusage = NodeJsSysHelper.getLib("diskusage");
        let network = NodeJsSysHelper.getLib("node-os-utils");

        if (!os) return NodeJsSysHelper.logError(this.title, "Missing required system libraries.");

        try {
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);

            let data = {
                os: os.platform() + " " + os.release(),
                cpuModel: os.cpus()[0]?.model || "Unknown",
                memoryUsage: `${(usedMem / 1e9).toFixed(2)}GB / ${(totalMem / 1e9).toFixed(2)}GB (${memUsagePercent}%)`,
                uptime: os.uptime(),
                hostname: os.hostname(),
                ipAddress: Object.values(os.networkInterfaces())
                    .flat()
                    .filter(iface => iface.family === "IPv4" && !iface.internal)
                    .map(iface => iface.address)
                    .join(", ")
            };

            data.cpuLoad = await network?.cpu.loadavg();
            data.diskUsage = await diskusage?.check("/").then(info => {
                const totalDisk = info.total;
                const freeDisk = info.available;
                const usedDisk = totalDisk - freeDisk;
                const diskUsagePercent = ((usedDisk / totalDisk) * 100).toFixed(1);
                return `${(usedDisk / 1e9).toFixed(2)}GB / ${(totalDisk / 1e9).toFixed(2)}GB (${diskUsagePercent}%)`;
            });
            data.networkSpeed = await network?.netstat.inOut().then(net => {
                return typeof net === "object" && net.total ? 
                    `In: ${net.total.inputMb} MB/s, Out: ${net.total.outputMb} MB/s` : net;
            });

            this.cachedData = data;
            this.updateOutputs(data);
            this.triggerSlot("onRefresh");
        } catch (error) {
            NodeJsSysHelper.logError(this.title, error);
        }
    }

    updateOutputs(data) {
        Object.entries(data).forEach(([key, value]) => {
            this.setOutputData(key, value);
        });
        this.setOutputData("info", data);
    }
}
LiteGraph.registerNodeType("sys/info", SysUtil_InfoNode);

/**
 * SysUtil_ProcessListNode - Retrieves Running Processes
 */
class SysUtil_ProcessListNode {
    static title = "Process List";
    static desc = "Lists running processes with CPU and Memory usage";

    constructor() {
        this.addInput("refresh", LiteGraph.ACTION);
        this.addInput("filterByName", "string", { param_bind: true });

        this.addOutput("onRefresh", LiteGraph.EVENT);
        this.addOutput("processes", "array");

        this.properties = {
            filterByName: ""
        };
        this.cachedData = [];
        this.libsReady = false;
    }

    onGetOutputs() {
        return [
            ["processes", "array"],
            ["onRefresh", LiteGraph.EVENT]
        ].filter(([key]) => !this.outputs.some(o => o.name === key));
    }

    onAction(action) {
        if (action === "refresh") {
            this.fetchProcessList();
        }
    }

    async fetchProcessList() {
        let psList = NodeJsSysHelper.getLib("ps-list");

        if (!psList || typeof psList !== "function") return NodeJsSysHelper.logError(this.title, "ps-list function unavailable.");

        try {
            let filter = this.getInputOrProperty("filterByName");

            let processes = await psList();
            if (!Array.isArray(processes)) return NodeJsSysHelper.logError(this.title, "Unexpected process list format.");

            let filteredProcesses = processes
                .filter(proc => proc && typeof proc === "object" && "name" in proc)
                .filter(proc => (filter ? proc.name.includes(filter) : true))
                .map(proc => ({
                    pid: proc.pid || "N/A",
                    name: proc.name || "Unknown",
                    cpu: proc.cpu || 0,
                    memory: proc.memory || 0
                }));

            this.cachedData = filteredProcesses;
            this.updateOutputs(filteredProcesses);
            this.triggerSlot("onRefresh");
        } catch (error) {
            NodeJsSysHelper.logError(this.title, error);
        }
    }

    updateOutputs(processes) {
        this.setOutputData("processes", processes);
    }
}
LiteGraph.registerNodeType("sys/processList", SysUtil_ProcessListNode);
