const fs = require('fs');

let content = fs.readFileSync('src/app/profile/page.tsx', 'utf8');

// 1. Replace imports
content = content.replace(
  /import \{ GoogleMap, useJsApiLoader \} from "@react-google-maps\/api";/,
  `import { LocationPickerMap } from '@/components/maps/LocationPickerMap';`
);

// 2. Remove libraries and mapStyles
content = content.replace(/const mapStyles = \[[\s\S]*?\];/m, '');
content = content.replace(/const \{ isLoaded \} = useJsApiLoader\(\{[\s\S]*?\}\);/m, '');
content = content.replace(/const libraries: \("places" \| "geometry"\)\[\] = \["places", "geometry"\];/m, '');

// 3. Remove MapTilesWrapper
content = content.replace(/const MapTilesWrapper = \(\{ centerLat, centerLng \}: any\) => \{[\s\S]*?<\/GoogleMap>\n  \);\n\}/m, '');

// 4. Replace MapTilesWrapper usage
content = content.replace(
  /<MapTilesWrapper centerLat=\{lat\} centerLng=\{lng\} \/>/m,
  `<LocationPickerMap apiKey={mapboxToken} initialLocation={{lat: lat, lng: lng}} onLocationSelect={(newLat, newLng) => { setLat(newLat); setLng(newLng); }} />`
);

fs.writeFileSync('src/app/profile/page.tsx', content);
console.log('Profile page refactored');
