const fs = require('fs');

let content = fs.readFileSync('src/app/active-delivery/page.tsx', 'utf8');

// 1. Replace imports
content = content.replace(
  /import \{ GoogleMap, useLoadScript, PolylineF, MarkerF \} from "@react-google-maps\/api";/,
  `import { LiveTrackingMap } from "@/components/maps/LiveTrackingMap";`
);

// 2. Remove mapStyles and useLoadScript
content = content.replace(/const mapStyles = \[[\s\S]*?\];/m, '');
content = content.replace(/const \{ isLoaded \} = useLoadScript\(\{[\s\S]*?\}\);/m, '');
content = content.replace(/const libraries: \("places" \| "geometry"\)\[\] = \["places", "geometry"\];/m, '');

// 3. Update route fetching
const routeFetchRegex = /if \(riderLocation && destination && isLoaded && window\.google\) \{[\s\S]*?setLiveETA\(null\);\n\s*\}\)/m;
const newRouteFetch = `
      if (riderLocation && destination) {
        try {
          const res = await api.post('/location/route', {
            originLat: riderLocation.lat,
            originLng: riderLocation.lng,
            destLat: destination.lat,
            destLng: destination.lng
          });
          
          if (res.data.success) {
            const data = res.data.data;
            if (data && data.polyline) {
              setRoutePath(data.polyline);
              lastFetchedRouteStage.current = stageIndex;
              setLiveDistance(data.distanceKm.toFixed(1));
              setLiveETA(Math.ceil(data.durationMin));
            }
          }
        } catch (error) {
          console.error("Failed to fetch route", error);
          setLiveDistance(null);
          setLiveETA(null);
        }
`;
content = content.replace(routeFetchRegex, newRouteFetch);

// 4. Remove recenterMap logic
const recenterMapRegex = /const recenterMap = \(\) => \{[\s\S]*?\}\;/m;
content = content.replace(recenterMapRegex, '');

// 5. Replace Map component
const googleMapRenderRegex = /<GoogleMap[\s\S]*?<\/GoogleMap>/m;
content = content.replace(
  googleMapRenderRegex,
  `<LiveTrackingMap apiKey={mapboxToken} riderLoc={riderLocation} storeLoc={stallLocation} userLoc={customerLocation} stageIndex={stageIndex} routePolyline={typeof routePath === 'string' ? routePath : undefined} className="w-full h-full" />`
);

// 6. Update routePath state type
content = content.replace(/const \[routePath, setRoutePath\] = useState<any\[\]>\(\[\]\);/, 'const [routePath, setRoutePath] = useState<string | null>(null);');

// 7. Update google maps links to mappls map links
content = content.replace(/href=\{`https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=\$\{stageIndex < 2 \? stallLocation\?\.lat \+ ',' \+ stallLocation\?\.lng : customerLocation\?\.lat \+ ',' \+ customerLocation\?\.lng\}&travelmode=driving`\}/g,
  `href={\`https://maps.mappls.com/dir/\${riderLocation?.lat},\${riderLocation?.lng}/\${stageIndex < 2 ? stallLocation?.lat + ',' + stallLocation?.lng : customerLocation?.lat + ',' + customerLocation?.lng}\`}`);

fs.writeFileSync('src/app/active-delivery/page.tsx', content);
console.log('Rider page refactored');
