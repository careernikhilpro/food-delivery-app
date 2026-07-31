const key = 'dxmbfyqvddkrnzeurqwwtcbzmzbgxesdhmlb';
fetch(`https://apis.mappls.com/advancedmaps/v1/${key}/rev_geocode?lat=28.6139&lng=77.2090`)
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data)))
  .catch(err => console.error(err));
