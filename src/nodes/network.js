import { LiteGraph } from "../litegraph.js";

class LGWebSocket {

    static title = "WS Client";
    static desc = "Connect to a WebSocket to send and receive data";

    constructor() {
        this.size = [60, 20];
        this.addInput("send", LiteGraph.ACTION);
        this.addOutput("received", LiteGraph.EVENT);
        this.addInput("in", 0);
        this.addOutput("out", 0);
        this.properties = {
            url: "ws://127.0.0.1:8080",
            room: false,
            only_send_changes: true,
        };
        this._ws = null;
        this._last_sent_data = [];
        this._last_received_data = [];
    }

    onPropertyChanged(name, _value) {
        if (name == "url") {
            this.connectSocket();
        }
    }

    onExecute() {
        if (!this._ws && this.properties.url) {
            this.connectSocket();
        }

        if (!this._ws || this._ws.readyState != WebSocket.OPEN) {
            return;
        }

        var room = this.properties.room;
        var only_changes = this.properties.only_send_changes;

        for (let i = 1; i < this.inputs.length; ++i) {
            var data = this.getInputData(i);
            if (data == null) {
                continue;
            }
            var json;
            try {
                json = JSON.stringify({
                    type: 0,
                    channel: i,
                    data: data,
                });
                if(room) json.room = room;
            } catch (err) {
                continue;
            }
            if (only_changes && this._last_sent_data[i] == json) {
                continue;
            }

            this._last_sent_data[i] = json;
            this._ws.send(json);
            console.log?.("WS sent by execute",i,json);
        }

        for (let i = 1; i < this.outputs.length; ++i) {
            this.setOutputData(i, this._last_received_data[i]);
        }

        if (this.boxcolor == "#AFA") {
            this.boxcolor = "#6C6";
        }
    }

    connectSocket() {
        var that = this;
        var url = this.properties.url;
        if (url.substr(0, 2) != "ws") {
            url = "ws://" + url;
        }
        this._ws = new WebSocket(url);
    
        this._ws.onopen = function () {
            console.log?.("WS ready");
            that.boxcolor = "#6C6";
        };
    
        this._ws.onmessage = function (e) {
            that.boxcolor = "#AFA";
            console.info("WS on message", e.data);
    
            var data = e.data;
    
            if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                } catch (err) {
                    // not JSON, keep it as a string
                }
            } else if (data instanceof ArrayBuffer) {
                // Handling binary data
                console.log("Received binary data");
                var byteArray = new Uint8Array(data);
                // Example: Convert binary data to a string (assuming UTF-8 encoding)
                var binaryString = new TextDecoder('utf-8').decode(byteArray);
                console.log("Binary data as string:", binaryString);
                // Example: Convert binary data to a base64 string (useful for images)
                var binaryBase64 = btoa(String.fromCharCode.apply(null, byteArray));
                console.log("Binary data as base64:", binaryBase64);
                data = binaryString; // or binaryBase64, depending on your use case
            }
    
            if (typeof(data.room) !== "undefined" && data.room && data.room != that.properties.room) {
                console.debug("WS : rec 0 BIS");
                return;
            }
            
            if (typeof(data.type) !== "undefined" && data.type == 1) {
                if (data.data.object_class && LiteGraph[data.data.object_class]) {
                    var obj = null;
                    try {
                        obj = new LiteGraph[data.data.object_class](data.data);
                        that.triggerSlot(0, obj);
                        console.debug("WS : rec 1");
                    } catch (err) {
                        console.debug("WS : rec 1 BIS");
                        return;
                    }
                } else {
                    if (typeof(data.data) !== "undefined") {
                        that.triggerSlot(0, data.data);
                        console.debug("WS : rec 2");
                    } else {
                        // that.triggerSlot(0, data);
                        console.debug("WS : rec 2 BIS");
                    }
                }
            } else {
                if (typeof(data.data) !== "undefined") {
                    that._last_received_data[typeof(data.channel) !== "undefined" ? data.channel : 0] = data.data;
                    console.debug("WS : rec 3");
                } else {
                    // that.triggerSlot(0);
                    console.debug("WS : rec 3 BIS");
                }
            }
        };
    
        this._ws.onerror = function (_e) {
            console.log?.("WS couldn't connect to websocket");
            that.boxcolor = "#E88";
        };
    
        this._ws.onclose = function (_e) {
            console.log?.("WS connection closed");
            that.boxcolor = "#000";
        };
    }
    

    send(data) {
        if (!this._ws || this._ws.readyState != WebSocket.OPEN) {
            return;
        }
        const msg = JSON.stringify({ type: 1, msg: data });
        this._ws.send(msg);
        console.log?.("WS sent",msg);
    }

    onAction(action, param) {
        if (!this._ws || this._ws.readyState != WebSocket.OPEN) {
            return;
        }
        const oMsg = {
            type: 1,
            action: action,
            data: param,
        };
        if(this.properties.room) oMsg.room = this.properties.room;
        const msg = JSON.stringify(oMsg);
        this._ws.send(msg);
        console.log?.("WS sent by Action",oMsg);
    }

    onGetInputs() {
        return [["in", 0]];
    }

    onGetOutputs() {
        return [["out", 0]];
    }
}
LiteGraph.registerNodeType("network/websocket", LGWebSocket);


// HTTP Request
class HTTPRequestNode {

    static title = "HTTP Request";
    static desc = "Fetch data through HTTP";

    constructor() {
        this.addInput("request", LiteGraph.ACTION);
        this.addInput("url", "string");
        this.addProperty("url", "");
        this.addOutput("ready", LiteGraph.EVENT);
        this.addOutput("data", "string");
        this.addWidget("button", "Fetch", null, this.fetch.bind(this));
        this._data = null;
        this._fetching = null;
    }

    fetch() {
        var url = this.getInputOrProperty("url");
        if (!url)
            return;

        this.boxcolor = "#FF0";
        var that = this;
        this._fetching = fetch(url)
            .then((resp) => {
                if (!resp.ok) {
                    this.boxcolor = "#F00";
                    that.trigger("error");
                } else {
                    this.boxcolor = "#0F0";
                    return resp.text();
                }
            })
            .then((data) => {
                that._data = data;
                that._fetching = null;
                that.trigger("ready");
            });
    }

    onAction(evt) {
        if (evt == "request")
            this.fetch();
    }

    onExecute() {
        this.setOutputData(1, this._data);
    }

    onGetOutputs() {
        return [["error", LiteGraph.EVENT]];
    }
}
LiteGraph.registerNodeType("network/httprequest", HTTPRequestNode);


// -------------- TODO TEST ---------------
class WebRTCNode {
    static title = "WebRTC";
    static desc = "Send and receive data through WebRTC";

    constructor() {
        this.size = [100, 60];
        this.addInput("send", LiteGraph.ACTION);
        this.addInput("data", 0);
        this.addInput("offer", "string");
        this.addInput("answer", "string");
        this.addOutput("offer", "string");
        this.addOutput("answer", "string");
        this.addOutput("received", LiteGraph.EVENT);
        this.addOutput("data", 0);
        this.properties = {
            signalingServer: "",
            stunServer: "", // stun:stun.l.google.com:19302
            turnServer: "",
            username: "",
            credential: ""
        };
        this.peerConnection = null;
        this.dataChannel = null;
        this._lastReceivedData = null;
    }

    onPropertyChanged(name, value) {
        if (["signalingServer", "stunServer", "turnServer", "username", "credential"].includes(name)) {
            this.createPeerConnection();
        }
    }

    createPeerConnection() {
        if (!this.properties.stunServer || (!this.properties.turnServer && (this.properties.username || this.properties.credential))) {
            console.warn("Incomplete WebRTC configuration. Ensure stunServer and (optionally) turnServer with username and credential are set.");
            return;
        }

        try {
            if (this.peerConnection) {
                this.peerConnection.close();
            }

            const iceServers = [
                { urls: this.properties.stunServer }
            ];

            if (this.properties.turnServer) {
                iceServers.push({
                    urls: this.properties.turnServer,
                    username: this.properties.username,
                    credential: this.properties.credential
                });
            }

            this.peerConnection = new RTCPeerConnection({ iceServers });

            this.peerConnection.ondatachannel = (event) => {
                this.dataChannel = event.channel;
                this.setupDataChannel();
            };

            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.debug("ICE candidate:", event.candidate);
                } else {
                    if (this.peerConnection.localDescription.type === "offer") {
                        this.setOutputData(0, JSON.stringify(this.peerConnection.localDescription));
                    } else {
                        this.setOutputData(1, JSON.stringify(this.peerConnection.localDescription));
                    }
                }
            };

            this.dataChannel = this.peerConnection.createDataChannel("dataChannel");
            this.setupDataChannel();

            this.peerConnection.createOffer()
                .then(offer => this.peerConnection.setLocalDescription(offer))
                .catch(error => console.error("Error creating offer:", error));
        } catch (error) {
            console.error("Error creating peer connection:", error);
        }
    }

    setupDataChannel() {
        if (!this.dataChannel) return;

        this.dataChannel.onopen = () => {
            console.debug("Data channel open");
            this.boxcolor = "#00FF00";
        };

        this.dataChannel.onclose = () => {
            console.debug("Data channel closed");
            this.boxcolor = "#990000";
        };

        this.dataChannel.onmessage = (event) => {
            try {
                const receivedData = JSON.parse(event.data);
                this._lastReceivedData = receivedData;
                this.setOutputData(3, receivedData);
                this.triggerSlot(2, receivedData);
                console.debug("Data received:", event.data);
            } catch (error) {
                console.error("Error parsing received data:", error);
            }
        };

        this.dataChannel.onerror = (error) => {
            console.error("Data channel error:", error);
            this.boxcolor = "#FF0000";
        };
    }

    onExecute() {
        if (!this.peerConnection) {
            this.createPeerConnection();
        }

        if (this.dataChannel && this.dataChannel.readyState === "open") {
            const data = this.getInputData(1);
            if (data != null) {
                try {
                    this.dataChannel.send(JSON.stringify(data));
                    console.debug("Data sent:", data);
                } catch (error) {
                    console.error("Error sending data:", error);
                }
            }
        }

        this.setOutputData(3, this._lastReceivedData);
    }

    onAction(action, param) {
        if (!this.peerConnection) {
            this.createPeerConnection();
        }

        if (this.dataChannel && this.dataChannel.readyState === "open") {
            try {
                this.dataChannel.send(JSON.stringify(param));
                console.debug("Data sent by action:", param);
            } catch (error) {
                console.error("Error sending data by action:", error);
            }
        }
    }

    onConnectionsChange(input) {
        if (input && input.type === "string") {
            if (input.name === "offer") {
                this.handleOffer(input.data);
            } else if (input.name === "answer") {
                this.handleAnswer(input.data);
            }
        }
    }

    async handleOffer(offer) {
        try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(offer)));
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            this.setOutputData(1, JSON.stringify(answer));
        } catch (error) {
            console.error("Error handling offer:", error);
        }
    }

    async handleAnswer(answer) {
        try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(answer)));
        } catch (error) {
            console.error("Error handling answer:", error);
        }
    }

    onRemove() {
        if (this.peerConnection) {
            this.peerConnection.close();
        }
    }

    // onGetInputs() {
    //     return [["send", LiteGraph.ACTION], ["data", 0], ["offer", "string"], ["answer", "string"]];
    // }

    // onGetOutputs() {
    //     return [["offer", "string"], ["answer", "string"], ["received", LiteGraph.EVENT], ["data", 0]];
    // }
}
LiteGraph.registerNodeType("network/webrtc", WebRTCNode);



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




// -------------- NODE JS ONLY ---------------


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
        const msg = JSON.stringify({ type: 1, msg: data });
        for (const client of this._clients) {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(msg);
            }
        }
        console.log?.("WS sent:", msg);
    }

    onAction(action, param) {
        if (!this._wsServer) {
            return;
        }
        const msg = JSON.stringify({
            type: 1,
            // room: this.properties.room,
            action: action,
            data: param,
        });
        for (const client of this._clients) {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(msg);
            }
        }
        console.log?.("WS sent by Action:", msg);
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

    onRemove() {
        if (this._dgram) {
            this._dgram.close();
        }
    }
}
LiteGraph.registerNodeType("network/udp", UDPNode);