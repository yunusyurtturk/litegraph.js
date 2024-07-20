// var LiteGraph = require("./build_node/litegraph.full.cjs").LiteGraph;
require("../../build_node/litegraph.full.cjs");

var graph = new LiteGraph.LGraph();

var node_console = LiteGraph.createNode("basic/console");
node_console.changeMode(LiteGraph.ON_TRIGGER);
node_console_trigger_slot = node_console.findInputSlot("onTrigger");
graph.add(node_console);

var node_time = LiteGraph.createNode("basic/time");
graph.add(node_time);
node_time.connect( 0, node_console, node_console.findInputSlot("msg"));

var node_timer = LiteGraph.createNode("events/timer");
graph.add(node_timer);
node_timer.connect( 0, node_console, node_console_trigger_slot );

graph.start();