import { LiteGraph } from "./litegraph.js";

export class CallbackHandler {

    constructor(ref){
        this.callbacks_handlers = {};
        LiteGraph.log_debug("CallbackHandler Initialize callbacks",ref);
    }

    // WIP
    // intended to replace direct (single) assignment of callbacks [ event entrypoint ]
    registerCallbackHandler = function(name, callback, opts){
        if(!opts || typeof(opts)!=="object") opts = {};
        const def_opts = {priority: 0};
        opts = Object.assign(def_opts, opts);
        
        if(typeof(callback)!=="function"){
            LiteGraph.log_error("registerCallbackHandler","Invalid callback");
            return false;
        }

        if(typeof(this.callbacks_handlers[name]) === "undefined"){
            this.callbacks_handlers[name] = {last_id: 0, handlers:[]};
        }
        const h_id = this.callbacks_handlers[name].last_id++;

        LiteGraph.log_info("registerCallbackHandler","new callback handler",name,h_id);

        this.callbacks_handlers[name].handlers.push({id: h_id, priority: opts.priority, callback: callback});

        // sort descending
        this.callbacks_handlers[name].handlers.sort((a, b) => b.priority - a.priority);

        LiteGraph.log_info("registerCallbackHandler","sorted",this.callbacks_handlers[name]);

        return h_id; // return the cbhandle id
    };
    unregisterCallbackHandler(name, h_id){
        if(typeof(this.callbacks_handlers[name]) !== "undefined"){
            const nHandlers = this.callbacks_handlers[name].handlers.length;
            this.callbacks_handlers[name].handlers = this.callbacks_handlers[name].handlers.filter(function( obj ) {
                if(obj.id === h_id){
                    LiteGraph.log_info("unregisterCallbackHandler",name,h_id);
                }
                return obj.id !== h_id;
            });
            if(this.callbacks_handlers[name].handlers.length < nHandlers){
                return true;
            }
        }
        return false;
    }
    processCallbackHandlers(name,opts){
        if(!opts || typeof(opts)!=="object") opts = {};
        const def_opts = {
            // WIP :: think try and setup
            // process: "all", return: "first", skip_null_return: true, append_last_return: false
        };
        opts = Object.assign(def_opts, opts);

        if(typeof(this.callbacks_handlers[name]) !== "undefined"){
            function clean_args(args) {
                let aRet = [];
                for(let iA=0; iA<args.length; iA++) {
                    if(typeof(args[iA])!=="undefined") aRet.push(args[iA]);
                }
                return aRet;
            }
            for(let cbhX of this.callbacks_handlers[name].handlers){
                // LiteGraph.log_info("processCallbackHandlers",name,cbhX);
                console.debug("processCallbackHandlers",name,cbhX);
                cbhX.callback(...(clean_args(arguments).slice(2)));
            }
        }
    }
}