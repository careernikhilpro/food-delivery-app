const fs = require('fs');

let content = fs.readFileSync('src/app/cart/page.tsx', 'utf8');

// 1. Replace imports
content = content.replace(
  /import \{ GoogleMap, MarkerF, useLoadScript \} from '@react-google-maps\/api';\nimport Script from "next\/script";/g,
  `import { LocationPickerMap } from '@/components/maps/LocationPickerMap';\nimport { api } from "@/lib/api";`
);

// 2. Remove libraries and mapStyles
content = content.replace(/const libraries: \("places" \| "geometry"\)\[\] = \["places", "geometry"\];[\s\S]*?const MapTilesWrapper.*?\};/m, '');

// 3. Update the AutocompleteService logic to use backend /api/location/autosuggest
const autocompleteRegex = /if \(window\.google && window\.google\.maps && window\.google\.maps\.places\) \{[\s\S]*?\} else \{[\s\S]*?setIsSearchingMap\(false\);\n\s*\}/m;
const newAutocomplete = `
        api.get(\`/location/autosuggest?query=\${mapSearchQuery}\`).then(res => {
          setIsSearchingMap(false);
          if (res.data && res.data.data && res.data.data.length > 0) {
            setMapSearchResults(res.data.data);
          } else {
            setMapSearchResults([]);
            setMapSearchError("No results found");
          }
        }).catch(() => {
          setIsSearchingMap(false);
          setMapSearchResults([]);
          setMapSearchError("No results found");
        });`;
content = content.replace(autocompleteRegex, newAutocomplete);

// 4. Update the Geocoder logic to use backend /api/location/geocode
const geocoderRegex = /try \{[\s\S]*?const geocoder = new window\.google\.maps\.Geocoder\(\);[\s\S]*?\} catch \(e\) \{[\s\S]*?\setIsSearchingMap\(false\);\n\s*\}/m;
const newGeocoder = `
                            api.post(\`/location/geocode\`, { address: loc.description }).then(res => {
                              if (res.data && res.data.data) {
                                const location = res.data.data;
                                setMapLat(location.lat);
                                setMapLng(location.lng);
                                if (mapRef.current) {
                                  mapRef.current.panTo(location);
                                  mapRef.current.setZoom(17.5);
                                }
                              }
                              setIsSearchingMap(false);
                            }).catch(() => {
                              setIsSearchingMap(false);
                            });`;
content = content.replace(geocoderRegex, newGeocoder);

// 5. Replace MapTilesWrapper usage with LocationPickerMap
content = content.replace(
  /<MapTilesWrapper[\s\S]*?\/>/m,
  `<LocationPickerMap apiKey={mapToken} initialLocation={{lat: mapLat, lng: mapLng}} onLocationSelect={(lat, lng) => { setMapLat(lat); setMapLng(lng); }} />`
);

fs.writeFileSync('src/app/cart/page.tsx', content);
console.log('Cart page refactored');
