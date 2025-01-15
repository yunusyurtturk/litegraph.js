// WIP (not yet good) TESTING on NODE litegraph-executor

// conditional include (only on server)
// if(typeof(require)!=="undefined"){
//     const WebSocket = require('ws');
// }
//>>NODEJS_ENABLE_CODE_START>>
//const WebSocket = require('ws');
//<<NODEJS_ENABLE_CODE_END<<

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
            console.warn("WebSocket Server node is designed to run in Node.js, not in a browser.");
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

    // Placeholder methods to avoid errors
    /* getInputOrProperty(name) {
        return this.properties[name];
    }

    setOutputData(slot, data) {
        console.log(`Output slot ${slot} set to ${data}`);
    }

    triggerSlot(eventName) {
        console.log(`Event triggered: ${eventName}`);
    } */
}

// Register the node type for LiteGraph
if (typeof LiteGraph !== 'undefined') {
    LiteGraph.registerNodeType("nodejs/network/websocket_server", LocalWebSocketServer);
}

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
