import { LiteGraph } from "../litegraph.js";
import { HtmlNode } from "./html.js";

class ThreeJsHelper {
    static checkLib(){
        let state = LiteGraph?.libraries.getLibraryState("threejs");
        if(!state || state == "unknown" || state == "not_loaded"){
            // TODO move and implement library inclusion
            // add minimum version
            // add and use global identifier :: check if exists after inclusion and tie with LiteGraph.libraries[identifier] for not modules
            // manage loaded etc
            // nodepack with inclusion aside
            // manage local script repository too
            LiteGraph.libraries.registerLibrary("threejs", "0.172.0", ["https://cdnjs.cloudflare.com/ajax/libs/three.js/0.172.0/three.module.js"], "threejs");
            LiteGraph.libraries.loadLibrary("threejs");
            return false;
        }else{
            return LiteGraph.libraries.threejs;
        }
    }
}

class ThreeJsObject {
    static title = "3js Object";
    static desc = "Create a Three.js Object3D";

    constructor() {
        this.addOutput("object", "3jsObject");

        this.addProperty("id", "", "string", { readonly: true });
        this.addProperty("uuid", "", "string", { readonly: true });
        this.addProperty("name", "", "string");
        this.addProperty("position", [0, 0, 0], "vec3"); 
        this.addProperty("rotation", [0, 0, 0], "vec3");
        this.addProperty("scale", [1, 1, 1], "vec3");
        this.addProperty("parent", null, "3jsObject");
        this.addProperty("visible", true, "bool");

        this._object = null;
    }

    onExecute() {
        let THREE = ThreeJsHelper.checkLib();
        if (!THREE) return;

        this.checkObject();
        this.updateObject();
        this.setOutputData(0, this._object);
    }

    checkObject() {
        if (!this._object) this.create();
    }

    create() {
        let THREE = ThreeJsHelper.checkLib();
        if (!THREE) return;

        this._object = new THREE.Object3D();
        this._object.uuid = THREE.MathUtils.generateUUID(); // Generate unique ID

        this.updateObject(); // Apply properties
    }

    updateObject() {
        let THREE = ThreeJsHelper.checkLib();
        if (!THREE) return;

        if (!this._object) return;

        this._object.name = this.properties.name || "";
        this._object.visible = this.properties.visible;

        let pos = this.properties.position;
        if(pos) this._object.position.set(pos[0], pos[1], pos[2]);

        let rot = this.properties.rotation;
        if(rot) this._object.rotation.set(rot[0], rot[1], rot[2]);

        let scl = this.properties.scale;
        if(scl) this._object.scale.set(scl[0], scl[1], scl[2]);

        // Parent linking
        let parent = this.getInputData(0);
        if (parent && parent instanceof THREE.Object3D && parent !== this._object.parent) {
            parent.add(this._object);
        }
    }
}
LiteGraph.registerNodeType("threejs/object", ThreeJsObject);


class ThreeJsMesh extends ThreeJsObject {
    static title = "3js Mesh";
    static desc = "Create a Three.js Mesh";

    constructor() {
        super();
        this.addInput("geometry", "3jsGeometry");
        this.addInput("material", "3jsMaterial");
    }

    create() {
        let THREE = ThreeJsHelper.checkLib();
        if (!THREE) return;

        let geometry = this.getInputData(0) || new THREE.BoxGeometry(1, 1, 1);
        let material = this.getInputData(1) || new THREE.MeshBasicMaterial({ color: 0x00ff00 });

        this._object = new THREE.Mesh(geometry, material);
        this._object.uuid = THREE.MathUtils.generateUUID();
        this.updateObject();
    }
}
LiteGraph.registerNodeType("threejs/mesh", ThreeJsMesh);


class ThreeJsLight extends ThreeJsObject {
    static title = "3js Light";
    static desc = "Create a Three.js Light";

    constructor() {
        super();
        this.addProperty("type", "PointLight", "enum", { values: ["PointLight", "DirectionalLight", "AmbientLight"] });
        this.addProperty("color", [255, 255, 255], "color");
        this.addProperty("intensity", 1, "number");
    }

    create() {
        let THREE = ThreeJsHelper.checkLib();
        if (!THREE) return;

        let color = new THREE.Color(this.properties.color[0] / 255, this.properties.color[1] / 255, this.properties.color[2] / 255);
        let intensity = this.properties.intensity;

        switch (this.properties.type) {
            case "PointLight":
                this._object = new THREE.PointLight(color, intensity);
                break;
            case "DirectionalLight":
                this._object = new THREE.DirectionalLight(color, intensity);
                break;
            case "AmbientLight":
                this._object = new THREE.AmbientLight(color, intensity);
                break;
        }

        this._object.uuid = THREE.MathUtils.generateUUID();
        this.updateObject();
    }
}
LiteGraph.registerNodeType("threejs/light", ThreeJsLight);


class ThreeJsCamera extends ThreeJsObject {
    static title = "3js Camera";
    static desc = "Create a Three.js Camera";

    constructor() {
        super();
        this.outputs[0].type = "3jsCamera";
        this.addProperty("fov", 75, "number");
        this.addProperty("aspect", 1.6, "number");
        this.addProperty("near", 0.1, "number");
        this.addProperty("far", 1000, "number");
    }

    create() {
        let THREE = ThreeJsHelper.checkLib();
        if (!THREE) return;

        this._object = new THREE.PerspectiveCamera(
            this.properties.fov,
            this.properties.aspect,
            this.properties.near,
            this.properties.far
        );

        this._object.uuid = THREE.MathUtils.generateUUID();
        this.updateObject();
    }
}
LiteGraph.registerNodeType("threejs/camera", ThreeJsCamera);


class ThreeJsScene {
    static title = "3js Scene";
    static desc = "Create a Three.js Scene";

    constructor() {
        this.addOutput("scene", "3jsScene");
        this._scene = null;
    }

    onExecute() {
        this.checkObject();
        this.setOutputData(0, this._scene);
    }

    checkObject() {
        if (!this._scene) this.create();
    }

    create() {
        let THREE = ThreeJsHelper.checkLib();
        if (!THREE) return;

        this._scene = new THREE.Scene();
    }
}
LiteGraph.registerNodeType("threejs/scene", ThreeJsScene);


class ThreeJsRenderer {
    static title = "3js Renderer";
    static desc = "Render a Three.js Scene";

    constructor() {
        this.addInput("scene", "3jsScene");
        this.addInput("camera", "3jsCamera");
        this.addOutput("canvas", "canvas");

        this._renderer = null;
    }

    onExecute() {
        this.checkObject();
        if (!this._renderer) return;

        let scene = this.getInputData(0);
        let camera = this.getInputData(1);

        if (scene && camera) {
            this._renderer.render(scene, camera);
        }

        this.setOutputData(0, this._renderer.domElement);
    }

    checkObject() {
        if (!this._renderer) this.create();
    }

    create() {
        let THREE = ThreeJsHelper.checkLib();
        if (!THREE) return;

        this._renderer = new THREE.WebGLRenderer({ antialias: true });
        this._renderer.setSize(800, 600);
        this._renderer.setPixelRatio(window.devicePixelRatio);
    }
}
LiteGraph.registerNodeType("threejs/renderer", ThreeJsRenderer);



class ThreeJsCanvas extends HtmlNode {
    static title = "3js Canvas";
    static desc = "Embed a Three.js canvas inside the node";

    constructor() {
        super();
        this.addInput("scene", "3jsScene");
        this.addInput("camera", "3jsCamera");
        this.addOutput("canvas", "canvas");

        this.properties.html = "<canvas id='threejs-canvas' style='width:100%; height:100%;'></canvas>";
        this._renderer = null;
        this._canvas = null;
    }

    onExecute() {
        this.refreshSlots();
        if (!this._el_cont) return;

        // Get canvas from HTML container
        this._canvas = this._el_cont.querySelector("canvas");
        if (!this._canvas) return;

        // Initialize WebGL renderer if not already created
        if (!this._renderer) {
            let THREE = ThreeJsHelper.checkLib();
            if (!THREE) return;

            this._renderer = new THREE.WebGLRenderer({ canvas: this._canvas });
            this._renderer.setSize(this.size[0], this.size[1]);
        }

        // Get scene and camera from inputs
        let scene = this.getInputData(0);
        let camera = this.getInputData(1);

        if (scene && camera) {
            this._renderer.render(scene, camera);
        }

        this.setOutputData(0, this._canvas);
    }
}
LiteGraph.registerNodeType("threejs/canvas", ThreeJsCanvas);


class ThreeJsPrimitiveMesh extends ThreeJsObject {
    static title = "3js Primitive Mesh";
    static desc = "Create a basic Three.js Mesh";

    constructor() {
        super();
        this.addInput("material", "3jsMaterial");
        this.addOutput("mesh", "3jsMesh");

        this.addProperty("type", "BoxGeometry", "enum", { 
            values: ["BoxGeometry", "SphereGeometry", "CylinderGeometry", "PlaneGeometry", "TorusGeometry"]
        });

        // Default parameters for each geometry type
        this.addProperty("width", 1, "number"); // Used in Box, Plane
        this.addProperty("height", 1, "number"); // Used in Box, Plane
        this.addProperty("depth", 1, "number"); // Used in Box
        this.addProperty("radius", 1, "number"); // Used in Sphere, Cylinder, Torus
        this.addProperty("segments", 32, "number"); // Used in Sphere, Cylinder, Torus

        this._mesh = null;
    }

    onExecute() {
        this.checkObject();
        this.updateMesh();
        this.setOutputData(0, this._mesh);
    }

    checkObject() {
        if (!this._mesh) this.create();
    }

    create() {
        let THREE = ThreeJsHelper.checkLib();
        if (!THREE) return;

        let geometry = this.createGeometry(THREE);
        let material = this.getInputData(0) || new THREE.MeshBasicMaterial({ color: 0x00ff00 });

        this._mesh = new THREE.Mesh(geometry, material);
        this._mesh.uuid = THREE.MathUtils.generateUUID();
        this.updateObject();
    }

    createGeometry(THREE) {
        let type = this.properties.type;
        let { width, height, depth, radius, segments } = this.properties;

        switch (type) {
            case "BoxGeometry":
                return new THREE.BoxGeometry(width, height, depth);
            case "SphereGeometry":
                return new THREE.SphereGeometry(radius, segments, segments);
            case "CylinderGeometry":
                return new THREE.CylinderGeometry(radius, radius, height, segments);
            case "PlaneGeometry":
                return new THREE.PlaneGeometry(width, height);
            case "TorusGeometry":
                return new THREE.TorusGeometry(radius, 0.3, segments, segments);
            default:
                return new THREE.BoxGeometry(1, 1, 1);
        }
    }

    updateMesh() {
        if (!this._mesh) return;

        let THREE = ThreeJsHelper.checkLib();
        if (!THREE) return;

        // Update geometry if type changed
        let newGeometry = this.createGeometry(THREE);
        this._mesh.geometry.dispose(); // Remove old geometry
        this._mesh.geometry = newGeometry;

        // Update material from input
        let material = this.getInputData(0);
        if (material) {
            this._mesh.material = material;
        }
    }
}
LiteGraph.registerNodeType("threejs/primitive_mesh", ThreeJsPrimitiveMesh);


class ThreeJsAddObject {
    static title = "3js Add Object";
    static desc = "Add a Three.js Object to Another or Scene";

    constructor() {
        this.addInput("object", "3jsObject");
        this.addInput("parent", "3jsObject|3jsScene");
        this.addOutput("object", "3jsObject");

        this._object = null;
        this._parent = null;
    }

    onExecute() {
        let object = this.getInputData(0);
        let parent = this.getInputData(1);

        if (!object || !parent) return; // Both inputs must be connected

        // Prevent adding the object multiple times
        if (this._object !== object || this._parent !== parent) {
            this.attachObject(object, parent);
        }

        this.setOutputData(0, object);
    }

    attachObject(object, parent) {
        let THREE = ThreeJsHelper.checkLib();
        if (!THREE) return;

        // Ensure both are valid Three.js objects
        if (!(object instanceof THREE.Object3D) || !(parent instanceof THREE.Object3D)) {
            console.warn("Invalid Three.js objects provided.");
            return;
        }

        // Remove object from previous parent if necessary
        if (object.parent) {
            object.parent.remove(object);
        }

        // Attach object to new parent
        parent.add(object);

        // Store the references to avoid reattaching
        this._object = object;
        this._parent = parent;
    }
}
LiteGraph.registerNodeType("threejs/add_object", ThreeJsAddObject);


class ThreeJsMaterial {
    static title = "3js Material";
    static desc = "Create a Three.js Material";

    constructor() {
        this.addInput("texture", "texture");
        this.addOutput("material", "3jsMaterial");

        this.addProperty("type", "MeshStandardMaterial", "enum", {
            values: [
                "MeshBasicMaterial",
                "MeshStandardMaterial",
                "MeshPhongMaterial",
                "MeshToonMaterial",
                "MeshLambertMaterial"
            ]
        });

        this.addProperty("color", [255, 255, 255], "color");
        this.addProperty("metalness", 0.5, "number"); // Used in Standard
        this.addProperty("roughness", 0.5, "number"); // Used in Standard
        this.addProperty("shininess", 30, "number"); // Used in Phong

        this._material = null;
    }

    onExecute() {
        this.checkObject();
        this.updateMaterial();
        this.setOutputData(0, this._material);
    }

    checkObject() {
        if (!this._material) this.create();
    }

    create() {
        let THREE = ThreeJsHelper.checkLib();
        if (!THREE) return;

        let type = this.properties.type;
        let materialClass = THREE[type] || THREE.MeshStandardMaterial;

        let color = new THREE.Color(
            this.properties.color[0] / 255,
            this.properties.color[1] / 255,
            this.properties.color[2] / 255
        );

        let options = { color };

        if (type === "MeshStandardMaterial") {
            options.metalness = this.properties.metalness;
            options.roughness = this.properties.roughness;
        } else if (type === "MeshPhongMaterial") {
            options.shininess = this.properties.shininess;
        }

        this._material = new materialClass(options);
        this.updateMaterial();
    }

    updateMaterial() {
        if (!this._material) return;
        let THREE = ThreeJsHelper.checkLib();
        if (!THREE) return;

        let color = new THREE.Color(
            this.properties.color[0] / 255,
            this.properties.color[1] / 255,
            this.properties.color[2] / 255
        );

        this._material.color.set(color);

        if (this._material.metalness !== undefined) {
            this._material.metalness = this.properties.metalness;
            this._material.roughness = this.properties.roughness;
        }

        if (this._material.shininess !== undefined) {
            this._material.shininess = this.properties.shininess;
        }

        // Assign texture if available
        let texture = this.getInputData(0);
        if (texture && texture.isTexture) {
            this._material.map = texture;
            this._material.needsUpdate = true;
        }
    }
}
LiteGraph.registerNodeType("threejs/material", ThreeJsMaterial);


class ThreeJsTexture {
    static title = "3js Texture";
    static desc = "Load and preview a texture for Three.js materials";

    constructor() {
        this.addInput("url", "string");
        this.addOutput("texture", "texture");

        this.addProperty("url", "", "string");
        this.addProperty("repeatX", 1, "number");
        this.addProperty("repeatY", 1, "number");
        this.addProperty("wrapS", "RepeatWrapping", "enum", {
            values: ["RepeatWrapping", "ClampToEdgeWrapping", "MirroredRepeatWrapping"]
        });
        this.addProperty("wrapT", "RepeatWrapping", "enum", {
            values: ["RepeatWrapping", "ClampToEdgeWrapping", "MirroredRepeatWrapping"]
        });

        this._texture = null;
        this._image = null;
        this._lastUrl = null;
        this.size = [210, 140]; // Default node size
    }

    onAdded() {
        if (this.properties.url) {
            this.loadImage(this.properties.url);
        }
    }

    onExecute() {
        let url = this.getInputData(0) || this.properties.url;

        if (!url || url === this._lastUrl) {
            this.setOutputData(0, this._texture);
            return;
        }

        this.loadImage(url);
        this._lastUrl = url;
        this.setOutputData(0, this._texture);
    }

    onDrawBackground(ctx) {
        if (this.flags.collapsed || !this._image) return;
        ctx.drawImage(this._image, 0, 0, this.size[0], this.size[1]);
    }

    onPropertyChanged(name, value) {
        this.properties[name] = value;
        if (name === "url" && value) {
            this.loadImage(value);
        }
        return true;
    }

    loadImage(url) {
        if (!url) {
            this._image = null;
            this._texture = null;
            return;
        }

        this._image = new Image();

        if (url.startsWith("http") && LiteGraph.proxy) {
            url = LiteGraph.proxy + url.substr(url.indexOf(":") + 3);
        }

        this._image.src = url;
        this.boxcolor = "#F95";

        this._image.onload = () => {
            console.log?.(`Texture loaded: ${this._image.width}x${this._image.height}`);
            this._texture = this.createThreeJsTexture(url);
            this.boxcolor = "#9F9";
            this.setDirtyCanvas(true);
        };

        this._image.onerror = () => {
            console.log?.(`Error loading texture: ${url}`);
        };
    }

    createThreeJsTexture(url) {
        let THREE = ThreeJsHelper.checkLib();
        if (!THREE) return null;

        let loader = new THREE.TextureLoader();
        let texture = loader.load(url);
        texture.wrapS = THREE[this.properties.wrapS];
        texture.wrapT = THREE[this.properties.wrapT];
        texture.repeat.set(this.properties.repeatX, this.properties.repeatY);
        return texture;
    }

    onDropFile(file) {
        if (this._url) {
            URL.revokeObjectURL(this._url);
        }
        this._url = URL.createObjectURL(file);
        this.properties.url = this._url;
        this.loadImage(this._url);
    }

    static widgets = [{ name: "load", text: "Load", type: "button" }];
    static supported_extensions = ["jpg", "jpeg", "png", "gif"];
}
LiteGraph.registerNodeType("threejs/texture", ThreeJsTexture);


class ThreeJsTransform {
    static title = "3js Transform";
    static desc = "Update position, rotation (Euler), and scale of a 3D object";

    constructor() {
        this.addInput("object", "3jsObject");
        this.addOutput("object", "3jsObject");

        this.addProperty("position", [0, 0, 0], "vec3");
        this.addProperty("rotation", [0, 0, 0], "vec3"); // Euler angles
        this.addProperty("scale", [1, 1, 1], "vec3");

        this._object = null;
    }

    onExecute() {
        let THREE = ThreeJsHelper.checkLib();
        if (!THREE) return;
        
        let object = this.getInputData(0);
        if (!object || !(object instanceof THREE.Object3D)) return;

        this._object = object;

        let position = this.properties.position;
        let rotation = this.properties.rotation;
        let scale = this.properties.scale;

        // Update position
        if (position) {
            object.position.set(position[0], position[1], position[2]);
        }

        // Update rotation (converting from Euler angles to radians)
        if (rotation) {
            object.rotation.set(
                THREE.MathUtils.degToRad(rotation[0]),
                THREE.MathUtils.degToRad(rotation[1]),
                THREE.MathUtils.degToRad(rotation[2])
            );
        }

        // Update scale
        if (scale) {
            object.scale.set(scale[0], scale[1], scale[2]);
        }

        this.setOutputData(0, object);
    }
}
LiteGraph.registerNodeType("threejs/transform", ThreeJsTransform);
