import json
import requests
import time
import urllib.parse

SILHOUETTE_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/200px-User_icon_2.svg.png"
HEADERS = {'User-Agent': 'F1GamesFixer/2.0 (matias@example.com)'}

def fetch_wiki_disambiguated(name):
    # 1. Try exact disambiguation on Wikipedia
    try:
        title = urllib.parse.quote(f"{name} (racing driver)")
        url = f"https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&titles={title}&format=json&pithumbsize=600"
        res = requests.get(url, headers=HEADERS).json()
        pages = res.get('query', {}).get('pages', {})
        for page_id, page in pages.items():
            if page_id != '-1' and 'thumbnail' in page:
                return page['thumbnail']['source']
    except Exception:
        pass

    # 2. Try Wikidata with strict description checking
    try:
        search_url = f"https://www.wikidata.org/w/api.php?action=wbsearchentities&search={urllib.parse.quote(name)}&language=en&format=json"
        res = requests.get(search_url, headers=HEADERS).json()
        search_results = res.get('search', [])
        
        q_id = None
        for item in search_results:
            desc = item.get('description', '').lower()
            if any(keyword in desc for keyword in ['driver', 'racer', 'formula', 'motorsport', 'pilot']):
                q_id = item['id']
                break
                
        if q_id:
            claims_url = f"https://www.wikidata.org/w/api.php?action=wbgetclaims&entity={q_id}&property=P18&format=json"
            res = requests.get(claims_url, headers=HEADERS).json()
            claims = res.get('claims', {})
            if 'P18' in claims:
                file_name = claims['P18'][0]['mainsnak']['datavalue']['value']
                return f"https://commons.wikimedia.org/wiki/Special:FilePath/{urllib.parse.quote(file_name)}?width=600"
    except Exception:
        pass
        
    return SILHOUETTE_URL

def main():
    images_path = r'C:\Users\Matias\Documents\F1-Telemetry-Games\shared\driver_images.json'
    
    with open(images_path, 'r', encoding='utf-8') as f:
        images = json.load(f)
        
    # We target any driver who currently has a wikimedia image that is NOT the silhouette
    drivers_to_check = [
        name for name, url in images.items() 
        if "wikimedia.org" in url and url != SILHOUETTE_URL
    ]
    
    print(f"Strictly verifying {len(drivers_to_check)} drivers with Wikipedia/Wikidata...")
    
    replaced_count = 0
    reverted_count = 0
    kept_count = 0
    
    for i, name in enumerate(drivers_to_check):
        old_url = images[name]
        new_url = fetch_wiki_disambiguated(name)
        
        if new_url == SILHOUETTE_URL:
            # We rejected the current image because it failed strict checks
            images[name] = SILHOUETTE_URL
            reverted_count += 1
            print(f"[{name}] REJECTED -> Silhouette")
        elif new_url != old_url:
            # We found a better disambiguated image
            images[name] = new_url
            replaced_count += 1
            print(f"[{name}] FIXED -> {new_url}")
        else:
            kept_count += 1
            
        time.sleep(0.2)
        
    with open(images_path, 'w', encoding='utf-8') as f:
        json.dump(images, f, indent=2, ensure_ascii=False)
        
    print(f"Finished. Fixed {replaced_count} wrong images. Reverted {reverted_count} to silhouette. Verified {kept_count} as correct.")

if __name__ == "__main__":
    main()
