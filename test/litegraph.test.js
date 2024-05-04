
import { strict as assert } from 'assert';
import { Console } from 'console';

import { LiteGraph, LGraphNode } from "../src/litegraph.js";

/*
    @TODO:

    Resolve any commented out code.  The original test should pass
    before we change any code so that we know it's the test that's broken
    vs the code that's broken.
*/

describe("register node types", () => {
    
    let Sum;
    let node;

    beforeEach(() => {
        Sum = function Sum() {
            this.addInput("a", "number");
            this.addInput("b", "number");
            this.addOutput("sum", "number");
        };
        Sum.prototype.onExecute = function (a, b) {
            this.setOutputData(0, a + b);
        };
        LiteGraph.registerNodeType("math/sum", Sum);
        node = LiteGraph.registered_node_types["math/sum"];
    });

    afterEach(() => {});

    it("normal case", () => {

        assert(node);
        assert.strictEqual(node.type, "math/sum");
        assert.strictEqual(node.title, "Sum");
        assert.strictEqual(node.category, "math");
        assert.strictEqual(node.prototype.configure, LGraphNode.prototype.configure);
    });

    it("callback triggers", () => {

        LiteGraph.onNodeTypeRegistered = function() {};
        LiteGraph.onNodeTypeReplaced = function() {};
    //    assert(LiteGraph.onNodeTypeRegistered.called);
    //    assert(!LiteGraph.onNodeTypeReplaced.called);
    //    assert(LiteGraph.onNodeTypeReplaced.called);

    //    assert(consoleLogStub.calledWith(sinon.match("replacing node type")));
    //    assert(consoleLogStub.calledWith(sinon.match("math/sum")));
    });

    it("node with title", () => {
        Sum.title = "The sum title";
        assert.strictEqual(node.title, "The sum title");
        assert.notStrictEqual(node.title, node.name);
    });

    it("handle error simple object", () => {
        assert.throws(() => {
            LiteGraph.registerNodeType("math/sum", { simple: "type" });
        }, "Cannot register a simple object");
    });

    it("check shape mapping", () => {
        LiteGraph.registerNodeType("math/sum", Sum);

        const node_type = LiteGraph.registered_node_types["math/sum"];
        assert.strictEqual(new node_type().shape, undefined);
        node_type.prototype.shape = "default";
        assert.strictEqual(new node_type().shape, undefined);
        node_type.prototype.shape = "box";
        assert.strictEqual(new node_type().shape, LiteGraph.BOX_SHAPE);
        node_type.prototype.shape = "round";
        assert.strictEqual(new node_type().shape, LiteGraph.ROUND_SHAPE);
        node_type.prototype.shape = "circle";
        assert.strictEqual(new node_type().shape, LiteGraph.CIRCLE_SHAPE);
        node_type.prototype.shape = "card";
        assert.strictEqual(new node_type().shape, LiteGraph.CARD_SHAPE);
        node_type.prototype.shape = "custom_shape";
        assert.strictEqual(new node_type().shape, "custom_shape");

        // Check that it also works for replaced node types
    //    const consoleLogStub = sinon.stub(console, "log");
        function NewCalcSum(a, b) {
            return a + b;
        }

        LiteGraph.registerNodeType("math/sum", NewCalcSum);
        const new_node_type = LiteGraph.registered_node_types["math/sum"];
        new_node_type.prototype.shape = "box";
        assert.strictEqual(new new_node_type().shape, LiteGraph.BOX_SHAPE);

    //    consoleLogStub.restore();
    });

    it("onPropertyChanged warning", () => {
    //    const consoleLogStub = sinon.stub(console, "log");
        
        Sum.prototype.onPropertyChange = true;
        LiteGraph.registerNodeType("math/sum", Sum);
    //    assert(consoleLogStub.calledOnce);
    //    assert(consoleLogStub.calledWith(sinon.match("has onPropertyChange method")));
    //    assert(consoleLogStub.calledWith(sinon.match("math/sum")));
        
    //   consoleLogStub.restore();
    });

    it("registering supported file extensions", () => {
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

        LiteGraph.registerNodeType("math/sum", Sum);
        LiteGraph.registerNodeType("math/times", Times);

    //    assert.strictEqual(Object.keys(LiteGraph.node_types_by_file_extension).length, 3);
        assert(LiteGraph.node_types_by_file_extension.hasOwnProperty("pdf"));
    //    assert(LiteGraph.node_types_by_file_extension.hasOwnProperty("exe"));
        assert(LiteGraph.node_types_by_file_extension.hasOwnProperty("jpg"));
    //    assert.strictEqual(LiteGraph.node_types_by_file_extension.exe, Times);
    //    assert.strictEqual(LiteGraph.node_types_by_file_extension.pdf, Times);
    //    assert.strictEqual(LiteGraph.node_types_by_file_extension.jpg, Times);
    });

    it("register in/out slot types", () => {
    //    expect(LiteGraph.registered_slot_in_types).toEqual({});
    //    expect(LiteGraph.registered_slot_out_types).toEqual({});

        // Test slot type registration with first type
        LiteGraph.auto_load_slot_types = true;
        LiteGraph.registerNodeType("math/sum", Sum);
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

describe("unregister node types", () => {
    let Sum;

    beforeEach(() => {
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

    it("remove by name", () => {
        LiteGraph.registerNodeType("math/sum", Sum);
    //    expect(LiteGraph.registered_node_types["math/sum"]).toBeTruthy();

        LiteGraph.unregisterNodeType("math/sum");
    //    expect(LiteGraph.registered_node_types["math/sum"]).toBeFalsy();
    });

    it("remove by object", () => {
        LiteGraph.registerNodeType("math/sum", Sum);
    //    expect(LiteGraph.registered_node_types["math/sum"]).toBeTruthy();

        LiteGraph.unregisterNodeType(Sum);
    //    expect(LiteGraph.registered_node_types["math/sum"]).toBeFalsy();
    });

    it("try removing with wrong name", () => {
    //    expect(() => LiteGraph.unregisterNodeType("missing/type")).toThrow(
    //        "node type not found: missing/type"
    //    );
    });

    it("no constructor name", () => {
        function BlankNode() {}
        BlankNode.constructor = {}
        LiteGraph.registerNodeType("blank/node", BlankNode);
    //    expect(LiteGraph.registered_node_types["blank/node"]).toBeTruthy()

        LiteGraph.unregisterNodeType("blank/node");
    //    expect(LiteGraph.registered_node_types["blank/node"]).toBeFalsy();
    })
});
