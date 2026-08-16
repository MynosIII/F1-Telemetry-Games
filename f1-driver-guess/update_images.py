import json
import requests
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor

headers = {'User-Agent': 'F1HigherLowerGameBot/1.0 (matias@example.com)'}

def get_image(name):
    try:
        search_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(name)}&utf8=&format=json"
        res = requests.get(search_url, headers=headers).json()
        if not res.get('query', {}).get('search'):
            search_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(name + ' racing driver')}&utf8=&format=json"
            res = requests.get(search_url, headers=headers).json()
            
        results = res.get('query', {}).get('search', [])
        if results:
            title = results[0]['title']
            img_url = f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=pageimages&format=json&pithumbsize=600"
            res = requests.get(img_url, headers=headers).json()
            pages = res.get('query', {}).get('pages', {})
            for page_id, page_data in pages.items():
                if 'thumbnail' in page_data:
                    return page_data['thumbnail']['source']
    except Exception as e:
        pass
    return ""

def main():
    file_path = r'C:\Users\Matias\.gemini\antigravity\scratch\f1-driver-guess\data.js'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    json_str = content.replace('const drivers = ', '').rstrip().rstrip(';')
    drivers = json.loads(json_str)
    
    print(f"Loaded {len(drivers)} drivers.")
    
    def fetch_for_driver(d):
        if not d.get('image'):
            d['image'] = get_image(d['name'])
            # rate limit slightly even with threads
            time.sleep(0.05)
        return d
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        drivers = list(executor.map(fetch_for_driver, drivers))
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write("const drivers = ")
        json.dump(drivers, f, indent=2, ensure_ascii=False)
        f.write(";\n")
        
    print("Finished updating images.")

if __name__ == '__main__':
    main()
