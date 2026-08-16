import json
import requests
from bs4 import BeautifulSoup
import time
import unicodedata
import re

SILHOUETTE_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/200px-User_icon_2.svg.png"
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}

def format_name_for_statsf1(name):
    # Remove accents
    name = ''.join(c for c in unicodedata.normalize('NFD', name)
                  if unicodedata.category(c) != 'Mn')
    # Replace spaces and punctuation with hyphens, lowercase
    name = re.sub(r'[^a-zA-Z0-9]+', '-', name).strip('-').lower()
    return name

def fetch_statsf1_image(name):
    formatted = format_name_for_statsf1(name)
    url = f"https://www.statsf1.com/en/{formatted}.aspx"
    
    try:
        res = requests.get(url, headers=HEADERS)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, 'html.parser')
            for img in soup.find_all('img'):
                src = img.get('src')
                if src and src.startswith('/pilotes/photos/'):
                    return f"https://www.statsf1.com{src}"
    except Exception as e:
        print(f"Error for {name}: {e}")
        
    return None

def main():
    images_path = r'C:\Users\Matias\Documents\F1-Telemetry-Games\shared\driver_images.json'
    
    with open(images_path, 'r', encoding='utf-8') as f:
        images = json.load(f)
        
    # We want to replace all Bing images and the 3 missing ones.
    # Wikipedia and Wikidata images always contain "wikimedia.org" except the silhouette.
    drivers_to_check = [
        name for name, url in images.items() 
        if "wikimedia.org" not in url or url == SILHOUETTE_URL
    ]
    
    print(f"Checking StatsF1 for {len(drivers_to_check)} drivers...")
    
    found_count = 0
    for name in drivers_to_check:
        url = fetch_statsf1_image(name)
        if url:
            print(f"Found on StatsF1: {name} -> {url}")
            images[name] = url
            found_count += 1
        else:
            # If we didn't find it on StatsF1, we revert to silhouette instead of keeping a bad Bing image
            images[name] = SILHOUETTE_URL
            print(f"Not found on StatsF1: {name}, reverting to silhouette")
            
        time.sleep(0.5)
                
    with open(images_path, 'w', encoding='utf-8') as f:
        json.dump(images, f, indent=2, ensure_ascii=False)
        
    print(f"Finished. Found {found_count} images from StatsF1.")

if __name__ == "__main__":
    main()
