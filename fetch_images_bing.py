import json
import requests
import time
import urllib.parse
import re

SILHOUETTE_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/200px-User_icon_2.svg.png"
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}

def get_bing_image(query):
    try:
        url = f"https://www.bing.com/images/search?q={urllib.parse.quote(query)}"
        res = requests.get(url, headers=HEADERS)
        if res.status_code == 200:
            match = re.search(r'murl&quot;:&quot;(http[^&]+?)&quot;', res.text)
            if match:
                return match.group(1)
    except Exception as e:
        print(f"Error for {query}: {e}")
    return None

def main():
    images_path = r'C:\Users\Matias\Documents\F1-Telemetry-Games\shared\driver_images.json'
    
    with open(images_path, 'r', encoding='utf-8') as f:
        images = json.load(f)
        
    missing_drivers = [name for name, url in images.items() if url == SILHOUETTE_URL]
    print(f"Checking Bing Images sequentially for {len(missing_drivers)} drivers...")
    
    found_count = 0
    for name in missing_drivers:
        # Search query tuned for faces
        query = f"{name} F1 driver face"
        url = get_bing_image(query)
        if url:
            print(f"Found: {name}")
            images[name] = url
            found_count += 1
        time.sleep(1) # Be gentle with Bing to avoid IP bans
                
    with open(images_path, 'w', encoding='utf-8') as f:
        json.dump(images, f, indent=2, ensure_ascii=False)
        
    print(f"Finished. Found {found_count} more images from Bing.")

if __name__ == "__main__":
    main()
