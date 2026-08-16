import json
import requests
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor

SILHOUETTE_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/200px-User_icon_2.svg.png"
HEADERS = {'User-Agent': 'F1HigherLowerGameBot/2.0 (matias@example.com)'}

def fetch_wikidata_image(name):
    try:
        # Search for entity
        search_url = f"https://www.wikidata.org/w/api.php?action=wbsearchentities&search={urllib.parse.quote(name)}&language=en&format=json"
        res = requests.get(search_url, headers=HEADERS).json()
        search_results = res.get('search', [])
        
        if not search_results:
            # Try with 'racing driver' to disambiguate sometimes? Usually Wikidata search is fine.
            return None
            
        q_id = None
        # Find the first result that is likely a person/driver
        for item in search_results:
            desc = item.get('description', '').lower()
            if 'driver' in desc or 'racer' in desc or 'formula one' in desc or 'motorsport' in desc:
                q_id = item['id']
                break
        
        # If no strict match, just use the first result
        if not q_id and len(search_results) > 0:
            q_id = search_results[0]['id']
            
        if not q_id:
            return None

        # Get claims
        claims_url = f"https://www.wikidata.org/w/api.php?action=wbgetclaims&entity={q_id}&property=P18&format=json"
        res = requests.get(claims_url, headers=HEADERS).json()
        
        claims = res.get('claims', {})
        if 'P18' in claims:
            # Extract image filename
            file_name = claims['P18'][0]['mainsnak']['datavalue']['value']
            img_url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{urllib.parse.quote(file_name)}?width=600"
            return img_url
            
    except Exception as e:
        print(f"Error for {name}: {e}")
        pass
    
    return None

def main():
    images_path = r'C:\Users\Matias\Documents\F1-Telemetry-Games\shared\driver_images.json'
    
    with open(images_path, 'r', encoding='utf-8') as f:
        images = json.load(f)
        
    # Find drivers with silhouette
    missing_drivers = [name for name, url in images.items() if url == SILHOUETTE_URL]
    print(f"Checking Wikidata for {len(missing_drivers)} drivers...")
    
    def process_driver(name):
        url = fetch_wikidata_image(name)
        time.sleep(0.1) # Be gentle with Wikidata
        return name, url
        
    found_count = 0
    with ThreadPoolExecutor(max_workers=5) as executor:
        for name, url in executor.map(process_driver, missing_drivers):
            if url:
                print(f"Found image for {name}: {url}")
                images[name] = url
                found_count += 1
                
    with open(images_path, 'w', encoding='utf-8') as f:
        json.dump(images, f, indent=2, ensure_ascii=False)
        
    print(f"Finished. Found {found_count} new images from Wikidata.")

if __name__ == "__main__":
    main()
