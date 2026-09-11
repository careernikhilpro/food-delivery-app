const fs = require('fs');
let code = fs.readFileSync('src/routes/orders.routes.ts', 'utf8');

const regex = /let dropoffDistance = 3\.5; \/\/ fallback[\s\S]*?console\.error\("Google Maps Route failed for job dispatch, using fallback", error\);\n\s*\}\n\s*\}/g;

const replacement = `      let dropoffDistance = 1.0; // safer fallback instead of generous 3.5km
      let dropoffText = "1.0 km";
      if (stall && stall.latitude && stall.longitude && order.delivery_lat && order.delivery_lng) {
        // Calculate Haversine fallback first
        const R = 6371; // km
        const dLat = (order.delivery_lat - stall.latitude) * Math.PI / 180;
        const dLon = (order.delivery_lng - stall.longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(stall.latitude * Math.PI / 180) * Math.cos(order.delivery_lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        dropoffDistance = (R * c) * 1.2; // 20% road penalty
        dropoffText = dropoffDistance.toFixed(1) + " km";

        try {
          const googleRes = await routeETA(stall.latitude, stall.longitude, order.delivery_lat, order.delivery_lng);
          if (googleRes && googleRes.distanceKm) {
            dropoffDistance = googleRes.distanceKm;
            dropoffText = dropoffDistance.toFixed(1) + " km";
          }
        } catch (error) {
          console.error("Google Maps Route failed for job dispatch, using haversine fallback", error);
        }
      }`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/routes/orders.routes.ts', code);
  console.log('Patched with Regex fallback successfully');
} else {
  console.log('Regex Target not found in file');
}
