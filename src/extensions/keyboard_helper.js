
if(LiteGraph && graphcanvas){

    // enable only if debugging CallbackHandler itself
    // graphcanvas.cb_handler.debug = true;

    // oCbInfo is first passed parameter and contains infos about the event execution chain 

    let ext = "key_helper";

    // onKeyDown
    graphcanvas.registerCallbackHandler("onKeyDown",function(oCbInfo, keyEvent){
        console.info(ext, "*** onKeyDown handler ***",...arguments);
        switch(keyEvent.keyCode){
            case 39: //ArrowLeft
            // check selected nodes
                let nSel = Object.keys(graphcanvas.selected_nodes).length;
                var aNodesFrom = [];
                if(nSel){
                    for(let iO in graphcanvas.selected_nodes){
                        // graphcanvas.graph.autoConnectNodes(node_from, node_to);
                        aNodesFrom.push(graphcanvas.selected_nodes[iO]);
                    }

                    // simulate position via event (little hack, should implement that on prompt itself)
                    const mouseCoord = graphcanvas.getMouseCoordinates();
                    const gloCoord = graphcanvas.convertOffsetToEditorArea(mouseCoord);
                    // need prompt to be absolute positioned relative to editor-area that needs relative positioning
                    keyEvent.clientX = gloCoord[0];
                    keyEvent.clientY = gloCoord[1];

                    let nodeX = aNodesFrom[0];
                    if(nodeX.outputs && nodeX.outputs[0]){
                        if(keyEvent.shiftKey){
                            graphcanvas.showSearchBox(keyEvent,{node_from: nodeX, slot_from: nodeX.outputs[0], type_filter_in: nodeX.outputs[0].type});
                        }else if(keyEvent.ctrlKey){
                            graphcanvas.showConnectionMenu({nodeFrom: nodeX, slotFrom: nodeX.outputs[0], e: keyEvent});
                        }
                    }else{
                        console.debug("dbg: no output for node");
                    }
                }
            break;
            default:
                console.debug("dbg: ignore",keyEvent.keyCode);
            break;
        }
    });

}