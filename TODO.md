
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

* GL is getting close
* 34 problems in lint
* Expand on Jest testing to run tests for each class, both in core and in src/nodes/
* LGraphCanvas documented up to L500
* Bug in LGraphCanvas.processDrop

## Fix API breaks that have happened to date

* Removed and Re-Added LiteGraph.pointerAddListener, still broken
* Removed and Re-Added LiteGraph.pointerRemoveListener, still broken
* Removed and Re-Added LiteGraph.pointerevents_method, still broken

* Removed Mesh.compile in favor of Mesh.upload as it was already deprecated
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

## What We Do Let Break for 1.0

* Anything that relies on arcane details within methods or something not existing etc.  If you need exactly
  LiteGraph 0.4.0 then that's available there.
* We use ES6 class behavior
* We use Modular, not CommonJS
* Deprecated 3rd Party endpoints like JQuery 1.6.2, or DOMMouseScroll or document.createElement('CustomEvent')
* We use modern audit-passing tools - Jest, ESLint but not Prettier, JSDocs but not Yuidocs
