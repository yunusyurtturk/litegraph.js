// WIP NODE_ONLY NETWORK

if(typeof(require) == "function"){
    const WebSocket = require('ws');
}

class LocalWebSocketServer {
    static title = "WebSocket Server";
    static desc = "Instantiate a local WebSocket server";

    constructor() {
        // this._checkNodeEnvironment();
        this.server = null;
        this.clients = new Set();
        this.properties = {
            port: 8080,
            should_autoconnect: true
        };
        this.status = 'stopped'; // possible values: stopped, starting, running, stopping, failed
    }

    _checkNodeEnvironment() {
        if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
            throw new Error('This class can only be run in a Node.js environment.');
        }
    }

    onPropertyChanged(name, value) {
        if (name === 'port' && this.status === 'running') {
            this.stopServer(() => {
                this.properties.port = value;
                if (this.properties.should_autoconnect) {
                    this.startServer();
                }
            });
        } else {
            // no need to update
            // this.properties[name] = value;
        }
    }

    startServer() {
        this.status = 'starting';

        try{
            this.server = new WebSocket.Server({ port: this.properties.port }, () => {
                this.status = 'running';
                this.onStarted();
                console.log(`WebSocket server started on port ${this.properties.port}`);
            });
        }catch(e){
            console.warn("WebSocketServer","failed",e);
            this.status = 'failed';
            return;
        }

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
        });

        this.server.on('error', (error) => {
            console.error('WebSocket server error:', error);
            this.status = 'stopped';
        });
    }

    _onMessage(ws, message) {
        console.log('Received:', message, ws);
        // Echo the message back to all connected clients
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
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
LiteGraph.registerNodeType("nodejs/network/websocket_server", LocalWebSocketServer);

if(typeof module !== "undefined"){
    module.exports = LocalWebSocketServer;
}
