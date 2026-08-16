import json
import requests
from bs4 import BeautifulSoup
import time
import unicodedata
import re

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}

def format_name_for_statsf1(name):
    name = ''.join(c for c in unicodedata.normalize('NFD', name)
                  if unicodedata.category(c) != 'Mn')
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
        
    drivers_to_check = [
        name for name, url in images.items() 
        if "shared/local_images" not in url and "statsf1.com" not in url
    ]
    
    print(f"Checking StatsF1 for {len(drivers_to_check)} drivers...")
    
    found_count = 0
    skipped_count = 0
    for i, name in enumerate(drivers_to_check):
        url = fetch_statsf1_image(name)
        if url:
            print(f"Found on StatsF1: {name}")
            images[name] = url
            found_count += 1
        else:
            skipped_count += 1
            print(f"Not found on StatsF1: {name}, retaining existing image")
            
        time.sleep(0.5)
        
        # Save periodically in case of crash
        if i % 50 == 0:
            with open(images_path, 'w', encoding='utf-8') as f:
                json.dump(images, f, indent=2, ensure_ascii=False)
                
    with open(images_path, 'w', encoding='utf-8') as f:
        json.dump(images, f, indent=2, ensure_ascii=False)
        
    print(f"Finished. Replaced {found_count} images with StatsF1. Retained existing for {skipped_count}.")

if __name__ == "__main__":
    main()
