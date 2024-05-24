
# 1. Unit Testing and Debugging

GL is getting close?
Done up to L3967, gltextures.js
108 problems in lint
Expand on Jest testing to run tests for each class, both in core and in src/nodes/

# 2. Documentation

Set up JSDocs comments for LLink, LGraphCanvas

# 3. Fix API breaks to date

* Removed LiteGraph.pointerAddListener in favor of addEventListener()
* Removed LiteGraph.pointerRemoveListener in favor of removeEventListener()
* Removed Mesh.compile in favor of Mesh.upload as it was already deprecated
* Removed LiteGraph.pointerevents_method
* L4565 excision, can't find specifically the right one
```
if (this.onConnectionsChange) {
		  this.onConnectionsChange(
		      LiteGraph.OUTPUT,
		      slot,
		      false,
		      link_info,
		      output
		  );
	}
	// JUST THIS ONE BELOW
	if (this.graph && this.graph.onNodeConnectionChange) {
		  this.graph.onNodeConnectionChange(
		      LiteGraph.OUTPUT,
		      this,
		      slot
		  );
	}
```
* We lost audio playback between litegraph.js and lgraphnode.js for this commit.
Notably though, the audiosource is being decoded, and it's a silent error.

# 4. Extend classes *backwards* so that existing namespaces are the final product

