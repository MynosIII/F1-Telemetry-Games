import os
import json
import shutil

SOURCE_YAMLS = r"C:\Users\Matias\Documents\F1\data\cache\f1db\src\data\circuits"
SOURCE_SVGS = r"C:\Users\Matias\Documents\F1\data\cache\f1db\src\assets\circuits\white-outline"
TARGET_DIR = r"C:\Users\Matias\.gemini\antigravity\scratch\f1-circuit-guesser\public\circuits"
TARGET_JSON = r"C:\Users\Matias\.gemini\antigravity\scratch\f1-circuit-guesser\public\circuits.json"

all_circuits = []

if not os.path.exists(TARGET_DIR):
    os.makedirs(TARGET_DIR)

for filename in os.listdir(SOURCE_YAMLS):
    if not filename.endswith('.yml'): continue
    filepath = os.path.join(SOURCE_YAMLS, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    circuit = {"layouts": []}
    lines = content.split('\n')
    in_layouts = False
    
    for line in lines:
        if line.startswith('id: '):
            circuit['id'] = line.replace('id: ', '').strip()
        elif line.startswith('name: '):
            circuit['name'] = line.replace('name: ', '').strip()
        elif line.startswith('fullName: '):
            circuit['fullName'] = line.replace('fullName: ', '').strip()
        elif line.startswith('placeName: '):
            circuit['placeName'] = line.replace('placeName: ', '').strip()
        elif line.startswith('layouts:'):
            in_layouts = True
        elif in_layouts and line.startswith('  - id: '):
            layout_id = line.replace('  - id: ', '').split('#')[0].strip()
            circuit['layouts'].append(layout_id)
        elif in_layouts and not line.startswith('  ') and line.strip() != "":
            in_layouts = False
            
    if 'id' in circuit:
        # Check if SVGs exist for these layouts
        valid_layouts = []
        for lid in circuit['layouts']:
            svg_path = os.path.join(SOURCE_SVGS, f"{lid}.svg")
            if os.path.exists(svg_path):
                shutil.copy(svg_path, os.path.join(TARGET_DIR, f"{lid}.svg"))
                valid_layouts.append(lid)
        
        circuit['layouts'] = valid_layouts
        
        # We only want circuits that have at least one SVG
        if circuit['layouts']:
            all_circuits.append(circuit)

with open(TARGET_JSON, 'w', encoding='utf-8') as f:
    json.dump(all_circuits, f, indent=2)

print(f"Processed {len(all_circuits)} circuits with SVGs.")
