import { config } from 'dotenv';
config();

import { reverseGeocode, autosuggest, distance, routeETA } from './src/services/maps/mapProvider';

async function runTests() {
  try {
    console.log('Testing reverseGeocode...');
    const rev = await reverseGeocode(28.6139, 77.2090);
    console.log(rev);

    console.log('Testing autosuggest...');
    const auto = await autosuggest('India Gate', '28.6139,77.2090');
    console.log(auto);

    console.log('Testing distance...');
    const dist = await distance('77.2090,28.6139;77.2295,28.6129'); // lng,lat
    console.log(dist);

    console.log('Testing routeETA...');
    const route = await routeETA(28.6139, 77.2090, 28.6129, 77.2295);
    console.log(route);

    console.log('All tests passed.');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests();
