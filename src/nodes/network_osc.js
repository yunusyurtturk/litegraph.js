// Note: This node requires the 'osc' library to be integrate in both cases: running in browser or Node.js.
// To install, run: npm install osc
// there are two node libraries: osc and osc-js, using osc here because have browser counterpart

class OSCNode {
    static title = "OSC";
    static desc = "Send and receive data through OSC";

    constructor() {
        this.size = [100, 60];
        this.addInput("send", LiteGraph.ACTION);
        this.addInput("data", 0);
        this.addOutput("received", LiteGraph.EVENT);
        this.addOutput("data", 0);
        this.properties = {
            host: "127.0.0.1",
            port: 57121,
            localPort: 57120,
            address: "/osc/address",
            useWebSocket: true,
            webSocketURL: "ws://localhost:8080"
        };
        this._osc = null;
        this._lastReceivedData = null;
        this.isNode = (typeof process !== 'undefined' && process.versions && process.versions.node);
        this._connected = false;
        this._cant_connect = false;
    }

    onPropertyChanged(name, value) {
        if (["host", "port", "localPort", "address", "useWebSocket", "webSocketURL"].includes(name)) {
            this._cant_connect = false;
            this.initConnection();
        }
    }

    initConnection() {
        if (this._osc) {
            this._osc.close();
            this._osc = null;
        }
        if(typeof(this._title)=="undefined"){
            this._title = this.title;
        }
        if (this.isNode) {
            this.initNodeOSC();
            if(typeof(this._title)!=="undefined") this.title = this._title;
        } else if (this.properties.useWebSocket) {
            this.initBrowserOSC();
            if(typeof(this._title)!=="undefined") this.title = this._title;
        } else {
            console.warn("OSCNode can only run on Node.js server or WebSocket in the browser");
            this.boxcolor = "#FF0000";
            this.title = "OSC (useWebSocket disabled)";
            this._cant_connect = true;
        }
    }

    initNodeOSC() {
        const osc = require('osc');

        try {
            this._osc = new osc.UDPPort({
                localAddress: "0.0.0.0",
                localPort: this.properties.localPort,
                remoteAddress: this.properties.host,
                remotePort: this.properties.port
            });

            this._osc.on("ready", () => {
                console.debug(`OSC server is ready on ${this.properties.localPort}`);
                this._connected = true;
                this.boxcolor = "#00FF00";
            });

            this._osc.on("message", (oscMessage) => {
                this._lastReceivedData = oscMessage.args;
                this.setOutputData(1, this._lastReceivedData);
                this.triggerSlot(0, this._lastReceivedData);
                console.debug("OSC message received:", oscMessage);
            });

            this._osc.on("error", (err) => {
                console.error("OSC error:", err);
                this._connected = false;
                this.boxcolor = "#FF0000";
            });

            this._osc.open();
        } catch (error) {
            console.error("Error initializing Node.js OSC connection:", error);
            this.boxcolor = "#FF0000";
        }
    }

    initBrowserOSC() {
        try {
            this._osc = new WebSocket(this.properties.webSocketURL);

            this._osc.onopen = () => {
                console.debug("WebSocket connection opened");
                this._connected = true;
                this.boxcolor = "#00FF00";
            };

            this._osc.onmessage = (event) => {
                try {
                    const oscMessage = JSON.parse(event.data);
                    this._lastReceivedData = oscMessage.args;
                    this.setOutputData(1, this._lastReceivedData);
                    this.triggerSlot(0, this._lastReceivedData);
                    console.debug("OSC message received via WebSocket:", oscMessage);
                } catch (error) {
                    console.error("Error parsing OSC message via WebSocket:", error);
                }
            };

            this._osc.onerror = (err) => {
                console.error("WebSocket error:", err);
                this._connected = false;
                this.boxcolor = "#FF0000";
            };

            this._osc.onclose = () => {
                console.debug("WebSocket connection closed");
                this._connected = false;
                this.boxcolor = "#AA0000";
            };
        } catch (error) {
            console.error("Error initializing WebSocket OSC connection:", error);
            this.boxcolor = "#FF0000";
        }
    }

    onExecute() {
        if (!this._connected || !this._osc) {
            if (!this._cant_connect) this.initConnection();
            return;
        }

        const data = this.getInputData(1);
        if (data != null) {
            const message = {
                address: this.properties.address,
                args: Array.isArray(data) ? data : [data]
            };

            try {
                if (this.isNode) {
                    this._osc.send(message);
                } else {
                    this._osc.send(JSON.stringify(message));
                }
                console.debug("OSC message sent:", message);
            } catch (error) {
                console.error("Error sending OSC message:", error);
            }
        }

        this.setOutputData(1, this._lastReceivedData);
    }

    onAction(action, param) {
        if (!this._connected || !this._osc) {
            return;
        }

        const message = {
            address: this.properties.address,
            args: Array.isArray(param) ? param : [param]
        };

        try {
            if (this.isNode) {
                this._osc.send(message);
            } else {
                this._osc.send(JSON.stringify(message));
            }
            console.debug("OSC message sent by action:", message);
        } catch (error) {
            console.error("Error sending OSC message by action:", error);
        }
    }

    onRemove() {
        if (this._osc) {
            this._osc.close();
        }
    }

    // onGetInputs() {
    //     return [["send", LiteGraph.ACTION], ["data", 0]];
    // }

    // onGetOutputs() {
    //     return [["received", LiteGraph.EVENT], ["data", 0]];
    // }
}
LiteGraph.registerNodeType("network/osc", OSCNode);