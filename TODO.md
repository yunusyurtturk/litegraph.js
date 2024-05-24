
# 1. Unit Testing and Debugging

GL is getting close?
Done up to L3967, gltextures.js
108 problems in lint
Expand on Jest testing to run tests for each class, both in core and in src/nodes/

# 2. Documentation

Set up JSDocs comments for LLink, LGraphCanvas

# Fix API breaks to date

* Replaced LiteGraph.*class* with just *class*
* Removed LiteGraph.closeAllContextMenus in favor of ContextMenu.closeAll()
* Removed LiteGraph.pointerAddListener in favor of addEventListener()
* Removed LiteGraph.pointerRemoveListener in favor of removeEventListener()
* Removed some unused/blank methods
* Removed Mesh.compile in favor of Mesh.upload
* Removed LiteGraph.pointerevents_method

# Extend classes *backwards* so that existing namespaces are the final product
