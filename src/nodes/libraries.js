
import { LiteGraph } from "../litegraph.js";

// WIP
// https://api.cdnjs.com/libraries
// dynamically load libraries and to to expose global object and methods
const libraries_known = {
    // "jquery": {"obj":"jQuery","name":"jquery", "latest":"..URL.."}
    "fullPage.js": {"obj":"fullPage","name":"fullPage.js", "latest":"https://cdnjs.cloudflare.com/ajax/libs/fullPage.js/4.0.25/fullpage.min.js"}
};
const libraries_loaded = {
    // "vue":{},
};
LiteGraph.libraries = {}; // STORING REFERENCES
// should make a class for this, and add this to graph, serialize data to get that back when loading back
/**/

function camelize(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
        return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
    }).replace(/\s+/g, '');
}

// CDN LIBRARY SEARCH

class CDNLibSearch {
    constructor() {
        this.addInput("search", LiteGraph.ACTION);
        // this.addInput("name", "string"); in optionals
        this.addProperty("name", "", "string");
        this.addOutput("ready", LiteGraph.EVENT);
        this.addOutput("results", "array");
        this.addOutput("first name", "object");
        this.addOutput("first object", "object");
        // this.addOutput("error", LiteGraph.EVENT); // in optionals
        this.addWidget("string", "name", this.properties.name, "name");
        // this.addWidget("button", "Fetch", null, this.fetch.bind(this));
        this._data = null;
        this._fetching = null;
        this.base_url = "https://api.cdnjs.com/libraries";
    }

    static title = "CDN Search";
    static desc = "Search and fetch CDN libraries";

    search() {
        var that = this;
        var url = this.base_url;
        var name = this.getInputOrProperty("name");
        if(name && name!=="") {
            url += "?search="+name;
        }
        this._fetching = fetch(url)
            .then((resp) => {
                if(!resp.ok) {
                    this.boxcolor = "#F00";
                    that.trigger("error");
                }else{
                    this.boxcolor = "#0F0";
                    return resp.text();
                }
            })
            .then((data) => {
                that._data = data;
                that._fetching = null;

                // var libsNames = [];
                // for(var iL in data.results){
                // libsNames.push(data.results[iL]["name"]);
                // }

                if(this._data && typeof(this._data)=="string") {
                    try{
                        this._data = JSON.parse(this._data);
                    }catch(e) {
                        console.warn?.("Not a JSON resp",this._data);
                    }
                }

                if(this._data && typeof(this._data)=="object") {
                    if(this._data.results && this._data.results.length && this._data.results[0]["name"]) {
                        this.setOutputData(1, this._data.results); // array of result libs
                        this.setOutputData(2, this._data.results[0]["name"]);
                        this.setOutputData(3, this._data.results[0]);
                    }else{
                    // no results?
                        this.setOutputData(2, null);
                        this.setOutputData(3, null);
                    }
                }else{
                    this.setOutputData(2, null);
                    this.setOutputData(3, null);
                }
                that.trigger("ready");
            });
    }

    onAction(evt) {
        if(evt == "search")
            this.search();
    }

    onExecute() {
        // this.setOutputData(1, this._data); // "data"
        // if(this._data && typeof(this._data)=="string"){
        //     try{
        //         this._data = JSON.parse(this._data);
        //     }catch(e){
        //         console.warn?.("Not a JSON resp",this._data);
        //     }
        // }
        // if(this._data && typeof(this._data)=="object"){
        //     if(this._data.results && this._data.results.length){
        //         this.setOutputData(2, this._data.results[0]);
        //     }
        // }else{
        //     this.setOutputData(2, null);
        // }
    }

    onGetInputs() {
        return [["name","string"]];
    }

    onGetOutputs() {
        return [["error",LiteGraph.EVENT]];
    }
}
LiteGraph.registerNodeType("libraries/search_CDN_lib", CDNLibSearch);


// CDN LIBRARY LOAD INCLUDE

class CDNLibInclude {

    static title = "Lib Load";
    static desc = "Load and include a JS library (CDN or url)";

    constructor() {
        this.addInput("load", LiteGraph.ACTION);
        this.addInput("lib_spec", "object,cdn_lib");
        this.addInput("url", "string,url", {param_bind: true});
        this.addInput("name", "string", {param_bind: true});
        this.addOutput("ready", LiteGraph.EVENT);
        this.addOutput("error", LiteGraph.EVENT);
        // this.addOutput("error", LiteGraph.EVENT); // in optionals
        // this.addWidget("button", "load", null, this.load.bind(this));
        // this.addProperty("type", "text/javascript", "enum", {values:["text/javascript", "module"]});
        this.addProperty("module", true, "boolean");
        this.addProperty("url", "", "string", {});
        this.addProperty("name", "", "string", {});
        this.addWidget("string", "url", "", "url", {});
        this.addWidget("string", "name", "", "name", {});
        this.addWidget("toggle", "module", false, "module", {});
    }

    load() {
        var that = this;
        var url = this.getInputOrProperty("url");
        var name = this.getInputOrProperty("name");
        let lib_spec = {};
        if(!url){
            lib_spec = this.getInputOrProperty("lib_spec");
            if(lib_spec && typeof(lib_spec)=="object" && lib_spec.latest) {
                url = lib_spec.latest;
                name = lib_spec.name;
                
                // Step 1: Remove all invalid characters except underscores and dollar signs
                let validName = name.replace(/[^a-zA-Z0-9_$]/g, '_');
                // Step 2: Ensure the name doesn't start with a digit
                if (/^[0-9]/.test(validName)) {
                    validName = '_' + validName;
                }
                name = validName;

            }
        }else{
            if(url && name){
                lib_spec = {name: name, latest: url}; //namename
            }else{
                // TODO should color red, invalid
            }
        }
        if(lib_spec && lib_spec.latest){
            url = lib_spec.latest;
            name = lib_spec.name;
            name = camelize(name);
            this.setProperty("name",name);
            this.setProperty("url",url);
            
            var script = document.createElement("script");
            if(this.properties.module){

                script.type = "module"; // this.properties.module ? "module" : "text/javascript";
                script.textContent = "import * as "+this.properties.name+" from '"+url+"';";
                // script.textContent = "import { LiteGraph } from '../litegraph.js';";
                script.textContent += " "+"window."+this.properties.name+" = "+this.properties.name+";";
                // script.textContent += " "+"LiteGraph.libraries."+this.properties.name+" = "+this.properties.name+";";
                script.textContent += " "+"LiteGraph.libraries."+this.properties.name+" = {};";
                script.textContent += " "+"Object.assign(LiteGraph.libraries."+this.properties.name+", "+this.properties.name+");";
                try{
                    console.debug?.("Lib script load",this.properties.name,url);
                    document.head.appendChild(script);
                    // wait for load
                    this.boxcolor = "#770";
                }catch(e){
                    console.warn?.("Lib script failed",this.properties.name,url,e);
                    this.boxcolor = "#F00";
                }

            }else{

                script.type = this.properties.module ? "module" : "text/javascript";
                script.onload = function(a) {
                    that.on_loaded(lib_spec, a);
                    that.boxcolor = "#0F0";
                }
                script.onerror = function(e) {
                    that.on_error(lib_spec, e);
                    that.boxcolor = "#F00";
                }
                script.src = url;
                document.head.appendChild(script);

            }
            
        }else{
            this.boxcolor = "#F00";
        }
    }

    on_loaded(ob_lib, a) {
        console.debug?.("Loaded library",ob_lib,a);
        if(ob_lib && ob_lib.name) {
            this.trigger("ready");
            libraries_loaded[ob_lib.name] = ob_lib;
            this.boxcolor = "#0F0";
        }else{
            this.on_error(ob_lib);
        }
    }

    on_error(ob_lib, e) {
        this.trigger("error");
        this.boxcolor = "#F00";
        console.warn?.("Lib loading failed",ob_lib,e);
    }

    onAction(evt) {
        if(evt == "load") {
            this.load();
        }
    }

    onExecute() {
        // ?
    }

    onGetInputs() {
        // return [["name","string"]];
    }
    onGetOutputs() {
        // return [["error",LiteGraph.EVENT]];
    }
}
LiteGraph.registerNodeType("libraries/load", CDNLibInclude);
