import os
import subprocess
import json

# Define the lists of JS files to concatenate
js_files_lists = [
    {
        "output_filename": "litegraph.js",
        "js_files": [
           "./src/litegraph.js",
           "./src/contextmenu.js",
           "./src/lgraphcanvas.js",
           "./src/dragandscale.js",
           
            "./src/nodes/base.js",
            "./src/nodes/events.js",
            "./src/nodes/interface.js",
            "./src/nodes/input.js",
            "./src/nodes/math.js",
            "./src/nodes/math3d.js",
            "./src/nodes/strings.js",
            "./src/nodes/logic.js",
            "./src/nodes/graphics.js",
            "./src/nodes/gltextures.js",
            "./src/nodes/glshaders.js",
            "./src/nodes/geometry.js",
            "./src/nodes/glfx.js",
            "./src/nodes/midi.js",
            "./src/nodes/audio.js",
            "./src/nodes/network.js",
        ]
    },
    {
        "output_filename": "litegraph-mini.js",
        "js_files": [    
            "./src/litegraph.js",
           "./src/contextmenu.js",
           "./src/lgraphcanvas.js",
           "./src/dragandscale.js",
            
            "./src/nodes/base.js",
            "./src/nodes/events.js",
            "./src/nodes/input.js",
            "./src/nodes/math.js",
            "./src/nodes/strings.js",
            "./src/nodes/logic.js",
            "./src/nodes/network.js",
        ]
    },
    {
        "output_filename": "litegraph-core.js",
        "js_files": [    
            "./src/litegraph.js",
           "./src/contextmenu.js",
           "./src/lgraphcanvas.js",
           "./src/dragandscale.js",
        ]
    }
]

# Specify the build folder
build_folder = "build"
# Function to concatenate JS files
def concatenate_js_files(js_files, output_filename):
    concatenated_data = "// readable version"
    for js_file in js_files:
        print("Processing " + js_file + " ", end="")
        try:
            with open(js_file, "r") as f:
                concatenated_data += f.read() + "\n"
                print("\033[92mOK\033[0m")
        except FileNotFoundError:
            print("\033[91mJS File not found\033[0m")

    # Write the concatenated data to the output file
    with open(os.path.join(build_folder, output_filename), "w") as output_file:
        output_file.write(concatenated_data)
        print("Concatenated JS files saved to: " + output_filename)

def pack_js_files(js_files, output_filename):
    concatenated_data = "/*packed*/"
    
    for js_file in js_files:
        print("Processing " + js_file + " ", end="")
        
        if os.path.exists(js_file):
            # Minify the JS file using uglifyjs
            minified_js = subprocess.run(["uglifyjs", js_file, "-c", "--warn"], stdout=subprocess.PIPE, text=True)
            concatenated_data += minified_js.stdout + "\n"
            print("\033[92mMinified\033[0m")
        else:
            print("\033[91mJS File not found\033[0m")

    # Write the concatenated data to the output file
    with open(os.path.join(build_folder, output_filename), "w") as output_file:
        output_file.write(concatenated_data)
        print("Concatenated and minified JS files saved to: " + output_filename)


# Create build folder if it does not exist
if not os.path.exists(build_folder):
    os.makedirs(build_folder)

# Concatenate JS files from each list and save to the respective output filenames
for js_files_list in js_files_lists:
    pack_js_files(js_files_list["js_files"], js_files_list["output_filename"])
