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

LiteGraph.LibraryManager.registerLibrary({
    key: "child_process",
    globalObject: "child_process",
    server: { npm: "child_process" }
});

// Load libraries at runtime
["os", "fs", "diskusage", "node-os-utils", "ps-list", "child_process"].forEach(lib => LiteGraph.LibraryManager.loadLibrary(lib));

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


class SysUtil_RunCommandNode {
    static title = "Run Command";
    static desc = "Executes a shell command and returns the output.";

    constructor() {
        this.addInput("run", LiteGraph.ACTION);
        this.addInput("command", "string", { param_bind: true });
        this.addInput("timeout", "number", { param_bind: true });
        this.addInput("keepRunning", "boolean", { param_bind: true });
        this.addInput("killPrevious", "boolean", { param_bind: true });

        this.addOutput("stdout", "string");
        this.addOutput("stderr", "string");
        this.addOutput("exitCode", "number");
        this.addOutput("processInstance", "object");
        this.addOutput("onData", LiteGraph.EVENT);
        this.addOutput("onClose", LiteGraph.EVENT);
        this.addOutput("onError", LiteGraph.EVENT);

        this.properties = {
            command: "",
            timeout: 12000, // Default timeout: 12 seconds
            keepRunning: false,
            killPrevious: true // Determines if previous process should be terminated
        };

        this.process = null; // Track running process
    }

    onGetOutputs() {
        return [
            ["stdout", "string"],
            ["stderr", "string"],
            ["exitCode", "number"],
            ["processInstance", "object"],
            ["onData", LiteGraph.EVENT],
            ["onClose", LiteGraph.EVENT],
            ["onError", LiteGraph.EVENT]
        ].filter(([key]) => !this.outputs.some(o => o.name === key));
    }

    onAction(action) {
        if (action === "run") {
            this.executeCommand();
        }
    }

    async executeCommand() {
        let child_process = NodeJsSysHelper.getLib("child_process");
        if (!child_process) {
            NodeJsSysHelper.logError(this.title, "Missing child_process module.");
            return;
        }

        let command = this.getInputOrProperty("command");
        let timeout = this.getInputOrProperty("timeout") || this.properties.timeout;
        let keepRunning = this.getInputOrProperty("keepRunning") || this.properties.keepRunning;
        let killPrevious = this.getInputOrProperty("killPrevious") || this.properties.killPrevious;

        if (!command) {
            NodeJsSysHelper.logError(this.title, "No command specified.");
            return;
        }

        try {
            if (this.process && killPrevious) {
                this.process.kill(); // Ensure any previous process is terminated
                this.process = null;
            }

            if (keepRunning) {
                this.runPersistentCommand(command, child_process);
            } else {
                this.runSingleExecution(command, timeout, child_process);
            }
        } catch (error) {
            NodeJsSysHelper.logError(this.title, error);
        }
    }

    runSingleExecution(command, timeout, child_process) {
        child_process.exec(command, { timeout }, (error, stdout, stderr) => {
            const out = stdout?.toString().trim() || "";
            const err = stderr?.toString().trim() || "";
            this.setOutputData("stdout", out);
            this.setOutputData("stderr", err);
            this.setOutputData("exitCode", error ? error.code : 0);
            this.triggerSlot("onData");
            this.triggerSlot("onClose");
            
            if (error) {
                this.setOutputData("stderr", "Error "+this.title+" :: "+(error.message || error) + (err ? " :: stderr: "+err : ""));
                this.triggerSlot("onError");
                NodeJsSysHelper.logError(this.title, error);
            }
        });
    }

    runPersistentCommand(command, child_process) {
        this.process = child_process.spawn(command, { shell: true });

        this.setOutputData("processInstance", this.process);

        this.process.stdout.on("data", (data) => {
            this.setOutputData("stdout", data.toString().trim());
            this.triggerSlot("onData");
        });

        this.process.stderr.on("data", (data) => {
            this.setOutputData("stderr", data.toString().trim());
            this.triggerSlot("onError");
        });

        this.process.on("close", (code) => {
            this.setOutputData("exitCode", code);
            this.triggerSlot("onClose");
            this.process = null;
        });

        this.process.on("error", (error) => {
            this.setOutputData("stderr", "Error "+this.title+" :: "+(error.message || error));
            this.triggerSlot("onError");
            NodeJsSysHelper.logError(this.title, error);
            this.process = null;
        });
    }
}
LiteGraph.registerNodeType("sys/runCommand", SysUtil_RunCommandNode);
