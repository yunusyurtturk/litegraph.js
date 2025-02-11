// var LiteGraph = require("./build_node/litegraph.full.cjs").LiteGraph;
require("../../build_node/litegraph_nodejs.full.cjs");

LiteGraph.debug_level = 2;

const fs = require('fs');
const path = require('path');
// const io = require('io');
// const http = require('http');

// Create a new LiteGraph instance
var graph = new LiteGraph.LGraph();

const jsonFilePath = path.resolve(__dirname, './workflows/socketIoClientServer.JSON');

// Read the JSON file as a string
fs.readFile(jsonFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error("Error reading the file:", err);
        return;
    }

    // Load the graph JSON string
    var graph_json = data;
    graph.configure(JSON.parse(graph_json));

    // Start the graph
    graph.start();
});