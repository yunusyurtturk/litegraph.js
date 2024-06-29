// test_node_build.js

// Require the reprocessed litegraph.node.js file
const LiteGraph = require('../build_node/litegraph.core.cjs');

// Assuming LiteGraph has a property or method we can check
if (LiteGraph) {
    console.log("LiteGraph module loaded successfully.");
} else {
    console.error("Failed to load LiteGraph module.");
}

// If there is a known method or class in LiteGraph, you can test it here
if (LiteGraph.LGraph) {
    console.log("LGraph class exists in LiteGraph module.");
} else {
    console.error("LGraph class does not exist in LiteGraph module.");
}

// Further tests can be added based on the actual content of the LiteGraph module
