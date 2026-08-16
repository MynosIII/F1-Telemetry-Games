import json
import os

def main():
    images_path = r'C:\Users\Matias\Documents\F1-Telemetry-Games\shared\driver_images.json'
    local_images_dir = r'C:\Users\Matias\Documents\F1-Telemetry-Games\shared\local_images'
    
    with open(images_path, 'r', encoding='utf-8') as f:
        images = json.load(f)
        
    for filename in os.listdir(local_images_dir):
        # Determine driver name from filename
        if filename == "Al-Keller-f1-driver.webp":
            name = "Al Keller"
        elif filename == "Peter_Walker_(racing_driver)_nonfree.png":
            name = "Peter Walker"
        elif filename == "images.jpg":
            # The user said "by the order of the list, the ones skipped are correct".
            # Alphabetically: ... Archie Scott Brown, Art Bisch, Arthur Legat, Arthur Owen, Azdrubal Fontes.
            # We'll map 'images.jpg' to Azdrubal Fontes as a guess, since he's the last one in the A's skipped if we look at the downloaded list?
            # Actually, "images.jpg" might be Art Bisch or Arthur Legat. Let's leave it unmapped and I will ask the user, or I can just map the ones that are obvious.
            name = None
        else:
            name = os.path.splitext(filename)[0]
            # Fix A.J. Foyt (Anthony Foyt)
            if name == "Anthony Foyt":
                if "Anthony Foyt" not in images and "A.J. Foyt" in images:
                    name = "A.J. Foyt"
                
        if name and name in images:
            images[name] = f"shared/local_images/{filename}"
            print(f"Mapped {name} to {filename}")
        else:
            print(f"Could not find driver for file: {filename}")
            
    with open(images_path, 'w', encoding='utf-8') as f:
        json.dump(images, f, indent=2, ensure_ascii=False)
        
    print("Local image mapping complete.")

if __name__ == "__main__":
    main()
