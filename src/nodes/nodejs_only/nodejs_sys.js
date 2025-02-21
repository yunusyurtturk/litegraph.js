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


// class SysUtil_FileSystemNode {
//     static title = "File System";
//     static desc = "Performs file operations: Read, Write, Delete, Check Exists, List Directory";

//     constructor() {
//         this.addInput("do", LiteGraph.ACTION);
//         this.addInput("filePath", "string", { param_bind: true });
//         this.addInput("content", "string", { param_bind: true });
//         this.addInput("action", "string", { param_bind: true }); // "read", "write", "delete", "exists", "list"

//         this.addOutput("fileContent", "string");
//         this.addOutput("fileList", "array");
//         this.addOutput("exists", "boolean");
//         this.addOutput("onSuccess", LiteGraph.EVENT);
//         this.addOutput("onError", LiteGraph.EVENT);

//         this.properties = {
//             defaultFilePath: "",
//             defaultContent: "",
//             defaultAction: "read" // Default file action
//         };

//         this.fs = null; // Track File System module
//     }

//     onGetOutputs() {
//         return [
//             ["fileContent", "string"],
//             ["fileList", "array"],
//             ["exists", "boolean"],
//             ["onSuccess", LiteGraph.EVENT],
//             ["onError", LiteGraph.EVENT]
//         ].filter(([key]) => !this.outputs.some(o => o.name === key));
//     }

//     onAction(action) {
//         if (action === "do") {
//             this.handleFileOperation();
//         }
//     }

//     async handleFileOperation() {
//         this.fs = NodeJsSysHelper.getLib("fs");
//         if (!this.fs) {
//             NodeJsSysHelper.logError(this.title, "Missing fs module.");
//             return;
//         }

//         let filePath = this.getInputOrProperty("filePath") || this.properties.defaultFilePath;
//         let content = this.getInputOrProperty("content") || this.properties.defaultContent;
//         let action = this.getInputOrProperty("action") || this.properties.defaultAction;

//         if (!filePath) {
//             NodeJsSysHelper.logError(this.title, "No file path specified.");
//             return;
//         }

//         try {
//             switch (action) {
//                 case "read":
//                     this.readFile(filePath);
//                     break;
//                 case "write":
//                     this.writeFile(filePath, content);
//                     break;
//                 case "delete":
//                     this.deleteFile(filePath);
//                     break;
//                 case "exists":
//                     this.checkFileExists(filePath);
//                     break;
//                 case "list":
//                     this.listDirectory(filePath);
//                     break;
//                 default:
//                     NodeJsSysHelper.logError(this.title, `Unknown action: ${action}`);
//             }
//         } catch (error) {
//             NodeJsSysHelper.logError(this.title, error);
//             this.triggerSlot("onError");
//         }
//     }

//     readFile(filePath) {
//         try {
//             let data = this.fs.readFileSync(filePath, "utf8");
//             this.setOutputData("fileContent", data);
//             this.triggerSlot("onSuccess");
//         } catch (error) {
//             NodeJsSysHelper.logError(this.title, `Error reading file: ${filePath}`);
//             this.triggerSlot("onError");
//         }
//     }

//     writeFile(filePath, content) {
//         try {
//             this.fs.writeFileSync(filePath, content, "utf8");
//             this.triggerSlot("onSuccess");
//         } catch (error) {
//             NodeJsSysHelper.logError(this.title, `Error writing to file: ${filePath}`);
//             this.triggerSlot("onError");
//         }
//     }

//     deleteFile(filePath) {
//         try {
//             if (this.fs.existsSync(filePath)) {
//                 this.fs.unlinkSync(filePath);
//                 this.triggerSlot("onSuccess");
//             } else {
//                 NodeJsSysHelper.logError(this.title, `File not found: ${filePath}`);
//                 this.triggerSlot("onError");
//             }
//         } catch (error) {
//             NodeJsSysHelper.logError(this.title, `Error deleting file: ${filePath}`);
//             this.triggerSlot("onError");
//         }
//     }

//     checkFileExists(filePath) {
//         try {
//             let exists = this.fs.existsSync(filePath);
//             this.setOutputData("exists", exists);
//             this.triggerSlot("onSuccess");
//         } catch (error) {
//             NodeJsSysHelper.logError(this.title, `Error checking file: ${filePath}`);
//             this.triggerSlot("onError");
//         }
//     }

//     listDirectory(filePath) {
//         try {
//             if (!this.fs.existsSync(filePath) || !this.fs.lstatSync(filePath).isDirectory()) {
//                 NodeJsSysHelper.logError(this.title, `Directory not found: ${filePath}`);
//                 this.triggerSlot("onError");
//                 return;
//             }
//             let files = this.fs.readdirSync(filePath);
//             this.setOutputData("fileList", files);
//             this.triggerSlot("onSuccess");
//         } catch (error) {
//             NodeJsSysHelper.logError(this.title, `Error listing directory: ${filePath}`);
//             this.triggerSlot("onError");
//         }
//     }
// }
// LiteGraph.registerNodeType("sys/fileSystem", SysUtil_FileSystemNode);

class SysUtil_FileBaseNode {
    constructor(actionTitle, actionDesc) {
        this.title = actionTitle;
        this.desc = actionDesc;

        this.addInput("do", LiteGraph.ACTION);
        this.addInput("filePath", "string", { param_bind: true });

        this.addOutput("onSuccess", LiteGraph.EVENT);
        this.addOutput("onError", LiteGraph.EVENT);

        this.properties = {
            filePath: ""
        };
    }

    onAction(action) {
        if (action === "do") {
            this.handleFileOperation();
        }
    }

    async handleFileOperation() {
        let fs = NodeJsSysHelper.getLib("fs");
        if (!fs) return;

        let filePath = this.getInputOrProperty("filePath");
        if (!filePath) {
            NodeJsSysHelper.logError(this.title, "No file path specified.");
            this.triggerSlot("onError");
            return;
        }

        this.performOperation(fs, filePath);
    }

    performOperation(fs, filePath) {
        throw new Error("performOperation must be implemented by subclasses");
    }
}

class SysUtil_FileReadNode extends SysUtil_FileBaseNode {
    constructor() {
        super("Read File", "Reads content from a file.");
        this.addOutput("fileContent", "string");
    }

    performOperation(fs, filePath) {
        try {
            let data = fs.readFileSync(filePath, "utf8");
            this.setOutputData("fileContent", data);
            this.triggerSlot("onSuccess");
        } catch (error) {
            NodeJsSysHelper.logError(this.title, `Error reading file: ${filePath}`);
            this.triggerSlot("onError");
        }
    }
}
LiteGraph.registerNodeType("sys/fileRead", SysUtil_FileReadNode);


class SysUtil_FileWriteNode extends SysUtil_FileBaseNode {
    constructor() {
        super("Write File", "Writes content to a file.");
        this.addInput("content", "string", { param_bind: true });
        this.properties.content = "";
    }

    performOperation(fs, filePath) {
        let content = this.getInputOrProperty("content");
        try {
            fs.writeFileSync(filePath, content, "utf8");
            this.triggerSlot("onSuccess");
        } catch (error) {
            NodeJsSysHelper.logError(this.title, `Error writing to file: ${filePath}`);
            this.triggerSlot("onError");
        }
    }
}
LiteGraph.registerNodeType("sys/fileWrite", SysUtil_FileWriteNode);


class SysUtil_FileDeleteNode extends SysUtil_FileBaseNode {
    constructor() {
        super("Delete File", "Deletes a file.");
    }

    performOperation(fs, filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                this.triggerSlot("onSuccess");
            } else {
                NodeJsSysHelper.logError(this.title, `File not found: ${filePath}`);
                this.triggerSlot("onError");
            }
        } catch (error) {
            NodeJsSysHelper.logError(this.title, `Error deleting file: ${filePath}`);
            this.triggerSlot("onError");
        }
    }
}
LiteGraph.registerNodeType("sys/fileDelete", SysUtil_FileDeleteNode);


class SysUtil_FileExistsNode extends SysUtil_FileBaseNode {
    constructor() {
        super("File Exists", "Checks if a file exists.");
        this.addOutput("exists", "boolean");
    }

    performOperation(fs, filePath) {
        try {
            let exists = fs.existsSync(filePath);
            this.setOutputData("exists", exists);
            this.triggerSlot("onSuccess");
        } catch (error) {
            NodeJsSysHelper.logError(this.title, `Error checking file: ${filePath}`);
            this.triggerSlot("onError");
        }
    }
}
LiteGraph.registerNodeType("sys/fileExists", SysUtil_FileExistsNode);


class SysUtil_FileListNode extends SysUtil_FileBaseNode {
    constructor() {
        super("List Directory", "Lists files in a directory.");
        this.addOutput("fileList", "array");
    }

    performOperation(fs, filePath) {
        try {
            if (!fs.existsSync(filePath) || !fs.lstatSync(filePath).isDirectory()) {
                NodeJsSysHelper.logError(this.title, `Directory not found: ${filePath}`);
                this.triggerSlot("onError");
                return;
            }
            let files = fs.readdirSync(filePath);
            this.setOutputData("fileList", files);
            this.triggerSlot("onSuccess");
        } catch (error) {
            NodeJsSysHelper.logError(this.title, `Error listing directory: ${filePath}`);
            this.triggerSlot("onError");
        }
    }
}
LiteGraph.registerNodeType("sys/fileList", SysUtil_FileListNode);
