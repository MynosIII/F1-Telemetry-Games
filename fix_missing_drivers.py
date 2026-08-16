import json
import requests
import time
import urllib.parse

HEADERS = {'User-Agent': 'F1GamesFixer/3.0 (matias@example.com)'}

def fetch_wiki_search(name):
    try:
        # Search for the driver
        search_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(name + ' racing')}&format=json"
        res = requests.get(search_url, headers=HEADERS).json()
        search_results = res.get('query', {}).get('search', [])
        
        if not search_results:
            search_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(name)}&format=json"
            res = requests.get(search_url, headers=HEADERS).json()
            search_results = res.get('query', {}).get('search', [])

        if not search_results:
            return None
            
        # Get the first result's title
        title = search_results[0]['title']
        
        # Fetch the image for that title
        image_url = f"https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&titles={urllib.parse.quote(title)}&format=json&pithumbsize=600"
        res = requests.get(image_url, headers=HEADERS).json()
        pages = res.get('query', {}).get('pages', {})
        
        for page_id, page in pages.items():
            if page_id != '-1' and 'thumbnail' in page:
                return page['thumbnail']['source']
    except Exception as e:
        print(f"Error for {name}: {e}")
        
    return None

def main():
    images_path = r'C:\Users\Matias\Documents\F1-Telemetry-Games\shared\driver_images.json'
    
    with open(images_path, 'r', encoding='utf-8') as f:
        images = json.load(f)
        
    drivers_to_check = [
        name for name, url in images.items() 
        if "silhouette.svg" in url
    ]
    
    print(f"Searching Wikipedia for {len(drivers_to_check)} missing drivers...")
    
    found_count = 0
    
    for name in drivers_to_check:
        new_url = fetch_wiki_search(name)
        
        if new_url:
            images[name] = new_url
            found_count += 1
            print(f"[{name}] RESTORED -> {new_url}")
        else:
            print(f"[{name}] No Wikipedia image found.")
            
        time.sleep(0.5)
        
    with open(images_path, 'w', encoding='utf-8') as f:
        json.dump(images, f, indent=2, ensure_ascii=False)
        
    print(f"Finished. Restored {found_count} images.")

if __name__ == "__main__":
    main()
