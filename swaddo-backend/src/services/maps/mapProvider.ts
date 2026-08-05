import NodeCache from 'node-cache';
import { logger } from '../../utils/logger';
import { Client } from '@googlemaps/google-maps-services-js';

const cache = new NodeCache({ stdTTL: 86400, checkperiod: 1200 });
const googleMapsClient = new Client({});

const getApiKey = () => {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key || key === 'dummy_key_for_dev') {
    logger.warn('GOOGLE_MAPS_API_KEY is missing or dummy. Map services will use fallback data.');
  }
  return key || 'dummy_key_for_dev';
};

// Simple retry utility for transient errors
const withRetry = async <T>(fn: () => Promise<T>, retries = 2): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0) {
      logger.warn(`Retrying Map API call... attempts left: ${retries - 1}`);
      await new Promise(res => setTimeout(res, 1000));
      return withRetry(fn, retries - 1);
    }
    throw error;
  }
};

export const geocode = async (address: string) => {
  if (getApiKey() === 'dummy_key_for_dev' || process.env.NODE_ENV !== 'production') {
    return { lat: 20.5937, lng: 78.9629, address: 'Dummy Location', placeId: 'dummy', city: 'Dummy City', state: 'Dummy State', pincode: '000000' };
  }
  const cacheKey = `geocode_${address.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const start = Date.now();
  try {
    const result = await withRetry(async () => {
      const response = await googleMapsClient.geocode({
        params: {
          address,
          key: getApiKey()
        }
      });
      if (response.data.results.length === 0) throw new Error('No results found');
      const r = response.data.results[0];
      
      const cityObj = r.address_components.find(c => c.types.includes('locality' as any));
      const stateObj = r.address_components.find(c => c.types.includes('administrative_area_level_1' as any));
      const pinObj = r.address_components.find(c => c.types.includes('postal_code' as any));

      return {
        lat: r.geometry.location.lat,
        lng: r.geometry.location.lng,
        address: r.formatted_address,
        placeId: r.place_id,
        city: cityObj ? cityObj.long_name : '',
        state: stateObj ? stateObj.long_name : '',
        pincode: pinObj ? pinObj.long_name : ''
      };
    });
    cache.set(cacheKey, result);
    logger.info(`[MapProvider] geocode success | ${Date.now() - start}ms | ${address}`);
    return result;
  } catch (err: any) {
    logger.error(`[MapProvider] geocode failed | ${Date.now() - start}ms | ${address}`);
    if (getApiKey() === 'dummy_key_for_dev' || process.env.NODE_ENV !== 'production') {
        return { lat: 20.5937, lng: 78.9629, address: 'Dummy Location', placeId: 'dummy', city: 'Dummy City', state: 'Dummy State', pincode: '000000' };
    }
    throw err;
  }
};

export const reverseGeocode = async (lat: number, lng: number) => {
  if (getApiKey() === 'dummy_key_for_dev' || process.env.NODE_ENV !== 'production') {
    return { lat, lng, address: 'Dummy Reverse Location', placeId: 'dummy', city: 'Dummy City', state: 'Dummy State', pincode: '000000' };
  }
  const cacheKey = `rev_geocode_${lat}_${lng}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const start = Date.now();
  try {
    const result = await withRetry(async () => {
      const response = await googleMapsClient.reverseGeocode({
        params: {
          latlng: { lat, lng },
          key: getApiKey()
        }
      });
      if (response.data.results.length === 0) throw new Error('No results found');
      const r = response.data.results[0];

      const cityObj = r.address_components.find(c => c.types.includes('locality' as any));
      const stateObj = r.address_components.find(c => c.types.includes('administrative_area_level_1' as any));
      const pinObj = r.address_components.find(c => c.types.includes('postal_code' as any));

      return {
        lat,
        lng,
        address: r.formatted_address,
        placeId: r.place_id,
        city: cityObj ? cityObj.long_name : '',
        state: stateObj ? stateObj.long_name : '',
        pincode: pinObj ? pinObj.long_name : ''
      };
    });
    cache.set(cacheKey, result);
    logger.info(`[MapProvider] reverseGeocode success | ${Date.now() - start}ms | ${lat},${lng}`);
    return result;
  } catch (err: any) {
    logger.error(`[MapProvider] reverseGeocode failed | ${Date.now() - start}ms | ${lat},${lng}`);
    if (getApiKey() === 'dummy_key_for_dev' || process.env.NODE_ENV !== 'production') {
        return { lat, lng, address: 'Dummy Reverse Location', placeId: 'dummy', city: 'Dummy City', state: 'Dummy State', pincode: '000000' };
    }
    throw err;
  }
};

export const autosuggest = async (query: string, location?: string) => {
  if (getApiKey() === 'dummy_key_for_dev' || process.env.NODE_ENV !== 'production') {
    return [{ placeId: 'dummy', description: 'Dummy Suggestion', mainText: 'Dummy Suggestion', secondaryText: '' }];
  }
  const start = Date.now();
  try {
    const result = await withRetry(async () => {
      const params: any = {
        input: query,
        key: getApiKey()
      };
      if (location) {
        const [lat, lng] = location.split(',');
        params.location = { lat: parseFloat(lat), lng: parseFloat(lng) };
        params.radius = 50000;
      }
      const response = await googleMapsClient.placeAutocomplete({ params });
      
      return response.data.predictions.map(p => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting.main_text,
        secondaryText: p.structured_formatting.secondary_text
      }));
    });
    logger.info(`[MapProvider] autosuggest success | ${Date.now() - start}ms | ${query}`);
    return result;
  } catch (err: any) {
    logger.error(`[MapProvider] autosuggest failed | ${Date.now() - start}ms | ${query}`);
    if (getApiKey() === 'dummy_key_for_dev' || process.env.NODE_ENV !== 'production') {
        return [{ placeId: 'dummy', description: 'Dummy Suggestion', mainText: 'Dummy Suggestion', secondaryText: '' }];
    }
    throw err;
  }
};

export const distance = async (coordinates: string) => {
  if (getApiKey() === 'dummy_key_for_dev' || process.env.NODE_ENV !== 'production') {
    return { distanceKm: 5, durationMin: 15 };
  }
  const start = Date.now();
  try {
    const parts = coordinates.split(';');
    if (parts.length < 2) throw new Error('At least 2 coordinates required');
    
    const origins = parts.slice(0, parts.length - 1).map(p => { const [lng, lat] = p.split(','); return { lat: parseFloat(lat), lng: parseFloat(lng) }; });
    const destinations = [parts[parts.length - 1]].map(p => { const [lng, lat] = p.split(','); return { lat: parseFloat(lat), lng: parseFloat(lng) }; });

    const result = await withRetry(async () => {
      const response = await googleMapsClient.distancematrix({
        params: {
          origins,
          destinations,
          key: getApiKey()
        }
      });
      if (!response.data.rows[0].elements[0].distance) throw new Error('No distance data');
      return {
        distanceKm: response.data.rows[0].elements[0].distance.value / 1000,
        durationMin: response.data.rows[0].elements[0].duration.value / 60
      };
    });
    logger.info(`[MapProvider] distance success | ${Date.now() - start}ms | ${coordinates}`);
    return result;
  } catch (err: any) {
    logger.error(`[MapProvider] distance failed | ${Date.now() - start}ms | ${coordinates}`);
    if (getApiKey() === 'dummy_key_for_dev' || process.env.NODE_ENV !== 'production') {
        return { distanceKm: 5, durationMin: 15 };
    }
    throw err;
  }
};

export const routeETA = async (originLat: number, originLng: number, destLat: number, destLng: number) => {
  if (getApiKey() === 'dummy_key_for_dev' || process.env.NODE_ENV !== 'production') {
    return { distanceKm: 5, durationMin: 15, polyline: 'dummy_polyline' };
  }
  const start = Date.now();
  try {
    const result = await withRetry(async () => {
      const response = await googleMapsClient.directions({
        params: {
          origin: { lat: originLat, lng: originLng },
          destination: { lat: destLat, lng: destLng },
          key: getApiKey()
        }
      });
      if (response.data.routes.length === 0) throw new Error('No route found');
      const route = response.data.routes[0];
      const leg = route.legs[0];
      return {
        distanceKm: leg.distance.value / 1000,
        durationMin: leg.duration.value / 60,
        polyline: route.overview_polyline.points
      };
    });
    logger.info(`[MapProvider] routeETA success | ${Date.now() - start}ms | ${originLat},${originLng} to ${destLat},${destLng}`);
    return result;
  } catch (err: any) {
    logger.error(`[MapProvider] routeETA failed | ${Date.now() - start}ms`);
    if (getApiKey() === 'dummy_key_for_dev' || process.env.NODE_ENV !== 'production') {
        return { distanceKm: 5, durationMin: 15, polyline: 'dummy_polyline' };
    }
    throw err;
  }
};

export const getMapToken = () => {
    return getApiKey();
};
