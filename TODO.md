
# Goals for 1.0

There are in fact already many other flow graph tools in the world, but they aren't compatible code to
existing and are often not anywhere close to the full feature set of litegraph.

## Drop In Compatibility with OG

litegraph 1.0 can only be achieved when we have API compatibility with OG litegraph.  Effectively, while
it was viewed as a living codebase back when Javi had it, it has now been widely extended on and is
foundation code for some things.

## Near-Feature Compatibility with OG

Our goal for 1.0 is have a 'sufficiently' compatible feature set, while integrating 'bugfix' improvements
and any 'completion of feature' improvements as we imagine it.  We can also add nodepacks, but this is not
a goal of 1.0.

## Unit Testing and Debugging

LiteGraph only had 12 basic tests for core.  Our goal for the 1.x line is to expand the tests
to eventually have decent unit testing.  These should test that functionalities still exist
rather than becoming binding to detail.

## Documentation and Readability

A primary goal is to complete JSDocs comments for all of the code so that existing code can be read
and understood for ongoing development.

A secondary goal is to use modern JS features to make the code easier to read, smaller, and more streamlined internally.

# Status

* GL is getting close?
* Done conversion to ES6 up to L3967, gltextures.js
* 108 problems in lint
* Expand on Jest testing to run tests for each class, both in core and in src/nodes/
* LLink and LGraphCanvas are poorly documented

## Fix API breaks that have happened to date

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
* We lost audio playback between litegraph.js and lgraphnode.js during my integration of atlasan's work.
So we know what commit it was.  Notably though, the audiosource is being decoded, and it's a silent error.
