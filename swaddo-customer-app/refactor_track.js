const fs = require('fs');

let content = fs.readFileSync('src/app/track/page.tsx', 'utf8');

// 1. Replace imports
content = content.replace(
  /import \{ GoogleMap, useLoadScript, PolylineF, MarkerF \} from "@react-google-maps\/api";/,
  `import { LiveTrackingMap } from "@/components/maps/LiveTrackingMap";\nimport { api } from "@/lib/api";`
);

// 2. Remove MapStyles and useLoadScript
content = content.replace(/const mapStyles = \[[\s\S]*?\];/m, '');
content = content.replace(/const \{ isLoaded \} = useLoadScript\(\{[\s\S]*?\}\);/m, '');
content = content.replace(/const libraries: \("places" \| "geometry"\)\[\] = \["places", "geometry"\];/m, '');

// 3. Update route fetching logic to just save the polyline string
const routeFetchRegex = /if \(!riderLoc \|\| !userLoc \|\| !stallLoc\) return;[\s\S]*?setLiveDistance\(null\);\n\s*\}\)/m;
const newRouteFetch = `
      if (!riderLoc || !userLoc || !stallLoc) return;
      if (lastFetchedRouteStage.current === stageIndex) return;

      let origin = riderLoc;
      let destination = stageIndex < 2 ? stallLoc : userLoc;
      
      api.post('/location/route', {
        originLat: origin.lat,
        originLng: origin.lng,
        destLat: destination.lat,
        destLng: destination.lng
      }).then(res => {
        const data = res.data.data;
        if (data && data.polyline) {
          setRoutePath(data.polyline); // Storing the raw polyline string for Mappls
          baseRouteInfo.current = {
            distanceKm: parseFloat(data.distanceKm),
            durationMin: parseFloat(data.durationMin),
            straightLineDist: 0 // Placeholder, we can calculate this if needed
          };
          setLiveDistance(data.distanceKm.toFixed(1));
          setLiveETA(Math.ceil(data.durationMin));
          lastFetchedRouteStage.current = stageIndex;
        }
      }).catch(err => {
        setLiveETA(null);
        setLiveDistance(null);
      });
`;
content = content.replace(routeFetchRegex, newRouteFetch);

// 4. Remove real-time google distance tracking hook
const realTimeDistanceRegex = /\/\/ Real-time live distance\/ETA updates based on rider movement[\s\S]*?\}, \[riderLoc\]\);/m;
content = content.replace(realTimeDistanceRegex, '');

// 5. Remove recenterMap
const recenterMapRegex = /const recenterMap = \(\) => \{[\s\S]*?\}\;/m;
content = content.replace(recenterMapRegex, '');

// 6. Replace GoogleMap component with LiveTrackingMap
const googleMapRenderRegex = /<GoogleMap[\s\S]*?<\/GoogleMap>/m;
content = content.replace(
  googleMapRenderRegex,
  `<LiveTrackingMap apiKey={mapToken} riderLoc={riderLoc} storeLoc={stallLoc} userLoc={userLoc} stageIndex={stageIndex} routePolyline={typeof routePath === 'string' ? routePath : undefined} className="w-full h-full" />`
);

// 7. Update initial state of routePath
content = content.replace(/const \[routePath, setRoutePath\] = useState<any\[\]>\(\[\]\);/, 'const [routePath, setRoutePath] = useState<string | null>(null);');

fs.writeFileSync('src/app/track/page.tsx', content);
console.log('Track page refactored');
