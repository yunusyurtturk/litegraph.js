import os
import subprocess
import json
import sys
import re

# BUILD v 0.2
# will export .js bundled
# will export .cjs versions stripped of import and export, a cjs bundle working on node.js too

# need npm install -g js-beautify
# need npm install -g uglify-js


# Default options, can be overridden by command-line arguments
options = {
    "minify": True,
    "prettify": True,
    "update-version": False,
}

# Parse command-line arguments
for arg in sys.argv:
    if arg == "--no-minify":
        options["minify"] = False
    if arg == "--no-prettify":
        options["prettify"] = False
    if arg == "--update-version":
        options["update-version"] = True

# Define the list of redundant JS files
lib_js_files = [
    "./src/global.js",
    "./src/litegraph.js",
    "./src/callbackhandler.js",
    "./src/contextmenu.js",
    "./src/curveeditor.js",
    "./src/dragandscale.js",
    "./src/lgraph.js",
    "./src/lgraphcanvas.js",
    "./src/lgraphgroup.js",
    "./src/lgraphnode.js",
    "./src/llink.js",
    "./src/subgraph.js",
    "./src/init_litegraph.js",
]

# Define the list of static inclusion files
static_inclusions = [
    # Add other static inclusion files here if any
]

# Define the lists of JS files to concatenate
js_files_lists = [
    {
        "output_filename": "litegraph.js",
        "js_files": lib_js_files + [
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
        "output_filename": "litegraph.mini.js",
        "js_files": lib_js_files + [
            "./src/nodes/base.js",
            # "./src/nodes/events.js",
            "./src/nodes/input.js",
            "./src/nodes/math.js",
            "./src/nodes/strings.js",
            "./src/nodes/logic.js",
            # "./src/nodes/network.js",
        ]
    },
    {
        "output_filename": "litegraph.core.js",
        "js_files": lib_js_files
    }
]

# Specify the build folders
build_folder = "build"
build_node_folder = "build_node"

def concatenate_js_files(js_files, output_filename, output_folder, remove_imports=False):
    concatenated_data = "" #"// readable version\n"
    for js_file in js_files:
        print(f"Processing {js_file} ", end="")
        try:
            with open(js_file, "r") as f:
                file_data = f.read()
                if remove_imports:
                    file_data = re.sub(r'import\s+.*?;\n', '', file_data)
                concatenated_data += file_data + "\n"
                print("\033[92mOK\033[0m")
        except FileNotFoundError:
            print("\033[91mJS File not found\033[0m")

    output_path = os.path.join(output_folder, output_filename)
    with open(output_path, "w") as output_file:
        output_file.write(concatenated_data)
    print(f"Concatenated JS files saved to: {output_filename}")

    if options["prettify"] and ".mini." not in output_filename:
        subprocess.run(["js-beautify", output_path, "-r"], shell=True)

def pack_js_files(input_filepath, output_filename, output_folder, minify=True):
    if minify:
        print(f"Processing {input_filepath} ", end="")
        if os.path.exists(input_filepath):
            minified_js = subprocess.run(["uglifyjs", input_filepath, "-c"], stdout=subprocess.PIPE, text=True, shell=True)
            packed_data = "/*packed*/\n" + minified_js.stdout + "\n"
            print("\033[92mMinified\033[0m")
        else:
            print("\033[91mJS File not found\033[0m")
            return
    else:
        with open(input_filepath, "r") as input_file:
            packed_data = input_file.read()

    with open(os.path.join(output_folder, output_filename), "w") as output_file:
        output_file.write(packed_data)
    print(f"Concatenated and minified JS files saved to: {output_filename}")

def update_version(version, command=""):
    version_parts = version.split('.')
    if "--minor" in command:
        version_parts[1] = str(int(version_parts[1]) + 1)
    elif "--major" in command:
        version_parts[0] = str(int(version_parts[0]) + 1)
        version_parts[1] = '0'
        version_parts[2] = '0'
    else:
        version_parts[2] = str(int(version_parts[2]) + 1)
    return '.'.join(version_parts)

def update_version_in_files(version, files):
    for file_path in files:
        try:
            with open(file_path, 'r') as file:
                data = file.read()
                data = re.sub(r'("version": )"\d+.\d+.\d+"', r'\1"{}"'.format(version), data)
                data = re.sub(r'(this.VERSION = )"\d+.\d+.\d+";', r'\1"{}";'.format(version), data)
            with open(file_path, 'w') as file:
                file.write(data)
            print(f"Version updated in file: {file_path}")
        except FileNotFoundError:
            print(f"File not found: {file_path}")

def get_version_from_package_json():
    try:
        with open('package.json', 'r') as file:
            data = json.load(file)
            return data.get('version')
    except (FileNotFoundError, json.JSONDecodeError):
        sys.exit()

def get_new_version():
    version_number = get_version_from_package_json()
    for arg in sys.argv:
        if "--minor" in arg:
            version_number = update_version(version_number, "--minor")
        elif "--major" in arg:
            version_number = update_version(version_number, "--major")
    return version_number

def convert_es6_to_commonjs(data):
    class_names = []
    var_names = []
    const_names = []
    function_names = []

    # Convert export default class
    def export_default_class_replacer(match):
        class_name = match.group(1)
        class_names.append(class_name)
        return f'class {class_name}'

    # Convert export class
    def export_class_replacer(match):
        class_name = match.group(1)
        class_names.append(class_name)
        return f'class {class_name}'
    
    # Convert export var
    def export_var_replacer(match):
        var_name = match.group(1)
        var_names.append(var_name)
        return f'var {var_name}'
    
    # Convert export const
    def export_const_replacer(match):
        const_name = match.group(1)
        const_names.append(const_name)
        return f'const {const_name}'

    # Convert export function
    def export_function_replacer(match):
        function_name = match.group(1)
        function_names.append(function_name)
        return f'function {function_name}'

    # Convert export default function or variable
    def export_default_replacer(match):
        return match.group(1)

    # Strip export keywords and collect class/function names
    data = re.sub(r'export\s+default\s+class\s+([a-zA-Z0-9_]+)', export_default_class_replacer, data)
    data = re.sub(r'export\s+class\s+([a-zA-Z0-9_]+)', export_class_replacer, data)
    data = re.sub(r'export\s+var\s+([a-zA-Z0-9_]+)', export_var_replacer, data)
    data = re.sub(r'export\s+const\s+([a-zA-Z0-9_]+)', export_const_replacer, data)
    data = re.sub(r'export\s+default\s+([a-zA-Z0-9_]+)', export_default_replacer, data)
    data = re.sub(r'export\s+function\s+([a-zA-Z0-9_]+)', export_function_replacer, data)
    data = re.sub(r'export\s+\{([a-zA-Z0-9_,\s]+)\};', r'\1;', data)
    data = re.sub(r'import\s+([a-zA-Z0-9_,{}\s*]+)\s+from\s+["\']([a-zA-Z0-9_./-]+)["\'];', lambda match: "var " + match.group(1).strip() + " = require('" + match.group(2).strip() + "');", data)
    # data = re.sub(r'\bconst\b', 'var', data)

    # Add exports at the end of the file
    if class_names or function_names:
        exports = '\n'.join([f'exports.{name} = {name};' for name in class_names + function_names])
        data += '\n' + exports

    return data

def reprocess_files_for_node(input_filepath, output_filepath):
    print(f"Reprocessing {input_filepath} for Node.js", end=" ")
    try:
        with open(input_filepath, "r") as file:
            data = file.read()
        new_data = convert_es6_to_commonjs(data)
        with open(output_filepath, "w") as output_file:
            output_file.write(new_data)
        print("\033[92mDone\033[0m")
    except FileNotFoundError:
        print("\033[91mJS File not found\033[0m")

# Create build folders if they do not exist
if not os.path.exists(build_folder):
    os.makedirs(build_folder)

if not os.path.exists(build_node_folder):
    os.makedirs(build_node_folder)

# Concatenate and minify JS files from each list and save to the respective output filenames
for js_files_list in js_files_lists:
    # For build folder
    concatenate_js_files(js_files_list["js_files"], js_files_list["output_filename"], build_folder, remove_imports=True)
    minify = options["minify"] and ".mini." in js_files_list["output_filename"]
    pack_js_files(os.path.join(build_folder, js_files_list["output_filename"]), js_files_list["output_filename"], build_folder, minify=minify)

    # For build_node folder
    node_output_filename = js_files_list["output_filename"].replace(".js", ".cjs")
    concatenate_js_files(js_files_list["js_files"], node_output_filename, build_node_folder, remove_imports=True)
    reprocess_files_for_node(os.path.join(build_node_folder, node_output_filename), os.path.join(build_node_folder, node_output_filename))
    pack_js_files(os.path.join(build_node_folder, node_output_filename), node_output_filename, build_node_folder, minify=minify)

files_to_update = ["src/litegraph.js", "package.json"]

# Update the version number in the specified files
if options["update-version"]:
    update_version_in_files(get_new_version(), files_to_update)
