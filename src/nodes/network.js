import { LiteGraph } from "../litegraph.js";

class LGWebSocket {

    static title = "WS Client";
    static desc = "Connect to a WebSocket to send and receive data";

    constructor() {
        this.size = [60, 20];
        this.addInput("event_data", LiteGraph.ACTION);
        this.addOutput("on_received", LiteGraph.EVENT);
        this.addInput("in", 0);
        this.addOutput("out", 0);
        this.properties = {
            url: "ws://127.0.0.1:8080",
            room: false,
            auto_send_input: false,
            only_send_changes: true,
            runOnServerToo: false
        };
        this._ws = null;
        this._last_sent_data = [];
        this._last_received_data = [];
        this._hasWarned = false; // To ensure warning is only logged once
    }

    onPropertyChanged(name, _value) {
        if (name === "url") {
            this.connectSocket();
        }
    }

    onExecute() {
        if (!this._ws && this.properties.url) {
            this.connectSocket();
        }

        if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
            return;
        }

        const room = this.properties.room;
        const only_changes = this.properties.only_send_changes;

        if(this.properties.auto_send_input){
            for (let i = 1; i < this.inputs.length; ++i) {
                const data = this.getInputData(i);
                if (data == null) {
                    continue;
                }

                let json;
                try {
                    json = {
                        type: 0,
                        channel: i,
                        data: data,
                    };
                    if (room) json.room = room;
                    json = JSON.stringify(json);
                } catch (err) {
                    console.error("Error stringifying data:", err);
                    continue;
                }

                if (only_changes && this._last_sent_data[i] === json) {
                    continue;
                }
                this._last_sent_data[i] = json;
                try {
                    this._ws.send(json);
                    console.log("WS sent by execute:", i, json);
                } catch (err) {
                    console.error("Error sending data:", err);
                }
            }
        }

        // force update output?
        // for (let i = 1; i < this.outputs.length; ++i) {
        //     if(i in this._last_received_data){
        //         this.setOutputData(i, this._last_received_data[i]);
        //     }
        // }

        // reset color
        if (this.boxcolor === "#AFA") {
            this.boxcolor = "#6C6";
        }
    }

    connectSocket() {
        if (typeof process !== 'undefined' && process.versions && process.versions.node) {
            if (!this.properties.runOnServerToo) {
                if (!this._hasWarned) {
                    console.warn("WsClient: not allowed to run on the server. Set 'runOnServerToo' to true to enable.");
                    this._hasWarned = true;
                }
                return;
            }
        }

        if (this._ws) {
            this._ws.close();
        }

        const url = this.properties.url.startsWith("ws") ? this.properties.url : "ws://" + this.properties.url;
        try {
            this._ws = new WebSocket(url);
        } catch (err) {
            console.error("Error creating WebSocket:", err);
            return;
        }

        this._ws.onopen = () => {
            console.log("WS ready");
            this.boxcolor = "#6C6";
        };

        this._ws.onmessage = (e) => {
            this.boxcolor = "#AFA";
            console.info("WS on message:", e.data);

            let data = e.data;

            if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                } catch (err) {
                    console.warn("Received non-JSON data:", data);
                }
            } else if (data instanceof ArrayBuffer) {
                console.log("Received binary data");
                const byteArray = new Uint8Array(data);
                const binaryString = new TextDecoder('utf-8').decode(byteArray);
                console.log("Binary data as string:", binaryString);
                const binaryBase64 = btoa(String.fromCharCode.apply(null, byteArray));
                console.log("Binary data as base64:", binaryBase64);
                data = binaryString;
            }

            if (data.room && data.room !== this.properties.room) {
                console.debug("WS: received message for different room");
                return;
            }
            
            // TODO data.channel is i, or 1 default : this.setOutputData(i, this._last_received_data[i]);

            const channelX = data.channel !== undefined ? data.channel : 1;
            const dataData_defined = typeof(data.data) !== "undefined";
            const dataX = dataData_defined ? data.data : data;
            // data.type == 1 comes from unknown source: it will create a temporary LiteGraph object
            if (data?.type === 1) {
                if (data.data?.object_class && LiteGraph[data.data.object_class]) {
                    try {
                        console.debug("WS executing LiteGraph object:", obj, data.data);
                        const obj = new LiteGraph[data.data.object_class](data.data);
                        // channelX = data.data.object_class;
                        dataX = data.data.object_class;
                        console.debug("WS created temporary LG object:", obj);
                    } catch (err) {
                        console.error("WS Error creating object:", err);
                    }
                } else if (dataData_defined) {
                    console.debug("WS type1 received data:", data.data);
                } else {
                    console.debug("WS type1 received UNKNOWN data:", data);
                }
            } else {
                if (dataData_defined) {
                    console.debug("WS received channel data:", data.channel, data.data);
                } else {
                    console.debug("WS received UNKNOWN data:", data);
                }
            }
            this._last_received_data[channelX] = dataX;
            this.setOutputData(channelX, dataX);
            this.triggerSlot(0, dataX);
        };

        this._ws.onerror = (err) => {
            console.error("WS connection error:", err);
            this.boxcolor = "#E88";
        };

        this._ws.onclose = () => {
            console.log("WS connection closed");
            this.boxcolor = "#000";
        };
    }

    disconnectSocket() {
        if (this._ws) {
            this._ws.close();
            this._ws = null;
        }
    }

    send(data) {
        if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
            return;
        }
        const msg = { type: 1, data: data }; //JSON.stringify();
        try {
            this._ws.send(msg);
            console.log("WS sent:", msg);
        } catch (err) {
            console.error("Error sending data:", err);
        }
    }

    onAction(action, param) {
        if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
            return;
        }
        const oMsg = {
            type: 1,
            action: action,
            data: param,
        };
        if (this.properties.room) oMsg.room = this.properties.room;
        const msg = JSON.stringify(oMsg);
        try {
            this._ws.send(msg);
            console.log("WS sent by Action:", oMsg);
        } catch (err) {
            console.error("Error sending data by action:", err);
        }
    }

    onGetInputs() {
        return [["in", 0]];
    }

    onGetOutputs() {
        return [["out", 0]];
    }

    onRemove() {
        this.disconnectSocket();
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

