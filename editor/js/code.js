
import { LiteGraph } from "../../src/litegraph.js";
import { Editor } from "../../src/litegraph-editor.js";

export var gl = null; // webgl_canvas

// remove to prevent access from the console (why should?)
// if (typeof(global)=="object") global.LiteGraph = LiteGraph;
// if (typeof(window)=="object") window.LiteGraph = LiteGraph;

LiteGraph.log_info("LiteGraph included");
LiteGraph.initialize();

var webgl_canvas = null;

LiteGraph.node_images_path = "../nodes_data/";

var editor = new Editor("main",{miniwindow:false});
window.graphcanvas = editor.graphcanvas;
window.graph = editor.graph;
updateEditorHiPPICanvas();
window.addEventListener("resize", function() { 
 	editor.graphcanvas.resize();
  	updateEditorHiPPICanvas();
});
//window.addEventListener("keydown", editor.graphcanvas.processKey.bind(editor.graphcanvas) );
window.onbeforeunload = function(){
	var data = JSON.stringify( graph.serialize() );
	localStorage.setItem("litegraphg demo backup", data );
}

function updateEditorHiPPICanvas() {
  	const ratio = window.devicePixelRatio;
  	if(ratio == 1) { 
		return 
	}
  	const rect = editor.canvas.parentNode.getBoundingClientRect();
  	const { width, height } = rect;
  	editor.canvas.width = width * ratio;
  	editor.canvas.height = height * ratio;
  	editor.canvas.style.width = width + "px";
  	editor.canvas.style.height = height + "px";
  	editor.canvas.getContext("2d").scale(ratio, ratio);
  	return editor.canvas;
}

//enable scripting
LiteGraph.allow_scripts = true;

//test
//editor.graphcanvas.viewport = [200,200,400,400];

var dom_demo_select;

window.addEventListener("load", (event) => {
		
	//create scene selector
	var elem = document.createElement("span");
	elem.id = "LGEditorTopBarSelector";
	elem.className = "selector";
	elem.innerHTML = "";
	elem.innerHTML += "Demo <select><option>Empty</option></select> <button class='btn' id='save'>Save</button><button class='btn' id='load'>Load</button><button class='btn' id='download'>Download</button> | <button class='btn' id='webgl'>WebGL</button> <button class='btn' id='multiview'>Multiview</button>";
	editor.tools.appendChild(elem);
	dom_demo_select = elem.querySelector("select");
	dom_demo_select.addEventListener("change", function(e){
		var option = this.options[this.selectedIndex];
		var url = option.dataset["url"];
		
		if(url){
			LiteGraph.log_info("Editor:","Loading",url);
			graph.load( url );
		}else if(option.callback){
			LiteGraph.log_info("Editor:","callback");
			option.callback();
		}else{
			LiteGraph.log_info("Editor:","Clearing");
			graph.clear();
		}
	});

	elem.querySelector("#save").addEventListener("click",function(){
		console.log?.("saved");
		localStorage.setItem( "graphdemo_save", JSON.stringify( graph.serialize() ) );
	});

	elem.querySelector("#load").addEventListener("click",function(){
		var data = localStorage.getItem( "graphdemo_save" );
		if(data)
			graph.configure( JSON.parse( data ) );
		console.log?.("loaded");
	});

	elem.querySelector("#download").addEventListener("click",function(){
		var data = JSON.stringify( graph.serialize() );
		var file = new Blob( [ data ] );
		var url = URL.createObjectURL( file );
		var element = document.createElement("a");
		element.setAttribute('href', url);
		element.setAttribute('download', "graph.JSON" );
		element.style.display = 'none';
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
		setTimeout( function(){ URL.revokeObjectURL( url ); }, 1000*60 ); //wait one minute to revoke url	
	});

	elem.querySelector("#webgl").addEventListener("click", enableWebGL );
	elem.querySelector("#multiview").addEventListener("click", function(){ editor.addMultiview()  } );

	//some examples
	addDemo("Features", "examples/features.json");
	addDemo("Benchmark", "examples/benchmark.json");
	addDemo("Subgraph", "examples/subgraph.json");
	addDemo("Audio", "examples/audio.json");
	addDemo("Audio Delay", "examples/audio_delay.json");
	addDemo("Audio Reverb", "examples/audio_reverb.json");
	addDemo("MIDI Generation", "examples/midi_generation.json");
	addDemo("Copy Paste", "examples/copypaste.json");
	addDemo("autobackup", function(){
		var data = localStorage.getItem("litegraphg demo backup");
		if(!data)
			return;
		var graph_data = JSON.parse(data);
		graph.configure( graph_data );
	});
});

function addDemo( name, url ) {
	var option = document.createElement("option");
	if(url.constructor === String)
		option.dataset["url"] = url;
	else
		option.callback = url;
	option.innerHTML = name;
	if(dom_demo_select) dom_demo_select.appendChild( option );
	LiteGraph.log_info("Editor:","Add demo",name,url);
}


//allows to use the WebGL nodes like textures
function enableWebGL() {
	if( webgl_canvas ) {
		webgl_canvas.style.display = (webgl_canvas.style.display == "none" ? "block" : "none");
		return;
	}

	let libs = [
		"./libs/gl-matrix-min.js",
		"./libs/litegl.js",
	];
	  
	async function fetchJS(scriptPath) {
		if (libs.length === 0) {
		 	return on_ready();
		}
	  	try {
		 	await import(scriptPath);
		  	console.log?.(`${scriptPath} loaded successfully`);
		} catch (error) {
		  	console.error?.(`Error loading ${scriptPath}: ${error}`);
		}
	}
	libs.forEach(lib => fetchJS(lib));

	const on_ready = () => {
		console.log?.(this.src);
		if(!window.GL) {
			LiteGraph.log_warn("GL doesn't exist");
			return;
		}
		webgl_canvas = document.createElement("canvas");
		webgl_canvas.width = 400;
		webgl_canvas.height = 300;
		webgl_canvas.style.position = "absolute";
		webgl_canvas.style.top = "0px";
		webgl_canvas.style.right = "0px";
		webgl_canvas.style.border = "1px solid #AAA";

		webgl_canvas.addEventListener("click", function() {
			var rect = webgl_canvas.parentNode.getBoundingClientRect();
			if( webgl_canvas.width != rect.width ) {
				webgl_canvas.width = rect.width;
				webgl_canvas.height = rect.height;
			}
			else {
				webgl_canvas.width = 400;
				webgl_canvas.height = 300;
			}
		});

		var parent = document.querySelector(".editor-area");
		parent.appendChild( webgl_canvas );
		gl = GL.create({ canvas: webgl_canvas });
		if(!gl) {
			LiteGraph.log_warn("gl doesn't exist");
			return;
		}
		libs = [
			"../src/nodes/gltextures.js",
			"../src/nodes/glfx.js",
			"../src/nodes/glshaders.js",
			"../src/nodes/geometry.js"
		];
		libs.forEach(lib => fetchJS(lib));

		editor.graph.onBeforeStep = () => {
			gl.clearColor(0,0,0,0);
			gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
			gl.viewport(0,0,gl.canvas.width, gl.canvas.height );
		}

		console.log?.("webgl ready");
	}
}

// Tests
// CopyPasteWithConnectionToUnselectedOutputTest();
// demo();