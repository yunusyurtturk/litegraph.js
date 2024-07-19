import { LiteGraph } from "./litegraph.js";

//LiteGraph library related nodes
(function(global) {

    // --------------------------

    function LGLibrary(){
        this.addOutput("ref", "object");
        this._value = null;
        this._properties = [];
        this.setOutputData(0, LiteGraph);
    }
    LGLibrary.title = "LGLib";
    LGLibrary.desc = "LiteGraph object reference";
    LGLibrary.prototype.onExecute = function(param, options) {
        this.setOutputData(0, LiteGraph);
    };
    LGLibrary.prototype.onAction = function(action, param, options){
        // should probably execute on action
    };
    LGLibrary.prototype.onGetInputs = function() {
        //return [["in", 0]];
    };
    LGLibrary.prototype.onGetOutputs = function() {
        //return [["out", 0]];
    };
    LGLibrary.prototype.getTitle = function() {
        return "LiteGraph";
    };
    LiteGraph.registerNodeType("litegraph/litegraph", LGLibrary);

    
    // --------------------------

    function LGGraph(){
        this.addInput("start", LiteGraph.ACTION);
        this.addInput("stop", LiteGraph.ACTION);
        this.addInput("step", LiteGraph.ACTION);
        this.addOutput("ref", "object");
        this.addOutput("stepped", LiteGraph.EVENT);
        this._value = null;
        this._properties = [];
        this.setOutputData(0, this.graph);
    }
    LGGraph.title = "Graph";
    LGGraph.desc = "Graph object reference";
    LGGraph.prototype.onExecute = function(param, options) {
        this.setOutputData(0, this.graph);
        this.triggerSlot(1, param, null, options);
    };
    LGGraph.prototype.onAction = function(action, param, options){
        console.debug("GraphAction",action);
        switch(action){
            case "start":
                this.graph.start();
                console.debug("this.graph.start();",this,this.graph);
            break;
            case "stop":
                this.graph.stop();
                console.debug("this.graph.stop();",this,this.graph);
            break;
            case "step":
                if(this.graph.onBeforeStep)
					this.graph.onBeforeStep();
                this.graph.runStep(1, !this.graph.catch_errors);
                console.debug("this.graph.runStep(1, !this.graph.catch_errors);",this,this.graph);
				if(this.graph.onAfterStep)
					this.graph.onAfterStep();
            break;
        }
    };
    LGGraph.prototype.onGetInputs = function() {
        //return [["in", 0]];
    };
    LGGraph.prototype.onGetOutputs = function() {
        //return [["out", 0]];
    };
    LGGraph.prototype.getTitle = function() {
        return "Graph";
    };
    LiteGraph.registerNodeType("litegraph/graph", LGGraph);

})(this);