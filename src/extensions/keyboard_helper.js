
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

                    let nodeX = aNodesFrom[0];

                    // simulate position via event (little hack, should implement that on prompt itself)
                    /* const mouseCoord = graphcanvas.getMouseCoordinates();
                    const gloCoord = graphcanvas.convertOffsetToEditorArea(mouseCoord);
                    // need prompt to be absolute positioned relative to editor-area that needs relative positioning
                    keyEvent.clientX = gloCoord[0];
                    keyEvent.clientY = gloCoord[1]; */
                    const gloCoord = graphcanvas.convertOffsetToEditorArea(nodeX.pos);
                    keyEvent.clientX = gloCoord[0] + nodeX.size[0] + 21;
                    keyEvent.clientY = gloCoord[1];

                    if(nodeX.outputs && nodeX.outputs[0]){
                        if(keyEvent.shiftKey){
                            console.debug(ext, "dbg: show search (using first slot)", nodeX, keyEvent);
                            graphcanvas.showSearchBox(keyEvent, {node_from: nodeX, slot_from: nodeX.outputs[0], type_filter_in: nodeX.outputs[0].type});
                        }else if(keyEvent.ctrlKey){
                            console.debug(ext, "dbg: show connection menu (using first slot)", nodeX, keyEvent);
                            graphcanvas.showConnectionMenu({nodeFrom: nodeX, slotFrom: nodeX.outputs[0], e: keyEvent, isCustomEvent: true});
                        }
                    }else{
                        console.debug(ext, "dbg: no output for node");
                    }
                }
            break;
            default:
                console.debug(ext, "dbg: ignore",keyEvent.keyCode);
            break;
        }
    });

}