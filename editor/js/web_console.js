import { LiteGraph } from "../../src/litegraph";

var editorUseHtmlConsole = true; // enable html console to debug on mobile
		
window.addEventListener("load", (event) => {
    
    // TopBarSelector
    if(editorUseHtmlConsole){
        var domLGEditorTopBarSelector = document.getElementById("LGEditorTopBarSelector");
        // inject button
        if(domLGEditorTopBarSelector){
            domLGEditorTopBarSelector.innerHTML = 	"<button class='btn' id='btn_console'>Console</button> "
                                                    +domLGEditorTopBarSelector.innerHTML;
        }else{
            console.warn("LGEditor:","element not found LGEditorTopBarSelector");
        }
    }
    
    // html console
    if(editorUseHtmlConsole && domLGEditorTopBarSelector){
        domLGEditorTopBarSelector.querySelector("#btn_console").addEventListener("click", function(){
            var consoleCnt = document.getElementById('console-container');
            if (consoleCnt.classList.contains("invisible")){
                consoleCnt.classList.remove("invisible");
            }else{
                jsConsole.clean();
                consoleCnt.classList.add("invisible");
            }	
        });
        
    
        const console_params = {
            expandDepth : 1,
            common : {
                excludeProperties : ['__proto__'],
                removeProperties: ['__proto__'],
                maxFieldsInHead : 5,
                minFieldsToAutoexpand : 5,
                maxFieldsToAutoexpand : 15
            }
        };
        var jsConsole = new Console(document.querySelector('.console-container'), console_params);
        jsConsole.log("Here is console.log!");
        
        // map console log-debug to jsConsole
        console.log = function(par){
            jsConsole.log(par);
            var objDiv = document.getElementById("console-container");
            objDiv.scrollTop = objDiv.scrollHeight;
        }
        console.debug = console.log;
        
        console.log("going into html console");
        
        document.getElementById("btn_console_clear").addEventListener("click", function(){
            var consoleCnt = document.getElementById('console-container');
            jsConsole.clean();
        });
        document.getElementById("btn_console_close").addEventListener("click", function(){
            var consoleCnt = document.getElementById('console-container');
            consoleCnt.classList.add("invisible");
        });
    }
});