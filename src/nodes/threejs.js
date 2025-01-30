import { LiteGraph } from "../litegraph.js";

class ThreeJsHelper {
    static checkLib(){
        if(typeof(THREE) == "object"){
            return THREE;
        }
        if(){

        }
        return false;
    }
}

class ThreeJsObject {
    static title = "3js Object";
    static desc = "Create a ThreeJs object";
    constructor() {
        this.addOutput("object", "3jsObject|object");
        this.addProperty("id", "", "string", {readonly: true});
        this.addProperty("uuid", "", "string", {readonly: true});
        this.addProperty("name", "", "string");
        this.addProperty("position", "", "vec3"); // or 3jsVector3
        this.addProperty("rotation", "", "3jsRotEuler"); // or 3jsVector3
        this.addProperty("scale", "", "vec3"); // or 3jsVector3
        this.addProperty("parent", "", "3jsObject");
        this.addProperty("children", "", "array", {});
        this.addProperty("visible", true, "bool");
        this._object = null;
    }
    onExecute() {
        this.checkObject();
        this.setOutputData(0, this._object);
    }
    checkObject(){
        if(!this._object) this.create();
    }
    create(){
        let lib = ThreeJsHelper.checkLib();
        if(!lib) return;
        this._object = new lib.Object3D();
        // TODO should use an array of linked properties-objectProperties 
        if(this.properties.name && this.properties.name!=="") this._object.name = this.properties.name;
        if(this.properties.position && this.properties.position!=="") this._object.position.set(this.properties.position);
        if(this.properties.rotation && this.properties.rotation!=="") this._object.rotation.set(this.properties.rotation);
        if(this.properties.scale && this.properties.scale!=="") this._object.scale.set(this.properties.scale);
        if(this.properties.parent && this.properties.parent!=="") this._object.parent = this.properties.parent;
        if(this.properties.children && this.properties.children!=="") this._object.children = this.properties.children;
        this._object.visible = this.properties.visible;
    }
}
LiteGraph.registerNodeType("threejs/object", ThreeJsObject);