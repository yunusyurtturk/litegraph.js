// var LiteGraph = require("./build_node/litegraph.full.cjs").LiteGraph;
require("../../build_node/litegraph.full.cjs");

var graph = new LiteGraph.LGraph();

var node_console = LiteGraph.createNode("basic/console");
node_console.mode = LiteGraph.ALWAYS;
graph.add(node_console);

var node_time = LiteGraph.createNode("basic/time");
graph.add(node_time);
node_time.connect( 0, node_console, 1 );

graph.start();