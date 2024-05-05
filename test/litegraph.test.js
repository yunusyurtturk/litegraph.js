
import { strict as assert } from 'assert';


import { LiteGraph, LGraphNode } from "../src/litegraph.js";

/*
    @TODO:

    Resolve any commented out code.  The original test should pass
    before we change any code so that we know it's the test that's broken
    vs the code that's broken.
*/

describe("Registering node types", () => {
    
    let Sum;
    let node;
    let flagonNodeTypeRegistered = false;
    let flagonNodeTypeReplaced = false;

    before(() => {
        Sum = function Sum() {
            this.addInput("a", "number");
            this.addInput("b", "number");
            this.addOutput("sum", "number");
        };
        Sum.prototype.onExecute = function (a, b) {
            this.setOutputData(0, a + b);
        };

        LiteGraph.onNodeTypeRegistered = () => {
            flagonNodeTypeRegistered = true;
        };

        LiteGraph.onNodeTypeReplaced = () => {
            flagonNodeTypeReplaced = true;
        };

        LiteGraph.registerNodeType("math/sum", Sum);
        node = LiteGraph.registered_node_types["math/sum"];
    });

    it("should correctly construct nodes", () => {
        assert(node);
        assert.equal(flagonNodeTypeRegistered, true);
        assert.strictEqual(node.type, "math/sum");
        assert.strictEqual(node.title, "Sum");
        assert.strictEqual(node.category, "math");
        assert.strictEqual(node.prototype.configure, LGraphNode.prototype.configure);
    });

    it("should handle errors for passing invalid arguments", () => {
        assert.throws(() => {
            LiteGraph.registerNodeType("math/sub", { simple: "type" });
        }, "Cannot register a simple object");
    });

    it("should correctly construct the title", () => {
        Sum.title = "The sum title";
        assert.strictEqual(node.title, "The sum title");
        assert.notStrictEqual(node.title, node.name);
    });

    it("should correctly map shapes", () => {

        assert.strictEqual(new node().shape, undefined);
        node.prototype.shape = "default";
        assert.strictEqual(new node().shape, undefined);
        node.prototype.shape = "box";
        assert.strictEqual(new node().shape, LiteGraph.BOX_SHAPE);
        node.prototype.shape = "round";
        assert.strictEqual(new node().shape, LiteGraph.ROUND_SHAPE);
        node.prototype.shape = "circle";
        assert.strictEqual(new node().shape, LiteGraph.CIRCLE_SHAPE);
        node.prototype.shape = "card";
        assert.strictEqual(new node().shape, LiteGraph.CARD_SHAPE);
        node.prototype.shape = "custom_shape";
        assert.strictEqual(new node().shape, "custom_shape");
    });

    it("should correctly replace node types with callbacks", () => {
        
        function NewCalcSum(a, b) {
            return a + b;
        }
        
        assert.equal(flagonNodeTypeReplaced, false);       
        LiteGraph.registerNodeType("math/sum", NewCalcSum);
        assert.equal(flagonNodeTypeReplaced, true);

        const new_node_type = LiteGraph.registered_node_types["math/sum"];
        // this should generate a console.log() saying "replacing node type: math/sum"

        new_node_type.prototype.shape = "box";
        assert.strictEqual(new new_node_type().shape, LiteGraph.BOX_SHAPE);
    });

    it("should correctly register supported file extensions", () => {
    //    expect(LiteGraph.node_types_by_file_extension).toEqual({});

        // Create two node types with calc_times overriding .pdf
        Sum.supported_extensions = ["PDF", "exe", null];

        function Times() {
            this.addInput("a", "number");
            this.addInput("b", "number");
            this.addOutput("times", "number");
        }
        Times.prototype.onExecute = function (a, b) {
            this.setOutputData(0, a * b);
        };
        Times.supported_extensions = ["pdf", "jpg"];

        LiteGraph.registerNodeType("math/times", Times);

    //    assert.strictEqual(Object.keys(LiteGraph.node_types_by_file_extension).length, 3);
        assert(LiteGraph.node_types_by_file_extension.hasOwnProperty("pdf"));
    //    assert(LiteGraph.node_types_by_file_extension.hasOwnProperty("exe"));
        assert(LiteGraph.node_types_by_file_extension.hasOwnProperty("jpg"));
    //    assert.strictEqual(LiteGraph.node_types_by_file_extension.exe, Times);
    //    assert.strictEqual(LiteGraph.node_types_by_file_extension.pdf, Times);
    //    assert.strictEqual(LiteGraph.node_types_by_file_extension.jpg, Times);
    });

    it("should correctly register in/out slot types", () => {
    //    expect(LiteGraph.registered_slot_in_types).toEqual({});
    //    expect(LiteGraph.registered_slot_out_types).toEqual({});

        // Test slot type registration with first type
        LiteGraph.auto_load_slot_types = true;
    //    expect(LiteGraph.registered_slot_in_types).toEqual({
    //        number: { nodes: ["math/sum"] },
    //    });
    //   expect(LiteGraph.registered_slot_out_types).toEqual({
    //        number: { nodes: ["math/sum"] },
    //    });

        // Test slot type registration with second type
        function ToInt() {
            this.addInput("string", "string");
            this.addOutput("number", "number");
        };
        ToInt.prototype.onExecute = function (str) {
            this.setOutputData(0, Number(str));
        };
        LiteGraph.registerNodeType("basic/to_int", ToInt);
    //    expect(LiteGraph.registered_slot_in_types).toEqual({
    //        number: { nodes: ["math/sum"] },
    //        string: { nodes: ["basic/to_int"] },
    //    });
    //    expect(LiteGraph.registered_slot_out_types).toEqual({
    //        number: { nodes: ["math/sum", "basic/to_int"] },
    //    });
    });
});

describe("Unregistering node types", () => {
    let Sum;
    let node;

    before(() => {
        Sum = function Sum() {
            this.addInput("a", "number");
            this.addInput("b", "number");
            this.addOutput("sum", "number");
        };
        Sum.prototype.onExecute = function (a, b) {
            this.setOutputData(0, a + b);
        };
    });

    afterEach(() => {
    });

    it("should remove by name", () => {
    //    expect(LiteGraph.registered_node_types["math/sum"]).toBeTruthy();

        LiteGraph.unregisterNodeType("math/sum");
    //    expect(LiteGraph.registered_node_types["math/sum"]).toBeFalsy();
    });

    it("should remove by object", () => {
        LiteGraph.registerNodeType("math/sum", Sum);
    //    expect(LiteGraph.registered_node_types["math/sum"]).toBeTruthy();

        LiteGraph.unregisterNodeType(Sum);
    //    expect(LiteGraph.registered_node_types["math/sum"]).toBeFalsy();
    });

    it("should handle attempting to remove with wrong name", () => {
    //    expect(() => LiteGraph.unregisterNodeType("missing/type")).toThrow(
    //        "node type not found: missing/type"
    //    );
    });

    it("should handle not having constructor name", () => {
        function BlankNode() {}
        BlankNode.constructor = {}
        LiteGraph.registerNodeType("blank/node", BlankNode);
    //    expect(LiteGraph.registered_node_types["blank/node"]).toBeTruthy()

        LiteGraph.unregisterNodeType("blank/node");
    //    expect(LiteGraph.registered_node_types["blank/node"]).toBeFalsy();
    })
});
