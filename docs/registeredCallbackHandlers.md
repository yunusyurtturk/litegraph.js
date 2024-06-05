WIP

Clean and use this list to reprocess implemented callbacks available for each class

Document and test

TODO: repeat export process as lgraph was not implemented and some mods been made


litegraph.js (8 hits)
	Line  384:         LiteGraph.processCallbackHandlers("onNodeTypeRegistered",{
	Line  389:             LiteGraph.processCallbackHandlers("onNodeTypeReplaced",{
	Line  658:         LiteGraph.log_verbose("createNode","created",node,node.processCallbackHandlers);
	Line  661:         node.processCallbackHandlers("onNodeCreated",{
	
	
lgraphcanvas.js (74 hits)
	Line  166:         return this.cb_handler.processCallbackHandlers(...arguments);
	Line  212:         this.processCallbackHandlers("onClear",{
	Line  694:         var cbRet = this.processCallbackHandlers("onClear",{
	Line  835:                                         node.processCallbackHandlers("onOutputDblClick",{
	Line  840:                                         node.processCallbackHandlers("onOutputClick",{
	Line  869:                                         node.processCallbackHandlers("onInputDblClick",{
	Line  874:                                         node.processCallbackHandlers("onInputClick",{
	Line  952:                         node.processCallbackHandlers("onDblClick",{
	Line  960:                     var cbRet = node.processCallbackHandlers("onMouseDown",{
	Line 1185:         this.processCallbackHandlers("onMouseDown",{
	Line 1281:                         this.node_over.processCallbackHandlers("onMouseLeave",{
	Line 1303:                     node.processCallbackHandlers("onMouseEnter",{
	Line 1310:                 node.processCallbackHandlers("onMouseMove",{
	Line 1406:                 this.node_capturing_input.processCallbackHandlers("onMouseMove",{
	Line 1675:                 this.processCallbackHandlers("onNodeMoved",{
	Line 1698:                     this.node_over.processCallbackHandlers("onMouseUp",{
	Line 1704:                     this.node_capturing_input.processCallbackHandlers("onMouseUp",{
	Line 1956:                     this.selected_nodes[i].processCallbackHandlers("onKeyDown",{
	Line 1970:                     this.selected_nodes[i].processCallbackHandlers("onKeyUp",{
	Line 2149:             r = this.processCallbackHandlers("onDropItem",{
	Line 2173:                     r = node.processCallbackHandlers("onDropFile",{
	Line 2186:                             node.processCallbackHandlers("onDropData",{
	Line 2207:             r = node.processCallbackHandlers("onDropItem",{
	Line 2216:             r = this.processCallbackHandlers("onDropItem",{
	Line 2241:                 node.processCallbackHandlers("onDropFile",{
	Line 2253:          *  let r = this.processCallbackHandlers("onShowNodePanel",{
	Line 2258:         let r = this.processCallbackHandlers("onShowNodePanel",{
	Line 2265:         this.processCallbackHandlers("onNodeDblClicked",{
	Line 2273:         this.processCallbackHandlers("onNodeSelected",{
	Line 2310:             node.processCallbackHandlers("onSelected",{
	Line 2324:         this.processCallbackHandlers("onSelectionChange",{
	Line 2337:         node.processCallbackHandlers("onDeselected",{
	Line 2341:         this.processCallbackHandlers("onNodeDeselected",{
	Line 2367:             node.processCallbackHandlers("onDeselected",{
	Line 2371:             this.processCallbackHandlers("onNodeDeselected",{
	Line 2380:         this.processCallbackHandlers("onSelectionChange",{
	Line 2411:             this.processCallbackHandlers("onNodeDeselected",{
	Line 2683:         this.processCallbackHandlers("onRender",{
	Line 2868:                 this.processCallbackHandlers("onDrawLinkTooltip",{
	Line 2874:             this.processCallbackHandlers("onDrawForeground",{
	Line 2884:         this.processCallbackHandlers("onDrawOverlay",{
	Line 3168:         let r = this.processCallbackHandlers("onRenderBackground",{
	Line 3251:             this.processCallbackHandlers("onDrawBackground",{
	Line 3311:                 node.processCallbackHandlers("onDrawForeground",{
	Line 3332:             let r = node.processCallbackHandlers("onDrawCollapsed",{
	Line 3396:         node.processCallbackHandlers("onDrawForeground",{
	Line 3806:         let r = this.processCallbackHandlers("onDrawLinkTooltip",{
	Line 3917:         node.processCallbackHandlers("onDrawBackground",{
	Line 3924:             r = node.processCallbackHandlers("onDrawTitleBar",{
	Line 3979:             r = node.processCallbackHandlers("onDrawTitleBox",{
	Line 4037:             node.processCallbackHandlers("onDrawTitleText",{
	Line 4099:             node.processCallbackHandlers("onDrawTitle",{
	Line 4106:             node.processCallbackHandlers("onBounding",{
	Line 5074:                 node.processCallbackHandlers("onWidgetChanged",{
	Line 5495:         r = node.processCallbackHandlers("onGetInputs",{
	Line 5530:         r = node.processCallbackHandlers("onMenuNodeInputs",{
	Line 5577:                 node.processCallbackHandlers("onNodeInputAdd",{
	Line 5598:         r = node.processCallbackHandlers("onGetOutputs",{
	Line 5640:         r = node.processCallbackHandlers("onMenuNodeOutputs",{
	Line 5720:                 node.processCallbackHandlers("onNodeOutputAdd",{
	Line 5801:             node.processCallbackHandlers("onResize",{
	Line 6594:                 let r = that.processCallbackHandlers("onSearchBoxSelection",{
	Line 7070:             node.processCallbackHandlers("onPropertyChanged",{
	Line 8038:         let r = this.processCallbackHandlers("getMenuOptions",{
	Line 8072:         r = this.processCallbackHandlers("getExtraMenuOptions",{
	Line 8088:         let r = node.processCallbackHandlers("getMenuOptions",{
	Line 8152:         r = node.processCallbackHandlers("onGetInputs",{
	Line 8163:         r = node.processCallbackHandlers("onGetOutputs",{
	Line 8177:         r = node.processCallbackHandlers("getExtraMenuOptions",{
	Line 8217:             node.graph.processCallbackHandlers("onGetNodeMenuOptions",{
	Line 8271:             let r = node.processCallbackHandlers("getSlotMenuOptions",{
	
	
lgraphnode.js (45 hits)
	Line  122:         return this.cb_handler.processCallbackHandlers(...arguments);
	Line  152:                     this.processCallbackHandlers("onPropertyChanged",{
	Line  180:             this.processCallbackHandlers("onConnectionsChange",{
	Line  183:             this.processCallbackHandlers("onInputAdded",{
	Line  194:                 this.processCallbackHandlers("onConnectionsChange",{
	Line  198:             this.processCallbackHandlers("onOutputAdded",{
	Line  219:         this.processCallbackHandlers("onConfigure",{
	Line  287:         let r = this.processCallbackHandlers("onSerialize",{
	Line  365:         let r = this.processCallbackHandlers("onPropertyChanged",{
	Line  823:             this.processCallbackHandlers("onExecute",{
	Line  838:         this.processCallbackHandlers("onAfterExecuteNode",{
	Line  883:             this.processCallbackHandlers("onAction",{
	Line  898:         this.processCallbackHandlers("onAfterActionedNode",{
	Line 1050:         this.processCallbackHandlers("onResize",{
	Line 1098:             this.processCallbackHandlers("onInputAdded",{
	Line 1105:             this.processCallbackHandlers("onOutputAdded",{
	Line 1152:                 this.processCallbackHandlers("onInputAdded",{
	Line 1159:                 this.processCallbackHandlers("onOutputAdded",{
	Line 1189:         this.processCallbackHandlers("onInputRemoved",{
	Line 1217:         this.processCallbackHandlers("onOutputRemoved",{
	Line 1363:             let r = this.processCallbackHandlers("onGetPropertyInfo",{
	Line 1483:         this.processCallbackHandlers("onBounding",{
	Line 1935:         r = target_node.processCallbackHandlers("onBeforeConnectInput",{
	Line 1944:         r = this.processCallbackHandlers("onConnectOutput",{
	Line 1964:         r = target_node.processCallbackHandlers("onConnectInput",{
	Line 2026:         this.processCallbackHandlers("onConnectionsChange",{
	Line 2030:         target_node.processCallbackHandlers("onConnectionsChange",{
	Line 2036:             this.graph.processCallbackHandlers("onNodeConnectionChange",{
	Line 2040:             this.graph.processCallbackHandlers("onNodeConnectionChange",{
	Line 2109:                     target_node.processCallbackHandlers("onConnectionsChange",{
	Line 2113:                     this.processCallbackHandlers("onConnectionsChange",{
	Line 2119:                         this.graph.processCallbackHandlers("onNodeConnectionChange",{
	Line 2123:                         this.graph.processCallbackHandlers("onNodeConnectionChange",{
	Line 2148:                     target_node.processCallbackHandlers("onConnectionsChange",{
	Line 2152:                     this.graph.processCallbackHandlers("onNodeConnectionChange",{
	Line 2160:                 this.processCallbackHandlers("onConnectionsChange",{
	Line 2164:                 this.graph.processCallbackHandlers("onNodeConnectionChange",{
	Line 2232:                 this.processCallbackHandlers("onConnectionsChange",{
	Line 2236:                 target_node.processCallbackHandlers("onConnectionsChange",{
	Line 2241:                     this.graph.processCallbackHandlers("onNodeConnectionChange",{
	Line 2244:                     this.graph.processCallbackHandlers("onNodeConnectionChange",{
	Line 2369:         this.graph.processCallbackHandlers("onNodeTrace",{