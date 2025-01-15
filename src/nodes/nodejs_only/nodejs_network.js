// WIP NODE_ONLY NETWORK


/**
 * To use this WebSocket server node, ensure you have the 'ws' package installed.
 * Install it using the following command:
 * 
 * npm install ws
 */
class LGWebSocketServer {
    static title = "WebSocket Server";
    static desc = "WebSocket server node";

    constructor() {
        this.size = [60, 20];
        this.addInput("send", LiteGraph.ACTION);
        this.addOutput("received", LiteGraph.EVENT);
        this.addInput("in", 0);
        this.addOutput("out", 0);
        this.properties = {
            port: 8080,
            room: false,
            only_send_changes: true,
            broadcast: true,
        };
        this._wsServer = null;
        this._clients = new Set();
        this._last_sent_data = [];
        this._last_received_data = [];

        if (typeof process === 'undefined' || process.browser) {
            console.warn("WebSocket Server node is designed to run in Node.js, not in a browser.");
            this.boxcolor = "#FF0000";
            this.title = "WSServer (run on server)";
        } else {
            this.startWebSocketServer();
        }
    }

    onPropertyChanged(name, _value) {
        if (name == "port" && this._wsServer) {
            this.restartWebSocketServer();
        }
    }

    onExecute() {
        if (!this._wsServer) {
            return;
        }

        // const room = this.properties.room;
        const only_changes = this.properties.only_send_changes;

        for (let i = 1; i < this.inputs.length; ++i) {
            const data = this.getInputData(i);
            if (data == null) {
                continue;
            }

            let json;
            try {
                json = JSON.stringify({
                    type: 0,
                    // room: room,
                    channel: i,
                    data: data,
                });
            } catch (err) {
                console.error("Error stringifying data:", err);
                continue;
            }

            if (only_changes && this._last_sent_data[i] == json) {
                continue;
            }

            this._last_sent_data[i] = json;
            for (const client of this._clients) {
                if (client.readyState === 1) { // WebSocket.OPEN
                    client.send(json);
                }
            }
            console.log?.("WS sent by execute:", i, json);
        }

        for (let i = 1; i < this.outputs.length; ++i) {
            this.setOutputData(i, this._last_received_data[i]);
        }

        if (this.boxcolor == "#AFA") {
            this.boxcolor = "#6C6";
        }
    }

    startWebSocketServer() {
        const WebSocket = require('ws');
        const port = this.properties.port;

        this._wsServer = new WebSocket.Server({ port });
        this._wsServer.on('connection', (ws) => {
            this._clients.add(ws);
            ws.on('message', (message) => this.handleMessage(ws, message));
            ws.on('close', () => this._clients.delete(ws));
            console.log?.("New client connected");
        });

        this._wsServer.on('listening', () => {
            console.log(`WebSocket server is running on ws://localhost:${port}`);
            this.boxcolor = "#6C6";
        });

        this._wsServer.on('error', (error) => {
            console.error("WebSocket server error:", error);
            this.boxcolor = "#E88";
        });
    }

    restartWebSocketServer() {
        if (this._wsServer) {
            this._wsServer.close(() => {
                this.startWebSocketServer();
            });
        }
    }

    handleMessage(ws, message) {
        this.boxcolor = "#AFA";
        console.info("WS on message:", message);

        let data;
        try {
            data = JSON.parse(message);
        } catch (err) {
            console.error("Error parsing message:", err);
            return;
        }

        // if (data.room && data.room !== this.properties.room) {
        //     console.debug("Message room mismatch:", data.room);
        //     return;
        // }

        if (data.type === 1) {
            if (data.data.object_class && LiteGraph[data.data.object_class]) {
                try {
                    const obj = new LiteGraph[data.data.object_class](data.data);
                    this.triggerSlot(0, obj);
                    console.debug("WS received object:", obj);
                } catch (err) {
                    console.error("Error creating object:", err);
                }
            } else {
                this.triggerSlot(0, data.data);
                console.debug("WS received data:", data.data);
            }
        } else {
            this._last_received_data[data.channel ?? 0] = data.data;
            console.debug("WS received channel data:", data.channel, data.data);
        }

        // Broadcast message to other clients if broadcasting is enabled
        if (this.properties.broadcast) {
            const broadcastMessage = JSON.stringify(data);
            for (const client of this._clients) {
                if (client !== ws && client.readyState === 1) { // WebSocket.OPEN
                    client.send(broadcastMessage);
                }
            }
            console.debug("WS broadcasted message:", broadcastMessage);
        }
    }

    send(data) {
        if (!this._wsServer) {
            return;
        }
        const msg = JSON.stringify({ type: 1, data: data });
        for (const client of this._clients) {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(msg);
            }
        }
        console.log?.("WS sent:", msg);
    }

    onAction(action, param, options) {
        if (!this._wsServer) {
            return;
        }
        const data = this.getInputData("in");
        if (data == null) {
            return; // continue; // 
        }
        const msg = JSON.stringify({
            type: 1,
            // room: this.properties.room,
            action: action,
            data: data, //param,
        });
        for (const client of this._clients) {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(msg);
            }
        }
        console.debug?.("WS sent by Action:", msg, options);
    }

    onGetInputs() {
        return [["in", 0]];
    }

    onGetOutputs() {
        return [["out", 0]];
    }
}
LiteGraph.registerNodeType("network/websocketserver", LGWebSocketServer);


// Note: This node requires the 'dgram' module to be available in Node.js.
// To install, run: npm install dgram

class UDPNode {
    static title = "UDP";
    static desc = "Send and receive data through UDP";

    constructor() {
        this.size = [60, 20];
        this.addInput("send", LiteGraph.ACTION);
        this.addInput("data", 0);
        this.addOutput("received", LiteGraph.EVENT);
        this.addOutput("data", 0);
        this.properties = {
            host: "127.0.0.1",
            port: 41234,
            only_send_changes: true,
        };
        this._dgram = null;
        this._last_sent_data = null;
        this._last_received_data = null;
        this.isNode = (typeof process !== 'undefined' && process.versions && process.versions.node);

        if (this.isNode) {
            console.debug("UDPNode initialized in Node.js environment");
            this.connectSocket();
        } else {
            console.warn("UDPNode can only run on Node.js server");
            this.boxcolor = "#FF0000";
            this.title = "UDP (run on server)";
        }
    }

    onPropertyChanged(name, value) {
        if (name == "host" || name == "port") {
            if (this.isNode) {
                console.debug("Property changed:", name, value);
                this.connectSocket();
            }
        }
    }

    onExecute() {
        if (!this._dgram) {
            if (this.isNode) {
                this.connectSocket();
            } else {
                return;
            }
        }

        var only_changes = this.properties.only_send_changes;

        // Send data
        var data = this.getInputData(1);
        if (data != null) {
            var message = Buffer.from(JSON.stringify(data));

            if (only_changes && this._last_sent_data == message.toString()) {
                return;
            }

            this._last_sent_data = message.toString();

            this._dgram.send(message, 0, message.length, this.properties.port, this.properties.host, (err) => {
                if (err) {
                    console.error('UDP send error:', err);
                } else {
                    console.debug("UDP message sent", message.toString());
                }
            });
        }

        // Receive data
        this.setOutputData(1, this._last_received_data);

        if (this.boxcolor == "#AFA") {
            this.boxcolor = "#6C6";
        }
    }

    connectSocket() {
        const dgram = require('dgram'); // Ensure 'dgram' module is available in Node.js
        if (this._dgram) {
            this._dgram.close();
        }

        this._dgram = dgram.createSocket('udp4');

        this._dgram.on('message', (msg, rinfo) => {
            this._last_received_data = JSON.parse(msg.toString());
            this.triggerSlot(0, this._last_received_data);
            console.debug('UDP message received', msg.toString());
        });

        this._dgram.on('error', (err) => {
            console.error('UDP error:', err);
            this._dgram.close();
        });

        this._dgram.on('listening', () => {
            const address = this._dgram.address();
            console.debug(`UDP server listening ${address.address}:${address.port}`);
        });

        this._dgram.bind(this.properties.port);
    }

    onAction(action, param) {
        this.send(param);
    }

    onGetInputs() {
        return [["data", 0]];
    }

    onGetOutputs() {
        return [["data", 0]];
    }

    onRemoved() {
        if (this._dgram) {
            this._dgram.close();
        }
    }
}
LiteGraph.registerNodeType("network/udp", UDPNode);