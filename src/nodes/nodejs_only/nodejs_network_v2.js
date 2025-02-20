// WIP (not yet good) TESTING on NODE litegraph-executor

// const { getGlobalObject } = require("../../global");
// import { LiteGraph } from "../../litegraph.js";

// TODO use librarymanager to include ws

// conditional include (only on server)
// if(typeof(require)!=="undefined"){
//     const WebSocket = require('ws');
// }
//>>NODEJS_ENABLE_CODE_START>>
//const WebSocket = require('ws');
//<<NODEJS_ENABLE_CODE_END<<

// -- client only libraries --

// -- client&server libraries --
// LiteGraph.LibraryManager.registerLibrary({
//     key: "socket.io-client",
//     version: "4.6.1",
//     globalObject: "ioclient",
//     browser: { /*local: "/libs/socket.io.js",*/ remote: "https://cdn.jsdelivr.net/npm/socket.io-client@4.6.1/dist/socket.io.min.js" },
//     server: { npm: ["socket.io-client"], /*remote: "https://cdn.jsdelivr.net/npm/socket.io-client@4.6.1/dist/socket.io.min.js"*/ }
// });
// LiteGraph.LibraryManager.loadLibrary("socket.io-client");

// -- server only libraries --
LiteGraph.LibraryManager.registerLibrary({
    key: "socket.io",
    // version: "4.6.1",
    globalObject: "ioserver",
    browser: { },
    server: { 
        npm: "socket.io" // server-side package for Node.js
    },
    defaultExport: "Server"
});
LiteGraph.LibraryManager.loadLibrary("socket.io");

LiteGraph.LibraryManager.registerLibrary({
    key: "http",
    // version: "4.6.1",
    globalObject: "http",
    browser: { },
    server: { 
        npm: "http"
    }
});
LiteGraph.LibraryManager.loadLibrary("http");

class LocalWebSocketServer {
    static title = "WebSocket Server";
    static desc = "Instantiate a local WebSocket server";

    constructor() {
        this.server = null;
        this.clients = new Set();
        this.properties = {
            port: 8080,
            should_autoconnect: true
        };
        this.status = 'stopped'; // possible values: stopped, starting, running, stopping, failed
        this.retryTimeout = 5000; // Retry interval in milliseconds
        this.retryLimit = 5; // Max number of retries
        this.retryCount = 0;

        if (typeof process === 'undefined' || process.browser) {
            console.warn("WebSocket Server node is designed to run in Node.js, not in a browser.");
            this.boxcolor = "#FF0000";
            this.title = "WSServer (run on server)";
        } else {
            this.startServer();
        }
    }

    onPropertyChanged(name, value) {
        console.log(`Property changed: ${name} = ${value}`);
        if (name === 'port' && this.status === 'running') {
            if(this.properties.port !== value){
                this.stopServer(() => {
                    this.properties.port = value;
                    if (this.properties.should_autoconnect) {
                        console.log(`WSServer autoconnect on property change, port ${this.properties.port}`);
                        this.startServer();
                    }
                });
            }else{
                console.log(`WSServer port unchanged ${this.properties.port}`);
            }
        } else {
            this.properties[name] = value;
        }
    }

    startServer() {
        if (typeof process === 'undefined' || process.browser) {
            // console.warn("WebSocket Server node is designed to run in Node.js, not in a browser.");
            return false;
        }
        if (this.status === 'starting' || this.status === 'running') {
            console.log('WebSocket server is already starting or running.');
            return;
        }

        this.status = 'starting';
        console.log(`WSServer will start on port ${this.properties.port}`);

        try {
            this.server = new WebSocket.Server({ port: this.properties.port });
            console.log("WebSocketServer object created");

            this.server.on('listening', () => {
                this.status = 'running';
                this.retryCount = 0; // Reset retry count on successful start
                console.log(`WSServer server listening on port ${this.properties.port}`);
                this.onStarted();
            });

            this.server.on('connection', (ws) => {
                this.clients.add(ws);
                console.log('New client connected');
                ws.on('message', this._onMessage.bind(this, ws));
                ws.on('close', () => {
                    this.clients.delete(ws);
                    console.log('Client disconnected');
                });
                ws.on('error', (error) => {
                    console.error('WebSocket error:', error);
                });
                ws.send('Welcome to the WebSocket server!');
            });

            this.server.on('error', (error) => {
                console.error('WebSocket server error:', error);
                this.status = 'failed';
                if (this.retryCount < this.retryLimit) {
                    console.log(`Retrying to start the server in ${this.retryTimeout / 1000} seconds...`);
                    setTimeout(() => {
                        this.retryCount++;
                        this.startServer();
                    }, this.retryTimeout);
                } else {
                    console.error('Max retry limit reached. Server failed to start.');
                }
            });

        } catch (e) {
            console.error("WebSocketServer failed", e);
            this.status = 'failed';
            if (this.retryCount < this.retryLimit) {
                console.log(`Retrying to start the server in ${this.retryTimeout / 1000} seconds...`);
                setTimeout(() => {
                    this.retryCount++;
                    this.startServer();
                }, this.retryTimeout);
            } else {
                console.error('Max retry limit reached. Server failed to start.');
            }
        }

        setTimeout(() => {
            if(this.status === "starting"){
                if (this.retryCount < this.retryLimit) {
                    console.log(`Retrying to start the server in ${this.retryTimeout / 1000} seconds...`);
                    this.retryCount++;
                    this.startServer();
                } else {
                    console.error('Max retry limit reached. Server failed to start.');
                }
            }else{
                console.log("Checked ws server started");
            }
        }, this.retryTimeout);

        console.log("startServer processed, should be connected or retry on fail");
    }

    _onMessage(ws, message) {
        const receivedMessage = typeof message === 'string' ? message : message.toString();
        console.log('Received:', receivedMessage);
        // Echo the message back to all connected clients
        this.sendToAllClients(receivedMessage);
    }

    stopServer(callback) {
        this.status = 'stopping';
        if (this.server) {
            this.server.close(() => {
                this.status = 'stopped';
                this.onStopped();
                console.log('WebSocket server stopped');
                if (callback) callback();
            });
        }
    }

    sendToAllClients(message) {
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    onStarted() {
        console.log('Server started');
        // Trigger onStarted output event
        this.triggerSlot('onStarted');
    }

    onStopped() {
        console.log('Server stopped');
        // Trigger onStopped output event
        this.triggerSlot('onStopped');
    }

    onExecute() {
        const port = this.getInputOrProperty('port');
        const should_autoconnect = this.getInputOrProperty('should_autoconnect');

        if (port) {
            this.properties.port = port;
        }

        if (should_autoconnect !== undefined) {
            this.properties.should_autoconnect = should_autoconnect;
        }

        if (this.status === 'stopped' && this.properties.should_autoconnect) {
            console.log(`WSServer autoconnect on execute, port ${this.properties.port}`);
            this.startServer();
        }

        this.setOutputData(0, this.status);
    }

    onGetInputs() {
        return [["port", "number"], ["should_autoconnect", "boolean"]];
    }

    onGetOutputs() {
        return [["status", "string"], ["onStarted", LiteGraph.EVENT], ["onStopped", LiteGraph.EVENT]];
    }
}

// Register the node type for LiteGraph
LiteGraph.registerNodeType("nodejs/network/websocket_server", LocalWebSocketServer);

// Export the class for Node.js
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = LocalWebSocketServer;
}


// if(typeof(require) == "function"){
//     const WebSocket = require('ws');
// }

// class LocalWebSocketServer {
//     static title = "WebSocket Server";
//     static desc = "Instantiate a local WebSocket server";

//     constructor() {
//         // this._checkNodeEnvironment();
//         this.server = null;
//         this.clients = new Set();
//         this.properties = {
//             port: 8080,
//             should_autoconnect: true
//         };
//         this.status = 'stopped'; // possible values: stopped, starting, running, stopping, failed
//     }

//     _checkNodeEnvironment() {
//         if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
//             throw new Error('This class can only be run in a Node.js environment.');
//         }
//     }

//     onPropertyChanged(name, value) {
//         if (name === 'port' && this.status === 'running') {
//             this.stopServer(() => {
//                 this.properties.port = value;
//                 if (this.properties.should_autoconnect) {
//                     this.startServer();
//                 }
//             });
//         } else {
//             // no need to update
//             // this.properties[name] = value;
//         }
//     }

//     startServer() {
//         this.status = 'starting';

//         try{
//             this.server = new WebSocket.Server({ port: this.properties.port }, () => {
//                 this.status = 'running';
//                 this.onStarted();
//                 console.log(`WSServer server started on port ${this.properties.port}`);
//             });
//         }catch(e){
//             console.warn("WebSocketServer","failed",e);
//             this.status = 'failed';
//             return;
//         }

//         this.server.on('connection', (ws) => {
//             this.clients.add(ws);
//             console.log('New client connected');
//             ws.on('message', this._onMessage.bind(this, ws));
//             ws.on('close', () => {
//                 this.clients.delete(ws);
//                 console.log('Client disconnected');
//             });
//             ws.on('error', (error) => {
//                 console.error('WebSocket error:', error);
//             });
//         });

//         this.server.on('error', (error) => {
//             console.error('WebSocket server error:', error);
//             this.status = 'stopped';
//         });
//     }

//     _onMessage(ws, message) {
//         console.log('Received:', message, ws);
//         // Echo the message back to all connected clients
//         this.clients.forEach(client => {
//             if (client.readyState === WebSocket.OPEN) {
//                 client.send(message);
//             }
//         });
//     }

//     stopServer(callback) {
//         this.status = 'stopping';
//         if (this.server) {
//             this.server.close(() => {
//                 this.status = 'stopped';
//                 this.onStopped();
//                 console.log('WebSocket server stopped');
//                 if (callback) callback();
//             });
//         }
//     }

//     sendToAllClients(message) {
//         this.clients.forEach(client => {
//             if (client.readyState === WebSocket.OPEN) {
//                 client.send(message);
//             }
//         });
//     }

//     onStarted() {
//         console.log('Server started');
//         // Trigger onStarted output event
//         this.triggerSlot('onStarted');
//     }

//     onStopped() {
//         console.log('Server stopped');
//         // Trigger onStopped output event
//         this.triggerSlot('onStopped');
//     }

//     onExecute() {
//         const port = this.getInputOrProperty('port');
//         const should_autoconnect = this.getInputOrProperty('should_autoconnect');

//         if (port) {
//             this.properties.port = port;
//         }

//         if (should_autoconnect !== undefined) {
//             this.properties.should_autoconnect = should_autoconnect;
//         }

//         if (this.status === 'stopped' && this.properties.should_autoconnect) {
//             this.startServer();
//         }

//         this.setOutputData(0, this.status);
//     }

//     onGetInputs() {
//         return [["port", "number"], ["should_autoconnect", "boolean"]];
//     }

//     onGetOutputs() {
//         return [["status", "string"], ["onStarted", LiteGraph.EVENT], ["onStopped", LiteGraph.EVENT]];
//     }
// }
// LiteGraph.registerNodeType("nodejs/network/websocket_server", LocalWebSocketServer);

// if(typeof module !== "undefined"){
//     module.exports = LocalWebSocketServer;
// }


class SocketIOServerNode {
    static title = "Socket.io Server";
    static desc = "Creates a Socket.io server for real-time communication.";

    constructor() {
        this.addOutput("status", "string");
        this.addOutput("onStarted", LiteGraph.EVENT);
        this.addOutput("onStopped", LiteGraph.EVENT);
        this.addOutput("message", "string");

        this.properties = {
            port: 3000,
            should_autoconnect: true
        };

        this.server = null;
        this.io = null;
        this._io_server_pkg = null;
        this.clients = new Set();
        this.status = "stopped"; // stopped, starting, running, stopping, failed

        if (typeof process === "undefined" || process.browser) {
            console.warn("Socket.io Server Node is designed to run in Node.js.");
            this.boxcolor = "#FF0000";
            this.title = "Socket.io (run on server)";
        } else if (this.properties.should_autoconnect) {
            this.startServer();
        }
    }

    onPropertyChanged(name, value) {
        if (name === "port" && this.status === "running") {
            this.stopServer(() => {
                this.properties.port = value;
                this.startServer();
            });
        } else {
            this.properties[name] = value;
        }
    }

    startServer() {
        if(typeof(io) == "undefined"){
            console.warn("please install socketio library");
            return;
        }
        if (!this._io_server_pkg) {
            if (typeof(io) == "function") {
                this._io_server_pkg = io;
            } else if (typeof(io) == "object" && typeof(io.Server) == "function") {
                this._io_server_pkg = io.Server; // server constructor from socket.io package
            // }
            // if (typeof(ioserver) == "function") {
            //     this._io_server_pkg = io;
            // } else if (typeof(io) == "object" && typeof(ioserver.Server) == "function") {
            //     this._io_server_pkg = ioserver.Server; // server constructor from socket.io package
            } else {
                const gloIo = LiteGraph.getGlobalVariable("ioserver");
                console.warn("socketio library not ready");
                if (typeof(gloIo) == "function") {
                    this._io_server_pkg = gloIo;
                } else if (typeof(gloIo) == "object" && typeof(gloIo.Server) == "function") {
                    this._io_server_pkg = gloIo.Server; // server constructor from socket.io package
                }
            }
        }
        if (!this._io_server_pkg) {
            return;
        }
        if (typeof process === "undefined" || process.browser) {
            console.warn("Socket.io Server Node is designed to run in Node.js.");
            return;
        }
        if (this.status === "starting" || this.status === "running") {
            console.log("Socket.io server is already running.");
            return;
        }

        this.status = "starting";
        console.log(`Starting Socket.io server on port ${this.properties.port}...`);

        try {
            // const server = require("http").createServer();
            this.io = new this._io_server_pkg(this.properties.port,{
                cors:{
                    origin: "*", // Allow all origins (or specify allowed domains)
                    methods: ["GET", "POST"] // Allow specific HTTP methods
                }
            });

            this.io.on("connection", (socket) => {
                this.clients.add(socket);
                console.log("New client connected:", socket.id);

                socket.on("message", (data) => {
                    console.log("Received:", data);
                    this.triggerSlot("message", data);
                    this.broadcast("message", data);
                });

                socket.on("disconnect", () => {
                    this.clients.delete(socket);
                    console.log("Client disconnected:", socket.id);
                });

                socket.emit("welcome", "Welcome to the Socket.io server!");
            });

            console.log(`Socket.io constructed ${this.io}...`);

        } catch (e) {
            console.error("Socket.io Server failed to start:", e);
            this.status = "failed";
        }
    }

    stopServer(callback) {
        if (this.server) {
            this.status = "stopping";
            this.server.close(() => {
                this.status = "stopped";
                console.log("Socket.io server stopped.");
                this.triggerSlot("onStopped");
                if (callback) callback();
            });
        }
    }

    broadcast(event, data) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }

    onExecute() {
        const port = this.getInputOrProperty("port");
        if (port) this.properties.port = port;

        if (this.status === "stopped" && this.properties.should_autoconnect) {
            this.startServer();
        }

        this.setOutputData(0, this.status);
    }

    onGetInputs() {
        return [["port", "number"], ["should_autoconnect", "boolean"]];
    }

    onGetOutputs() {
        return [["status", "string"], ["onStarted", LiteGraph.EVENT], ["onStopped", LiteGraph.EVENT], ["message", "string"]];
    }

    triggerSlot(name, data) {
        console.log(`Event triggered: ${name} ->`, data);
    }
}

// Register for LiteGraph
LiteGraph.registerNodeType("nodejs/network/socketio_server", SocketIOServerNode);

// Export for Node.js
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    module.exports = SocketIOServerNode;
}


// --------------------- OSC -----------------------

LiteGraph.LibraryManager.registerLibrary({
    key: "osc-js-node",
    version: "2.4.1",
    globalObject: "oscnode",
    // browser: { remote: "https://cdn.jsdelivr.net/npm/osc-js@2.4.1/lib/osc.min.js" },
    server: { npm: "osc-js" },
    defaultExport: "OSC"
});
LiteGraph.LibraryManager.loadLibrary("osc-js-node");

class OSCBridge {
    static title = "OSC Bridge";
    static desc = "Creates an OSC bridge";

    constructor() {
        this.addOutput("status", "string");
        this.addOutput("onStarted", LiteGraph.EVENT);
        this.addOutput("onStopped", LiteGraph.EVENT);
        this.addOutput("message", "object"); // OSC messages

        this.properties = {
            UDPPort: 8001,
            WSSPort: 8008,
            should_autoconnect: true
        };

        this.server = null;
        this.osc = null;
        this.status = "stopped"; // stopped, starting, running, stopping, failed

        if (typeof process === "undefined" || process.browser) {
            console.warn("OSC Server Node is designed to run in Node.js.");
            this.boxcolor = "#FF0000";
            this.title = "OSC (run on server)";
        } else if (this.properties.should_autoconnect) {
            this.startServer();
        }
    }

    onPropertyChanged(name, value) {
        if (name === "port" && this.status === "running") {
            this.stopServer(() => {
                this.properties.port = value;
                this.startServer();
            });
        } else {
            this.properties[name] = value;
        }
    }

    startServer() {
        let OSC = LiteGraph.getGlobalVariable("oscnode");
        if (typeof OSC === "undefined" || !OSC) {
            console.warn("Please install the 'osc' library.");
            return;
        }

        if (this.status === "starting" || this.status === "running") {
            console.log("OSC server is already running.");
            return;
        }

        this.status = "starting";
        console.log(`Starting OSC server on port ${this.properties.UDPPort}...`);

        try {
            // const { UDPPort } = osc;
            // this.server = new UDPPort({
            //     localAddress: "0.0.0.0",
            //     localPort: this.properties.port
            // });
            const config = { udpClient: { port: this.properties.UDPPort } }
            this.server = new OSC({ plugin: new OSC.BridgePlugin(config) })

            this.server.on("message", (oscMsg) => {
                console.log("Received OSC message:", oscMsg);
                this.triggerSlot("message", oscMsg);
            });

            this.server.on("error", (err) => {
                console.error("OSC Server Error:", err);
                this.status = "failed";
            });

            this.server.open();

            this.server.on("ready", () => {
                console.log(`OSC server is running on port ${this.properties.port}`);
                this.status = "running";
                this.triggerSlot("onStarted");
            });

        } catch (e) {
            console.error("OSC Server failed to start:", e);
            this.status = "failed";
        }
    }

    stopServer(callback) {
        if (this.server) {
            this.status = "stopping";
            this.server.close(() => {
                this.status = "stopped";
                console.log("OSC server stopped.");
                this.triggerSlot("onStopped");
                if (callback) callback();
            });
        }
    }

    onExecute() {
        const port = this.getInputOrProperty("port");
        if (port) this.properties.port = port;

        if (this.status === "stopped" && this.properties.should_autoconnect) {
            this.startServer();
        }

        this.setOutputData(0, this.status);
    }

    onGetInputs() {
        return [["port", "number"], ["should_autoconnect", "boolean"]];
    }

    onGetOutputs() {
        return [["status", "string"], ["onStarted", LiteGraph.EVENT], ["onStopped", LiteGraph.EVENT], ["message", "object"]];
    }
}

// Register for LiteGraph
if (typeof LiteGraph !== "undefined") {
    LiteGraph.registerNodeType("nodejs/network/osc_bridge", OSCBridge);
}
// Export for Node.js
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    module.exports = OSCBridge;
}

class OSCServerNode {
    static title = "OSC Server";
    static desc = "Creates an OSC server";

    constructor() {
        this.addOutput("status", "string");
        this.addOutput("onStarted", LiteGraph.EVENT);
        this.addOutput("onStopped", LiteGraph.EVENT);
        this.addOutput("onMessage", LiteGraph.EVENT);
        this.addOutput("message", "object");

        this.properties = {
            open_port: 8001,
            open_host: "localhost",
            send_port: 8002,
            send_host: "localhost",
            should_autoconnect: true
        };

        this.server = null;
        this.osc = null;
        this.status = "stopped"; // stopped, starting, running, stopping, failed

        if (typeof process === "undefined" || process.browser) {
            console.warn("OSC Server Node is designed to run in Node.js.");
            this.boxcolor = "#FF0000";
            this.title = "OSC (run on server)";
        } else if (this.properties.should_autoconnect) {
            this.startServer();
        }
    }

    onPropertyChanged(name, value) {
        if (name === "UDPPort" && this.status === "running") {
            this.stopServer(() => {
                this.properties.UDPPort = value;
                this.startServer();
            });
        } else {
            this.properties[name] = value;
        }
    }

    startServer() {
        if(LiteGraph.LibraryManager.getLibraryState("osc-js-node")!=="loaded"){
            return;
        }
        const OSC = LiteGraph.getGlobalVariable("oscnode");
        if (typeof OSC === "undefined" || !OSC) {
            console.warn("Please install the 'osc-js' library.");
            return;
        }

        if (this.status === "starting" || this.status === "running") {
            console.log("OSC server is already running.");
            return;
        }

        this.status = "starting";
        console.log(`Starting OSC server on UDP port ${this.properties.UDPPort}...`);

        try {
            const dgramOpts = {
                                open:{host: this.properties.open_host, port: this.properties.open_port},
                                send:{host: this.properties.send_host, port: this.properties.send_port},
                            };
            this.server = new OSC({ plugin: new OSC.DatagramPlugin(dgramOpts) });

            this.server.on("open", () => {
                console.log(`OSC server is running on UDP ${this.properties.open_host} port ${this.properties.open_port}`);
                this.status = "running";
                this.triggerSlot("onStarted");
            });

            this.server.on("message", (message) => {
                console.log("Received OSC message:", message);
                this.setOutputData("message", message);
                this.triggerSlot("onMessage");
            });

            this.server.on("*", (message) => {
                console.log("Received OSC message:", message);
                this.setOutputData("message", message);
                this.triggerSlot("onMessage");
            });

            this.server.on("error", (err) => {
                console.error("OSC Server Error:", err);
                this.status = "failed";
            });

            this.server.open({ port: this.properties.open_port, host: this.properties.open_host});

        } catch (e) {
            console.error("OSC Server failed to start:", e);
            this.status = "failed";
        }
    }

    stopServer(callback) {
        if (this.server) {
            this.status = "stopping";
            this.server.close(() => {
                this.status = "stopped";
                console.log("OSC server stopped.");
                this.triggerSlot("onStopped");
                if (callback) callback();
            });
        }
    }

    // sendOSCMessage(address, args = []) {
    //     if (this.server && this.status === "running") {
    //         const OSC = LiteGraph.getGlobalVariable("oscnode");
    //         const message = new OSC.Message(address, ...args);
    //         this.server.send(message);
    //         console.log("Sent OSC message:", message);
    //     } else {
    //         console.warn("OSC server is not running. Cannot send message.");
    //     }
    // }

    onExecute() {
        if (this.status === "stopped" && this.properties.should_autoconnect) {
            this.startServer();
        }
        this.setOutputData(0, this.status);
    }

    // onAction(){
    //     const address = this.getInputData("send_address");
    //     const data = this.getInputData("send_data");
    //     if (address && data) {
    //         this.sendOSCMessage(address, data);
    //     }else{
    //         console.debug("missing data to send OSC",address,data);
    //     }
    // }
}

// Register for LiteGraph
LiteGraph.registerNodeType("nodejs/network/osc_server", OSCServerNode);
// Export for Node.js
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    module.exports = OSCServerNode;
}