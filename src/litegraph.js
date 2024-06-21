import { LLink } from "./llink.js";
import { LGraph } from "./lgraph.js";
import { LGraphNode } from "./lgraphnode.js";
import { LGraphGroup } from "./lgraphgroup.js";
import { LGraphCanvas } from "./lgraphcanvas.js";
import { Subgraph, GraphInput, GraphOutput } from "./subgraph.js";
import { DragAndScale } from "./dragandscale.js";
import { ContextMenu as ContextMenuClass } from "./contextmenu.js";
import { CallbackHandler } from "./callbackhandler.js";

/**
 * @class LiteGraph
 *
 * @NOTE:
 * Try to avoid adding things to this class.
 * https://dzone.com/articles/singleton-anti-pattern
 */
export class LiteGraph {

    static VERSION = "a0.11.0";

    static LLink = LLink;
    static LGraph = LGraph;
    static LGraphNode = LGraphNode;
    static LGraphGroup = LGraphGroup;
    static LGraphCanvas = LGraphCanvas;
    static Subgraph = Subgraph;
    static GraphInput = GraphInput;
    static GraphOutput = GraphOutput;
    static DragAndScale = DragAndScale;
    static ContextMenuClass = ContextMenuClass;
    static ContextMenu = function(){}; // return new ContextMenuClass(...arguments); };
    static CallbackHandler = CallbackHandler;

    static CANVAS_GRID_SIZE = 10;
    static NODE_TITLE_HEIGHT = 30;
    static NODE_TITLE_TEXT_Y = 20;
    static NODE_SLOT_HEIGHT = 20;
    static NODE_WIDGET_HEIGHT = 20;
    static NODE_WIDTH = 140;
    static NODE_MIN_WIDTH = 50;
    static NODE_COLLAPSED_RADIUS = 10;
    static NODE_COLLAPSED_WIDTH = 80;
    static NODE_TITLE_COLOR = "#999";
    static NODE_SELECTED_TITLE_COLOR = "#FFF";
    static NODE_TEXT_SIZE = 14;
    static NODE_TEXT_COLOR = "#AAA";
    static NODE_SUBTEXT_SIZE = 12;
    static NODE_DEFAULT_COLOR = "#333";
    static NODE_DEFAULT_BGCOLOR = "#353535";
    static NODE_DEFAULT_BOXCOLOR = "#666";
    static NODE_DEFAULT_SHAPE = "box";
    static NODE_BOX_OUTLINE_COLOR = "#FFF";
    static DEFAULT_SHADOW_COLOR = "rgba(0,0,0,0.5)";
    static DEFAULT_GROUP_FONT = 24;

    static WIDGET_BGCOLOR = "#222";
    static WIDGET_OUTLINE_COLOR = "#666";
    static WIDGET_TEXT_COLOR = "#DDD";
    static WIDGET_SECONDARY_TEXT_COLOR = "#999";

    static LINK_COLOR = "#9A9";
    static EVENT_LINK_COLOR = "#A86";
    static CONNECTING_LINK_COLOR = "#AFA";

    static MAX_NUMBER_OF_NODES = 1000; // avoid infinite loops
    static DEFAULT_POSITION = [100, 100]; // default node position
    static VALID_SHAPES = ["default", "box", "round", "card"]; // ,"circle"

    // shapes are used for nodes but also for slots
    static BOX_SHAPE = 1;
    static ROUND_SHAPE = 2;
    static CIRCLE_SHAPE = 3;
    static CARD_SHAPE = 4;
    static ARROW_SHAPE = 5;
    static GRID_SHAPE = 6; // intended for slot arrays

    // enums
    static INPUT = 1;
    static OUTPUT = 2;

    static EVENT = -1; // for outputs
    static ACTION = -1; // for inputs

    static NODE_MODES = ["Always", "On Event", "Never", "On Trigger", "On Request"]; // helper
    static NODE_MODES_COLORS = ["#666","#422","#333","#224","#626"]; // use with node_box_coloured_by_mode
    static ALWAYS = 0;
    static ON_EVENT = 1;
    static NEVER = 2;
    static ON_TRIGGER = 3;
    static ON_REQUEST = 4; // used from event-based nodes, where ancestors are recursively executed on needed

    static UP = 1;
    static DOWN = 2;
    static LEFT = 3;
    static RIGHT = 4;
    static CENTER = 5;

    static LINK_RENDER_MODES = ["Straight", "Linear", "Spline"]; // helper
    static STRAIGHT_LINK = 0;
    static LINEAR_LINK = 1;
    static SPLINE_LINK = 2;

    static NORMAL_TITLE = 0;
    static NO_TITLE = 1;
    static TRANSPARENT_TITLE = 2;
    static AUTOHIDE_TITLE = 3;
    static VERTICAL_LAYOUT = "vertical"; // arrange nodes vertically

    static proxy = null; // used to redirect calls
    static node_images_path = "";

    static catch_exceptions = true;
    static throw_errors = true;
    static allow_scripts = false; // nodes should be check this value before executing unsafe code :: does not prevent anything in the main library, implement in nodes :: if set to true some nodes like Formula would be allowed to evaluate code that comes from unsafe sources (like node configuration), which could lead to exploits
    static use_deferred_actions = true; // executes actions during the graph execution flow
    static registered_node_types = {}; // nodetypes by string
    static node_types_by_file_extension = {}; // used for dropping files in the canvas
    static Nodes = {}; // node types by classname
    static Globals = {}; // used to store vars between graphs

    static searchbox_extras = {}; // used to add extra features to the search box
    static auto_sort_node_types = false; // [true!] If set to true, will automatically sort node types / categories in the context menus

    static node_box_coloured_when_on = false; // [true!] this make the nodes box (top left circle) coloured when triggered (execute/action), visual feedback
    static node_box_coloured_by_mode = false; // [true!] nodebox based on node mode, visual feedback

    static dialog_close_on_mouse_leave = true; // [false on mobile] better true if not touch device, TODO add an helper/listener to close if false
    static dialog_close_on_mouse_leave_delay = 500;

    static shift_click_do_break_link_from = true; // [false!] prefer false if too easy to break links - implement with ALT or TODO custom keys
    static click_do_break_link_to = false; // [false!]prefer false, way too easy to break links

    static search_filter_enabled = false; // [true!] enable filtering slots type in the search widget, !requires auto_load_slot_types or manual set registered_slot_[in/out]_types and slot_types_[in/out]
    static search_hide_on_mouse_leave = true; // [false on mobile] better true if not touch device, TODO add an helper/listener to close if false
    static search_hide_on_mouse_leave_time = 1200; // time before hiding
    static search_show_all_on_open = true; // [true!] opens the results list when opening the search widget

    static show_node_tooltip = false; // [true!] show a tooltip with node property "tooltip" over the selected node
    static show_node_tooltip_use_descr_property = false; // enabled tooltip from desc when property tooltip not set

    static auto_load_slot_types = false; // [if want false, use true, run, get vars values to be statically set, than disable] nodes types and nodeclass association with node types need to be calculated, if dont want this, calculate once and set registered_slot_[in/out]_types and slot_types_[in/out]

    // set these values if not using auto_load_slot_types
    static registered_slot_in_types = {}; // slot types for nodeclass
    static registered_slot_out_types = {}; // slot types for nodeclass
    static slot_types_in = []; // slot types IN
    static slot_types_out = []; // slot types OUT
    static slot_types_default_in = []; // specify for each IN slot type a(/many) default node(s), use single string, array, or object (with node, title, parameters, ..) like for search
    static slot_types_default_out = []; // specify for each OUT slot type a(/many) default node(s), use single string, array, or object (with node, title, parameters, ..) like for search

    static graphDefaultConfig = {
        align_to_grid: true,
        links_ontop: false,
    };

    static alt_drag_do_clone_nodes = false; // [true!] very handy, ALT click to clone and drag the new node
    static alt_shift_drag_connect_clone_with_input = true; // [true!] very handy, when cloning, keep input connections with SHIFT

    static do_add_triggers_slots = false; // [true!] will create and connect event slots when using action/events connections, !WILL CHANGE node mode when using onTrigger (enable mode colors), onExecuted does not need this

    static allow_multi_output_for_events = true; // [false!] being events, it is strongly reccomended to use them sequentially, one by one

    static middle_click_slot_add_default_node = false; // [true!] allows to create and connect a ndoe clicking with the third button (wheel)

    static release_link_on_empty_shows_menu = false; // [true!] dragging a link to empty space will open a menu, add from list, search or defaults
    static two_fingers_opens_menu = false; // [true!] using pointer event isPrimary, when is not simulate right click

    static backspace_delete = true; // [false!] delete key is enough, don't mess with text edit and custom

    static ctrl_shift_v_paste_connect_unselected_outputs = false; // [true!] allows ctrl + shift + v to paste nodes with the outputs of the unselected nodes connected with the inputs of the newly pasted nodes

    static actionHistory_enabled = false; // cntrlZ, cntrlY
    static actionHistoryMaxSave = 300;

    /* EXECUTING ACTIONS AFTER UPDATING VALUES - ANCESTORS */
    static refreshAncestorsOnTriggers = false; // [true!]
    static refreshAncestorsOnActions = false; // [true!]
    static ensureUniqueExecutionAndActionCall = false; // [true!] the new tecnique.. let's make it working best of

    // if true, all newly created nodes/links will use string UUIDs for their id fields instead of integers.
    // use this if you must have node IDs that are unique across all graphs and subgraphs.
    static use_uuids = false;

    // enable filtering elements of the context menu with keypress (+ arrows for navigation, escape to close)
    static context_menu_filter_enabled = false; // FIX event handler removal

    // ,"editor_alpha" //= 1; //used for transition

    static canRemoveSlots = true;
    static canRemoveSlots_onlyOptional = true;
    static canRenameSlots = true;
    static canRenameSlots_onlyOptional = true;

    static ensureNodeSingleExecution = false; // OLD this will prevent nodes to be executed more than once for step (comparing graph.iteration)
    static ensureNodeSingleAction = false; // OLD this will prevent nodes to be executed more than once for action call!
    static preventAncestorRecalculation = false; // OLD(?) when calculating the ancestors, set a flag to prevent recalculate the subtree

    static allowMultiOutputForEvents = false; // being events, it is strongly reccomended to use them sequentually, one by one

    static reprocess_slot_while_node_configure = false; // reprocess inputs and output node slots comparing by name, will fix index changes, works on dynamics

    static log_methods = ['error', 'warn', 'info', 'log', 'debug'];

    static cb_handler = false;
    static debug = true; // WIP

    static initialize(){
        this.debug = true; // enable/disable logging :: in this.debug_level is stored the actual numeric value
        this.logging_set_level(2);
        
        // event dispatcher, along direct (single) assignment of callbacks [ event entrypoint ]
        this.callbackhandler_setup();

        this.ContextMenu = function(){ return new ContextMenuClass(...arguments); };

        // base inclusion
        this.includeBasicNodes();
    }

    static includeBasicNodes(){
        this.registerNodeType("graph/subgraph", Subgraph);
        this.registerNodeType("graph/input", GraphInput);
        this.registerNodeType("graph/output", GraphOutput);
    }

    static callbackhandler_setup(){
        if(this.cb_handler) return;
        this.cb_handler = new CallbackHandler(this);
        // register CallbackHandler methods on this // Should move as class standard class methods?
        this.registerCallbackHandler = function(){ return this.cb_handler.registerCallbackHandler(...arguments); };
        this.unregisterCallbackHandler = function(){ return this.cb_handler.unregisterCallbackHandler(...arguments); };
        this.processCallbackHandlers = function(){ return this.cb_handler.processCallbackHandlers(...arguments); };
    }

    static registerCallbackHandler(){
        this.callbackhandler_setup();
        this.cb_handler.registerCallbackHandler(...arguments);
    }
    static unregisterCallbackHandler(){
        this.callbackhandler_setup();
        this.cb_handler.unregisterCallbackHandler(...arguments);
    }
    static processCallbackHandlers(){
        this.callbackhandler_setup();
        this.cb_handler.processCallbackHandlers(...arguments);
    }

    // set logging debug_level
    // from -1 (none), 0 (error), .. to 5 (debug) based on console methods 'error', 'warn', 'info', 'log', 'debug'
    // could be set higher to enable verbose logging
    static logging_set_level(v) {
        this.debug_level = Number(v);
    }

    // entrypoint to debug log
    // pass 0 (error) to 4 (debug), (or more for verbose logging)
    static logging(lvl/**/) { // arguments

        if(!this.debug && this.debug_level>0) {
            // force only errors
            this.debug_level = 0;
        }
        
        if(lvl > this.debug_level){
            return; // -- break, log only below or equal current --
        }

        function clean_args(args) {
            let aRet = [];
            if(lvl<0 || lvl>4)
                aRet.push("loglvl:"+lvl); // include not standard log level
            for(let iA=1; iA<args.length; iA++) {
                if(typeof(args[iA])!=="undefined") aRet.push(args[iA]);
            }
            return aRet;
        }

        let lvl_txt = "debug";
        if(lvl>=0 && lvl<=4) lvl_txt = ['error', 'warn', 'info', 'log', 'debug'][lvl];

        if(typeof(console[lvl_txt])!=="function") {
            console.warn("[LG-log] invalid console method",lvl_txt,clean_args(arguments));
            throw new RangeError;
        }

        console[lvl_txt]("[LG]",...clean_args(arguments));
    }
    static log_error() {
        this.logging(0,...arguments);
    }
    static log_warn() {
        this.logging(1,...arguments);
    }
    static log_info() {
        this.logging(2,...arguments);
    }
    static log_log() {
        this.logging(3,...arguments);
    }
    static log_debug() {
        this.logging(4,...arguments);
    }
    static log_verbose() {
        this.logging(5,...arguments);
    }

    /**
     * Register a node class so it can be listed when the user wants to create a new one
     * @method registerNodeType
     * @param {String} type name of the node and path
     * @param {Class} base_class class containing the structure of a node
     */
    static registerNodeType(type, base_class) {
        if (!base_class.prototype) {
            throw new Error("Cannot register a simple object, it must be a class with a prototype");
        }
        base_class.type = type;

        this.log_debug("registerNodeType","start",type);

        const classname = base_class.name;

        const pos = type.lastIndexOf("/");
        base_class.category = type.substring(0, pos);

        if (!base_class.title) {
            base_class.title = classname;
        }

        const propertyDescriptors = Object.getOwnPropertyDescriptors(LGraphNode.prototype);

        // WIP BAD
        // extend constructor instead of copy properties :: WANTED to have originalconstructor too
        // using manual constructor (?)
        // if(base_class.prototype.hasOwnProperty("constructor")){
        //     var base_constructor = base_class.prototype.constructor;
        //     function extendedConstructor(that){
        //         LGraphNode.prototype.constructor.bind(that);
        //         base_constructor.bind(that);
        //     }
        //     base_class.prototype.constructor = extendedConstructor(this);
        //     base_class.constructor = extendedConstructor(this);
        // }

        // Iterate over each property descriptor
        Object.keys(propertyDescriptors).forEach((propertyName) => {
            // Check if the property already exists on the target prototype
            if (!base_class.prototype.hasOwnProperty(propertyName)) {
                // If the property doesn't exist, copy it from the source to the target
                Object.defineProperty(base_class.prototype, propertyName, propertyDescriptors[propertyName]);
                // TOO MUCH VERBOSE :: this.log_verbose("registerNodeType","defineProperty",type,base_class.prototype, propertyName, propertyDescriptors[propertyName]);
            }
        });

        const prev = this.registered_node_types[type];
        if(prev) {
            this.log_debug("registerNodeType","replacing node type",type,prev);
        }
        if( !Object.prototype.hasOwnProperty.call( base_class.prototype, "shape") ) {
            Object.defineProperty(base_class.prototype, "shape", {
                set: function(v) {
                    switch (v) {
                        case "default":
                            delete this._shape;
                            break;
                        case "box":
                            this._shape = LiteGraph.BOX_SHAPE;
                            break;
                        case "round":
                            this._shape = LiteGraph.ROUND_SHAPE;
                            break;
                        case "circle":
                            this._shape = LiteGraph.CIRCLE_SHAPE;
                            break;
                        case "card":
                            this._shape = LiteGraph.CARD_SHAPE;
                            break;
                        default:
                            this._shape = v;
                    }
                },
                get: function() {
                    return this._shape;
                },
                enumerable: true,
                configurable: true,
            });


            // used to know which nodes to create when dragging files to the canvas
            if (base_class.supported_extensions) {
                for (let i in base_class.supported_extensions) {
                    const ext = base_class.supported_extensions[i];
                    if(ext && ext.constructor === String) {
                        this.node_types_by_file_extension[ext.toLowerCase()] = base_class;
                    }
                }
            }
        }

        this.registered_node_types[type] = base_class;
        if (base_class.constructor.name) {
            this.Nodes[classname] = base_class;
        }

        this.processCallbackHandlers("onNodeTypeRegistered",{
            def_cb: this.onNodeTypeRegistered
        }, type, base_class);

        if (prev) {
            this.processCallbackHandlers("onNodeTypeReplaced",{
                def_cb: this.onNodeTypeReplaced
            }, type, base_class, prev);
        }

        // warnings
        if (base_class.prototype.onPropertyChange) {
            LiteGraph.log_warn("LiteGraph node class " +
                    type +
                    " has onPropertyChange method, it must be called onPropertyChanged with d at the end");
        }

        // used to know which nodes create when dragging files to the canvas
        if (base_class.supported_extensions) {
            for (var i=0; i < base_class.supported_extensions.length; i++) {
                var ext = base_class.supported_extensions[i];
                if(ext && ext.constructor === String)
                    this.node_types_by_file_extension[ext.toLowerCase()] = base_class;
            }
        }

        this.log_debug("registerNodeType","type registered",type);

        if (this.auto_load_slot_types){
            // auto_load_slot_types should be used when not specifing slot type to LiteGraph
            // good for testing: this will create a temporary node for each type
            this.log_debug("registerNodeType","auto_load_slot_types, create empy tmp node",type);
            let tmpnode = new base_class(base_class.title ?? "tmpnode");
            tmpnode.post_constructor(); // could not call, but eventually checking for errors in the chain ?
        }
    }

    /**
     * removes a node type from the system
     * @method unregisterNodeType
     * @param {String|Object} type name of the node or the node constructor itself
     */
    static unregisterNodeType(type) {
        const base_class =
            type.constructor === String
                ? this.registered_node_types[type]
                : type;
        if (!base_class) {
            throw new Error("node type not found to unregister: " + type);
        }
        delete this.registered_node_types[base_class.type];
        if (base_class.constructor.name) {
            delete this.Nodes[base_class.constructor.name];
        }
    }

    /**
    * Save a slot type and his node
    * @method registerSlotType
    * @param {String|Object} type name of the node or the node constructor itself
    * @param {String} slot_type name of the slot type (variable type), eg. string, number, array, boolean, ..
    */
    static registerNodeAndSlotType(type, slot_type, out = false) {
        const base_class =
            type.constructor === String &&
            this.registered_node_types[type] !== "anonymous"
                ? this.registered_node_types[type]
                : type;

        const class_type = base_class.constructor.type;

        let allTypes = [];
        if (typeof slot_type === "string") {
            allTypes = slot_type.split(",");
        } else if (slot_type == this.EVENT || slot_type == this.ACTION) {
            allTypes = ["_event_"];
        } else {
            allTypes = ["*"];
        }

        for (let i = 0; i < allTypes.length; ++i) {
            let slotType = allTypes[i];
            if (slotType === "") {
                slotType = "*";
            }
            const registerTo = out
                ? "registered_slot_out_types"
                : "registered_slot_in_types";
            if (this[registerTo][slotType] === undefined) {
                this[registerTo][slotType] = { nodes: [] };
            }
            if (!this[registerTo][slotType].nodes.includes(class_type)) {
                this[registerTo][slotType].nodes.push(class_type);
            }

            // check if is a new type
            if (!out) {
                if (!this.slot_types_in.includes(slotType.toLowerCase())) {
                    this.slot_types_in.push(slotType.toLowerCase());
                    this.slot_types_in.sort();
                }
            } else {
                if (!this.slot_types_out.includes(slotType.toLowerCase())) {
                    this.slot_types_out.push(slotType.toLowerCase());
                    this.slot_types_out.sort();
                }
            }
        }
    }

    /**
     * Create a new nodetype by passing an object with some properties
     * like onCreate, inputs:Array, outputs:Array, properties, onExecute
     * @method buildNodeClassFromObject
     * @param {String} name node name with namespace (p.e.: 'math/sum')
     * @param {Object} object methods expected onCreate, inputs, outputs, properties, onExecute
     */
    static buildNodeClassFromObject(
        name,
        object,
    ) {
        var ctor_code = "";
        if(object.inputs)
            for(let i=0; i < object.inputs.length; ++i) {
                let _name = object.inputs[i][0];
                let _type = object.inputs[i][1];
                if(_type && _type.constructor === String)
                    _type = '"'+_type+'"';
                ctor_code += "this.addInput('"+_name+"',"+_type+");\n";
            }
        if(object.outputs)
            for(let i=0; i < object.outputs.length; ++i) {
                let _name = object.outputs[i][0];
                let _type = object.outputs[i][1];
                if(_type && _type.constructor === String)
                    _type = '"'+_type+'"';
                ctor_code += "this.addOutput('"+_name+"',"+_type+");\n";
            }
        if(object.properties)
            for(let i in object.properties) {
                let prop = object.properties[i];
                if(prop && prop.constructor === String)
                    prop = '"'+prop+'"';
                ctor_code += "this.addProperty('"+i+"',"+prop+");\n";
            }
        ctor_code += "if(this.onCreate)this.onCreate()";
        var classobj = Function(ctor_code);
        for(let i in object)
            if(i!="inputs" && i!="outputs" && i!="properties")
                classobj.prototype[i] = object[i];
        classobj.title = object.title || name.split("/").pop();
        classobj.desc = object.desc || "Generated from object";
        this.registerNodeType(name, classobj);
        return classobj;
    }

    /**
     * Create a new nodetype by passing a function, it wraps it with a proper class and generates inputs according to the parameters of the function.
     * Useful to wrap simple methods that do not require properties, and that only process some input to generate an output.
     * @method wrapFunctionAsNode
     * @param {String} name node name with namespace (p.e.: 'math/sum')
     * @param {Function} func
     * @param {Array} param_types [optional] an array containing the type of every parameter, otherwise parameters will accept any type
     * @param {String} return_type [optional] string with the return type, otherwise it will be generic
     * @param {Object} properties [optional] properties to be configurable
     */
    static wrapFunctionAsNode(name, func, param_types, return_type, properties) {
        const names = LiteGraph.getParameterNames(func);

        const code = names.map((name, i) => {
            const paramType = param_types?.[i] ? `'${param_types[i]}'` : "0";
            return `this.addInput('${name}', ${paramType});`;
        }).join("\n");

        const returnTypeStr = return_type ? `'${return_type}'` : 0;
        const propertiesStr = properties ? `this.properties = ${JSON.stringify(properties)};` : "";

        const classObj = new Function(`
            ${code}
            this.addOutput('out', ${returnTypeStr});
            ${propertiesStr}
        `);

        classObj.title = name.split("/").pop();
        classObj.desc = `Generated from ${func.name}`;

        classObj.prototype.onExecute = function() {
            const params = names.map((name, i) => this.getInputData(i));
            const result = func.apply(this, params);
            this.setOutputData(0, result);
        };
        // TODO: should probably set onConfigure or INIT too the value set ??

        this.registerNodeType(name, classObj);

        return classObj;
    }


    /**
     * Removes all previously registered node's types
     */
    static clearRegisteredTypes() {
        this.registered_node_types = {};
        this.node_types_by_file_extension = {};
        this.Nodes = {};
        this.searchbox_extras = {};
    }

    /**
     * Adds this method to all nodetypes, existing and to be created
     * (You can add it to LGraphNode.prototype but then existing node types wont have it)
     * @method addNodeMethod
     * @param {Function} func
     */
    static addNodeMethod(name, func) {
        LGraphNode.prototype[name] = func;
        for (var i in this.registered_node_types) {
            var type = this.registered_node_types[i];
            if (type.prototype[name]) {
                type.prototype["_" + name] = type.prototype[name];
            } // keep old in case of replacing
            type.prototype[name] = func;
        }
    }

    /**
     * Create a node of a given type with a name. The node is not attached to any graph yet.
     * @method createNode
     * @param {String} type full name of the node class. p.e. "math/sin"
     * @param {String} name a name to distinguish from other nodes
     * @param {Object} options to set options
     */

    static createNode(type, title, options = {}) {
        const base_class = this.registered_node_types[type] ?? null;

        if (!base_class) {
            this.log_debug(`GraphNode type "${type}" not registered.`);
            return null;
        }

        LiteGraph.log_verbose("createNode",type,title,options,base_class);

        title = title ?? base_class.title ?? type;

        let node = null;

        if (LiteGraph.catch_exceptions) {
            try {
                node = new base_class(title);
            } catch (err) {
                this.log_error("createNode",err);
                return null;
            }
        } else {
            node = new base_class(title);
        }

        // extend constructor with the extended always executed (custom class or lgraphnode)
        node.post_constructor();

        node.type = type;
        node.title ??= title;
        node.properties ??= {};
        node.properties_info ??= [];
        node.flags ??= {};
        node.size ??= node.computeSize();
        node.pos ??= LiteGraph.DEFAULT_POSITION.concat();
        node.mode ??= LiteGraph.ALWAYS;

        // extra options
        Object.assign(node, options);

        LiteGraph.log_verbose("createNode","created",node,node.processCallbackHandlers);

        // callback node event entrypoint
        node.processCallbackHandlers("onNodeCreated",{
            def_cb: node.onNodeCreated
        });
        return node;
    }


    /**
     * Returns a registered node type with a given name
     * @method getNodeType
     * @param {String} type full name of the node class. p.e. "math/sin"
     * @return {Class} the node class
     */
    static getNodeType(type) {
        return this.registered_node_types[type];
    }

    /**
     * Returns a list of node types matching one category
     * @method getNodeType
     * @param {String} category category name
     * @return {Array} array with all the node classes
     */

    static getNodeTypesInCategory(category, filter) {
        const filteredTypes = Object.values(this.registered_node_types).filter((type) => {
            if (type.filter !== filter) {
                return false;
            }

            if (category === "") {
                return type.category === null;
            } else {
                return type.category === category;
            }
        });

        if (this.auto_sort_node_types) {
            filteredTypes.sort((a, b) => a.title.localeCompare(b.title));
        }

        return filteredTypes;
    }


    /**
     * Returns a list with all the node type categories
     * @method getNodeTypesCategories
     * @param {String} filter only nodes with ctor.filter equal can be shown
     * @return {Array} array with all the names of the categories
     */
    static getNodeTypesCategories(filter) {
        const categories = { "": 1 };

        Object.values(this.registered_node_types).forEach((type) => {
            if (type.category && !type.skip_list && type.filter === filter) {
                categories[type.category] = 1;
            }
        });

        const result = Object.keys(categories);

        return this.auto_sort_node_types ? result.sort() : result;
    }


    // debug purposes: reloads all the js scripts that matches a wildcard
    static reloadNodes(folder_wildcard) {
        var tmp = document.getElementsByTagName("script");
        // weird, this array changes by its own, so we use a copy
        var script_files = [];
        for (let i=0; i < tmp.length; i++) {
            script_files.push(tmp[i]);
        }

        var docHeadObj = document.getElementsByTagName("head")[0];
        folder_wildcard = document.location.href + folder_wildcard;

        for (let i=0; i < script_files.length; i++) {
            var src = script_files[i].src;
            if (
                !src ||
                src.substr(0, folder_wildcard.length) != folder_wildcard
            ) {
                continue;
            }

            try {
                this.log_debug("Reloading: " + src);
                var dynamicScript = document.createElement("script");
                dynamicScript.type = "text/javascript";
                dynamicScript.src = src;
                docHeadObj.appendChild(dynamicScript);
                docHeadObj.removeChild(script_files[i]);
            } catch (err) {
                if (LiteGraph.throw_errors) {
                    throw err;
                }
                this.log_debug("Error while reloading " + src);
            }
        }
        this.log_debug("Nodes reloaded");
    }

    /**
     * This is a cleaner helper to .configure methods that rely on json import
     * Happens that arrays are sometimes (strangely) exported as object with keyed strings: eg. [v0, v1] to {"0": v0, "1": v1}
     * This method successfully convert those to back to accessible by key numbers {0: v0, 1:v1} - note this is an object not an array as eventually was in origin
     * This eg. happens with groups ._bounding and nodes .position, but could happen anywere, advised implementation of parseStringifyObject to sanitize
     * @param {object} obj the object to parse clean
     * @returns the cleaned object
     */
    static parseStringifyObject(obj, target) {
        // method 1: not working
        // return JSON.parse(JSON.stringify(obj));

        // method 2: working
        // for (const key in obj) {
        //     if (Object.prototype.hasOwnProperty.call(obj, key)) {
        //         target[key] = obj[key];
        //     }
        // }
        // return target;

        // just use cloneObject, original solution
        return this.cloneObject(obj, target);
    }

    static cloneObject(obj, target) {
        if (obj == null) {
            return null;
        }
        const clonedObj = JSON.parse(JSON.stringify(obj));
        if (!target) {
            return clonedObj;
        }
        for (const key in clonedObj) {
            if (Object.prototype.hasOwnProperty.call(clonedObj, key)) {
                target[key] = clonedObj[key];
            }
        }
        return target;
    }


    /*
        * https://gist.github.com/jed/982883?permalink_comment_id=852670#gistcomment-852670
        */
    static uuidv4() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,(a) => (a^Math.random()*16>>a/4).toString(16));
    }

    /**
     * Returns if the types of two slots are compatible (taking into account wildcards, etc)
     * @method isValidConnection
     * @param {String} type_a
     * @param {String} type_b
     * @return {Boolean} true if they can be connected
     */
    static isValidConnection(type_a, type_b) {
        if (type_a === "" || type_a === "*") type_a = 0;
        if (type_b === "" || type_b === "*") type_b = 0;

        if (!type_a || !type_b || type_a === type_b || (type_a === LiteGraph.EVENT && type_b === LiteGraph.ACTION)) {
            return true;
        }

        type_a = String(type_a).toLowerCase();
        type_b = String(type_b).toLowerCase();

        if (!type_a.includes(",") && !type_b.includes(",")) {
            return type_a === type_b;
        }

        const supported_types_a = type_a.split(",");
        const supported_types_b = type_b.split(",");

        for (const supported_type_a of supported_types_a) {
            for (const supported_type_b of supported_types_b) {
                if (this.isValidConnection(supported_type_a, supported_type_b)) {
                    return true;
                }
            }
        }

        return false;
    }


    /**
     * Register a string in the search box so when the user types it it will recommend this node
     * @method registerSearchboxExtra
     * @param {String} node_type the node recommended
     * @param {String} description text to show next to it
     * @param {Object} data it could contain info of how the node should be configured
     * @return {Boolean} true if they can be connected
     */
    static registerSearchboxExtra(node_type, description, data) {
        this.searchbox_extras[description.toLowerCase()] = {
            type: node_type,
            desc: description,
            data: data,
        };
    }

    /**
     * Wrapper to load files (from url using fetch or from file using FileReader)
     * @method fetchFile
     * @param {String|File|Blob} url the url of the file (or the file itself)
     * @param {String} type an string to know how to fetch it: "text","arraybuffer","json","blob"
     * @param {Function} on_complete callback(data)
     * @param {Function} on_error in case of an error
     * @return {FileReader|Promise} returns the object used to
     */
    static fetchFile( url, type, on_complete, on_error ) {
        if(!url)
            return null;

        type = type || "text";
        if( url.constructor === String ) {
            if (url.substr(0, 4) == "http" && LiteGraph.proxy) {
                url = LiteGraph.proxy + url.substr(url.indexOf(":") + 3);
            }
            return fetch(url)
                .then((response) => {
                    if(!response.ok)
                        throw new Error("File not found"); // it will be catch below
                    if(type == "arraybuffer")
                        return response.arrayBuffer();
                    else if(type == "text" || type == "string")
                        return response.text();
                    else if(type == "json")
                        return response.json();
                    else if(type == "blob")
                        return response.blob();
                })
                .then((data) => {
                    if(on_complete)
                        on_complete(data);
                })
                .catch((error) => {
                    this.log_error("error fetching file:",url);
                    if(on_error)
                        on_error(error);
                });
        } else if( url.constructor === File || url.constructor === Blob) {
            var reader = new FileReader();
            reader.onload = (e) => {
                var v = e.target.result;
                if( type == "json" )
                    v = JSON.parse(v);
                if(on_complete)
                    on_complete(v);
            }
            if(type == "arraybuffer")
                return reader.readAsArrayBuffer(url);
            else if(type == "text" || type == "json")
                return reader.readAsText(url);
            else if(type == "blob")
                return reader.readAsBinaryString(url);
        }
        return null;
    }

    // @TODO These weren't even directly bound, so could be used as free functions
    static compareObjects(a, b) {
        const aKeys = Object.keys(a);

        if (aKeys.length !== Object.keys(b).length) {
            return false;
        }

        return aKeys.every((key) => a[key] === b[key]);
    }

    static distance(a, b) {
        const [xA, yA] = a;
        const [xB, yB] = b;

        return Math.sqrt((xB - xA) ** 2 + (yB - yA) ** 2);
    }

    static colorToString(c) {
        return (
            "rgba(" +
            Math.round(c[0] * 255).toFixed() +
            "," +
            Math.round(c[1] * 255).toFixed() +
            "," +
            Math.round(c[2] * 255).toFixed() +
            "," +
            (c.length == 4 ? c[3].toFixed(2) : "1.0") +
            ")"
        );
    }

    static canvasFillTextMultiline(context, text, x, y, maxWidth, lineHeight) {
        var words = (text+"").trim().split(' ');
        var line = '';
        var ret = {lines: [], maxW: 0, height: 0};
        if (words.length>1) {
            for(var n = 0; n < words.length; n++) {
                var testLine = line + words[n] + ' ';
                var metrics = context.measureText(testLine);
                var testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    context.fillText(line, x, y+(lineHeight*ret.lines.length));
                    line = words[n] + ' ';
                    // y += lineHeight;
                    ret.max = testWidth;
                    ret.lines.push(line);
                }else{
                    line = testLine;
                }
            }
        } else {
            line = words[0];
        }
        context.fillText(line, x, y+(lineHeight*ret.lines.length));
        ret.lines.push(line);
        ret.height = lineHeight*ret.lines.length || lineHeight;
        return ret;
    }

    static isInsideRectangle(x, y, left, top, width, height) {
        return x > left && x < left + width && y > top && y < top + height;
    }

    static isBoundingInsideRectangle(bounding, left, top, width, height) {
        let x = bounding[0];
        let y = bounding[1];
        if(!(x > left && x < left + width && y > top && y < top + height))
            return false;
        x = bounding[0] + bounding[2];
        y = bounding[1] + bounding[3];
        if(!(x > left && x < left + width && y > top && y < top + height))
            return false;
        return true;
    }

    // [minx,miny,maxx,maxy]
    static growBounding(bounding, x, y) {
        if (x < bounding[0]) {
            bounding[0] = x;
        } else if (x > bounding[2]) {
            bounding[2] = x;
        }

        if (y < bounding[1]) {
            bounding[1] = y;
        } else if (y > bounding[3]) {
            bounding[3] = y;
        }
    }

    // point inside bounding box
    static isInsideBounding(p, bb) {
        return p[0] >= bb[0][0] && p[1] >= bb[0][1] && p[0] <= bb[1][0] && p[1] <= bb[1][1];
    }

    // bounding overlap, format: [ startx, starty, width, height ]
    static overlapBounding(a, b, add) {
        add = add || 0;
        const A_end_x = a[0] + a[2] + add;
        const A_end_y = a[1] + a[3] + add;
        const B_end_x = b[0] + b[2] + add;
        const B_end_y = b[1] + b[3] + add;

        return !(a[0] > B_end_x || a[1] > B_end_y || A_end_x < b[0] || A_end_y < b[1]);
    }

    // Convert a hex value to its decimal value - the inputted hex must be in the
    //	format of a hex triplet - the kind we use for HTML colours. The function
    //	will return an array with three values.
    static hex2num(hex) {
        if (hex.charAt(0) == "#") {
            hex = hex.slice(1);
        } // Remove the '#' char - if there is one.
        hex = hex.toUpperCase();
        var hex_alphabets = "0123456789ABCDEF";
        var value = new Array(3);
        var k = 0;
        var int1, int2;
        for (var i = 0; i < 6; i += 2) {
            int1 = hex_alphabets.indexOf(hex.charAt(i));
            int2 = hex_alphabets.indexOf(hex.charAt(i + 1));
            value[k] = int1 * 16 + int2;
            k++;
        }
        return value;
    }

    // Give a array with three values as the argument and the function will return
    //	the corresponding hex triplet.
    static num2hex(triplet) {
        var hex_alphabets = "0123456789ABCDEF";
        var hex = "#";
        var int1, int2;
        for (var i = 0; i < 3; i++) {
            int1 = triplet[i] / 16;
            int2 = triplet[i] % 16;

            hex += hex_alphabets.charAt(int1) + hex_alphabets.charAt(int2);
        }
        return hex;
    }

    static  closeAllContextMenus = function(ref_window) {
        ref_window = ref_window || window;

        var elements = ref_window.document.querySelectorAll(".litecontextmenu");
        if (!elements.length) {
            return;
        }

        var result = [];
        for (var i = 0; i < elements.length; i++) {
            result.push(elements[i]);
        }

        for (var i=0; i < result.length; i++) {
            if (result[i].close) {
                result[i].close();
            } else if (result[i].parentNode) {
                result[i].parentNode.removeChild(result[i]);
            }
        }
    };

    static extendClass = (target, origin) => {
        for (let i in origin) {
            // copy class properties
            if (target.hasOwnProperty(i)) {
                continue;
            }
            target[i] = origin[i];
        }

        if (origin.prototype) {
            // copy prototype properties
            for (let i in origin.prototype) {
                // only enumerable
                if (!origin.prototype.hasOwnProperty(i)) {
                    continue;
                }

                if (target.prototype.hasOwnProperty(i)) {
                    // avoid overwriting existing ones
                    continue;
                }

                // copy getters
                if (origin.prototype.__lookupGetter__(i)) {
                    target.prototype.__defineGetter__(
                        i,
                        origin.prototype.__lookupGetter__(i),
                    );
                } else {
                    target.prototype[i] = origin.prototype[i];
                }

                // and setters
                if (origin.prototype.__lookupSetter__(i)) {
                    target.prototype.__defineSetter__(
                        i,
                        origin.prototype.__lookupSetter__(i),
                    );
                }
            }
        }
    }

    // used to create nodes from wrapping functions
    static getParameterNames = function(func) {
        return (func + "")
            .replace(/[/][/].*$/gm, "") // strip single-line comments
            .replace(/\s+/g, "") // strip white space
            .replace(/[/][*][^/*]*[*][/]/g, "") // strip multi-line comments  /**/
            .split("){", 1)[0]
            .replace(/^[^(]*[(]/, "") // extract the parameters
            .replace(/=[^,]+/g, "") // strip any ES6 defaults
            .split(",")
            .filter(Boolean); // split & filter [""]
    };

    static clamp = (v, a, b) => {
        return a > v ? a : b < v ? b : v;
    };

    // @BUG checking
    /* pointerAddListener = () => {
        console.error?.("Removed and being re-integrated sorta");
    };
    pointerRemoveListener = () => {
        console.error?.("Removed and being re-integrated sorta");
    };
    set pointerevents_method(v) {
        console.error?.("Removed and being re-integrated sorta");
    }
    get pointerevents_method() {
        console.error?.("Removed and being re-integrated sorta");
    } */

    static closeAllContextMenus = () => {
        LiteGraph.log_warn('LiteGraph.closeAllContextMenus is deprecated in favor of ContextMenu.closeAll()');
        ContextMenuClass.closeAll();
    };

    
}

// !¿ TODO MOVE THESE HELPERS ?!
// timer that works everywhere
if (typeof performance != "undefined") {
    LiteGraph.getTime = performance.now.bind(performance);
} else if (typeof Date != "undefined" && Date.now) {
    LiteGraph.getTime = Date.now.bind(Date);
} else if (typeof process != "undefined") {
    LiteGraph.getTime = () => {
        var t = process.hrtime();
        return t[0] * 0.001 + t[1] * 1e-6;
    };
} else {
    LiteGraph.getTime = function getTime() {
        return new Date().getTime();
    };
}

// @BROWSERONLY
if (typeof window != "undefined" && !window["requestAnimationFrame"]) {
    window.requestAnimationFrame =
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        ((callback) => {
            window.setTimeout(callback, 1000 / 60);
        });
}
