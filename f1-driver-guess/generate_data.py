import pandas as pd
import json

# Known champions to accurately assign WCs
champions = {
    "Michael Schumacher": 7,
    "Lewis Hamilton": 7,
    "Juan Manuel Fangio": 5,
    "Alain Prost": 4,
    "Sebastian Vettel": 4,
    "Jack Brabham": 3,
    "Jackie Stewart": 3,
    "Niki Lauda": 3,
    "Nelson Piquet": 3,
    "Ayrton Senna": 3,
    "Max Verstappen": 3,
    "Alberto Ascari": 2,
    "Jim Clark": 2,
    "Graham Hill": 2,
    "Emerson Fittipaldi": 2,
    "Mika Häkkinen": 2,
    "Fernando Alonso": 2,
    "Nino Farina": 1,
    "Mike Hawthorn": 1,
    "Phil Hill": 1,
    "John Surtees": 1,
    "Denny Hulme": 1,
    "Jochen Rindt": 1,
    "James Hunt": 1,
    "Mario Andretti": 1,
    "Jody Scheckter": 1,
    "Alan Jones": 1,
    "Keke Rosberg": 1,
    "Nigel Mansell": 1,
    "Damon Hill": 1,
    "Jacques Villeneuve": 1,
    "Kimi Räikkönen": 1,
    "Jenson Button": 1,
    "Nico Rosberg": 1
}

def clean_driver_name(name):
    if not isinstance(name, str):
        return "Unknown"
    return name

df = pd.read_parquet(r"C:\Users\Matias\Documents\F1\data\processed\results_1950_2025.parquet")
df['driver'] = df['driver'].apply(clean_driver_name)

# Group by driver to calculate stats
stats = []
for driver, group in df.groupby('driver'):
    first_year = int(group['season'].min())
    last_year = int(group['season'].max())
    wins = int(group['position'].apply(lambda x: x == 1.0 or x == '1').sum())
    
    # Calculate podiums robustly
    def is_podium(pos):
        try:
            return float(pos) <= 3
        except:
            return False
            
    podiums = int(group['position'].apply(is_podium).sum())
    
    points = float(group['points'].sum())
    # F1 Points can be half points, we'll format them nicely or just keep them
    if points.is_integer():
        points = int(points)
        
    poles = int(group['grid'].apply(lambda x: x == 1.0 or x == '1').sum())
    
    # Exclude DNS/DNQ for actual GP starts if desired, but count(event) is usually fine.
    gps = len(group['event'].unique()) if 'event' in group else len(group)
    
    # Ensure no duplicates if driver had multiple entries in a weekend, count distinct (season, round)
    gps = len(group[['season', 'round']].drop_duplicates())
    
    wcs = champions.get(driver, 0)
    
    # Since we can't easily fetch images for everyone, we'll leave it empty or fallback in UI
    image = ""
    
    stats.append({
        "name": driver,
        "firstYear": first_year,
        "lastYear": last_year,
        "wcs": wcs,
        "wins": wins,
        "podiums": podiums,
        "points": points,
        "poles": poles,
        "gps": gps,
        "image": image
    })

# Write to data.js
output_path = r"C:\Users\Matias\.gemini\antigravity\scratch\f1-driver-guess\data.js"
with open(output_path, "w", encoding="utf-8") as f:
    f.write("const drivers = ")
    json.dump(stats, f, indent=2, ensure_ascii=False)
    f.write(";\n")

print(f"Exported {len(stats)} drivers to {output_path}")
