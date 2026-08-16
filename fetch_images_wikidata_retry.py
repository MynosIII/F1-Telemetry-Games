import json
import requests
import time
import urllib.parse

SILHOUETTE_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/200px-User_icon_2.svg.png"
HEADERS = {'User-Agent': 'F1HigherLowerGameBot/3.0 (matias@example.com)'}

def fetch_wikidata_image(name):
    try:
        search_url = f"https://www.wikidata.org/w/api.php?action=wbsearchentities&search={urllib.parse.quote(name)}&language=en&format=json"
        res = requests.get(search_url, headers=HEADERS)
        if res.status_code == 429:
            time.sleep(5)
            res = requests.get(search_url, headers=HEADERS)
        res_json = res.json()
        search_results = res_json.get('search', [])
        
        if not search_results: return None
            
        q_id = None
        for item in search_results:
            desc = item.get('description', '').lower()
            if 'driver' in desc or 'racer' in desc or 'formula' in desc or 'motorsport' in desc:
                q_id = item['id']
                break
        
        if not q_id: q_id = search_results[0]['id']

        claims_url = f"https://www.wikidata.org/w/api.php?action=wbgetclaims&entity={q_id}&property=P18&format=json"
        res = requests.get(claims_url, headers=HEADERS)
        if res.status_code == 429:
            time.sleep(5)
            res = requests.get(claims_url, headers=HEADERS)
            
        claims = res.json().get('claims', {})
        if 'P18' in claims:
            file_name = claims['P18'][0]['mainsnak']['datavalue']['value']
            img_url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{urllib.parse.quote(file_name)}?width=600"
            return img_url
            
    except Exception as e:
        print(f"Error for {name}: {e}")
    
    return None

def main():
    images_path = r'C:\Users\Matias\Documents\F1-Telemetry-Games\shared\driver_images.json'
    
    with open(images_path, 'r', encoding='utf-8') as f:
        images = json.load(f)
        
    missing_drivers = [name for name, url in images.items() if url == SILHOUETTE_URL]
    print(f"Checking Wikidata sequentially for {len(missing_drivers)} drivers to avoid 429 errors...")
    
    found_count = 0
    for name in missing_drivers:
        url = fetch_wikidata_image(name)
        if url:
            print(f"Found: {name}")
            images[name] = url
            found_count += 1
        time.sleep(0.5)
                
    with open(images_path, 'w', encoding='utf-8') as f:
        json.dump(images, f, indent=2, ensure_ascii=False)
        
    print(f"Finished. Found {found_count} more images.")

if __name__ == "__main__":
    main()
