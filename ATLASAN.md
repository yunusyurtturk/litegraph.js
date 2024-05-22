Integration *mostly* complete

L4565 excision, can't find specifically the right one
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


We lost audio playback between litegraph.js and lgraphnode.js for this commit.
Notably though, the audiosource is being decoded, and it's a silent error.
