
class NodeProcessInfo {
    constructor() {
        this.output = this.getSystemInfo();
        this.os = require("os");
    }

    getSystemInfo() {
        return {
            platform: process.platform,
            arch: process.arch,
            cpuCores: this.os.cpus().length,
            freeMemory: this.os.freemem(),
            totalMemory: this.os.totalmem(),
            uptime: this.os.uptime(),
        };
    }

    onExecute() {
        this.setOutputData(0, this.output);
    }
}

LiteGraph.registerNodeType("server/process/NodeProcessInfo", NodeProcessInfo);