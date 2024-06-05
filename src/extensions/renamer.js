
if(LiteGraph && graphcanvas){

    // enable only if debugging CallbackHandler itself
    // graphcanvas.cb_handler.debug = true;

    // oCbInfo is first passed parameter and contains infos about the event execution chain 

    // onKeyDown
    graphcanvas.registerCallbackHandler("onKeyDown",function(oCbInfo, keyEvent){
        console.info("*** CUSTOM KEYDOWN handler ***",...arguments);
        switch(keyEvent.keyCode){
            case 113:
                let nSel = Object.keys(graphcanvas.selected_nodes).length;
                const mouseCoord = graphcanvas.getMouseCoordinates();
                // const gloCoord = mouseCoord;
                // const gloCoord = graphcanvas.ds.convertOffsetToCanvas(mouseCoord);
                const gloCoord = graphcanvas.ds.convertCanvasToOffset(mouseCoord);
                // const gloCoord = graphcanvas.convertCanvasToGlobal(mouseCoord);
                if(nSel){
                    // console.debug("dbg: will show prompt to rename");
                    let actT = nSel == 1 ? graphcanvas.selected_nodes[Object.keys(graphcanvas.selected_nodes)[0]].title : "titleForMany";
                    var fCB = function(tIn){
                        for(let iN in graphcanvas.selected_nodes){
                            graphcanvas.selected_nodes[iN].title = tIn;
                        }
                    }
                    // simulate position via event (little hack, should implement that on prompt itself)
                    // getBoundaryForSelection()
                    // getCoordinateCenter()
                    keyEvent.clientX = gloCoord[0];
                    keyEvent.clientY = gloCoord[1];
                    // open prompt
                    graphcanvas.prompt(
                        "Title",actT,fCB,keyEvent
                        // event,w.options ? w.options.multiline : false,
                    );
                }else{
                    
                    const groupOver = graphcanvas.graph.getGroupOnPos( mouseCoord[0], mouseCoord[1] );
                    console.warn("dbg: group to rename",mouseCoord,groupOver);
                    if(groupOver){
                        console.warn("dbg: group to rename",groupOver);
                    }else{
                        console.warn("dbg: nothing to rename");
                    }
                }
            break;
            default:
                // console.debug("dbg: ignore",keyEvent.keyCode);
            break;
        }
    });

}