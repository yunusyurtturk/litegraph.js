/**
 * EXAMPLE EXTENSION TO AUTOCONNECT SELECTED NODES TO ANOTHER (SINGLE) NODE
 * press a than click on a node
 */


if(LiteGraph && graphcanvas){

    // enable only if debugging CallbackHandler itself
    // graphcanvas.cb_handler.debug = true;

    // oCbInfo is first passed parameter and contains infos about the event execution chain 

    let ext = "autoconnect";

    // onKeyDown
    graphcanvas.registerCallbackHandler("onKeyDown",function(oCbInfo, keyEvent){
        console.info(ext, "*** onKeyDown handler ***", ...arguments);
        switch(keyEvent.keyCode){
            case 65: // a

                // check selected nodes
                let nSel = Object.keys(graphcanvas.selected_nodes).length;
                var aNodesFrom = [];
                if(nSel){
                    for(let iO in graphcanvas.selected_nodes){
                        // graphcanvas.graph.autoConnectNodes(node_from, node_to);
                        aNodesFrom.push(graphcanvas.selected_nodes[iO]);
                    }
                }
                
                graphcanvas.registerCallbackHandler("onMouseDown",function(md_oCbInfo, e){
                    console.info(ext, "*** onMouseDown handler ***", ...arguments);

                    let node_to = graphcanvas.graph.getNodeOnPos( e.canvasX, e.canvasY, graphcanvas.visible_nodes, 5 );

                    if(node_to){
                        console.info(ext, "### dbg: clicked on DEST node, autoconnect", node_to, aNodesFrom);
                        for(let node_from of aNodesFrom){
                            console.info(ext, "### dbg: AUTOCONNECT", node_from, node_to);
                            graphcanvas.graph.autoConnectNodes(node_from, node_to);
                        }
                    }else{
                        console.info(ext, "### dbg: not clicked on a node", node_to);
                    }

                },{ call_once: true }); // register to call only once

            break;
            default:
                console.debug(ext, "### dbg: ignore", keyEvent.keyCode);
            break;
        }
    });

}