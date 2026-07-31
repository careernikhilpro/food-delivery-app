const fs = require('fs');
const path = require('path');

const walk = function(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
          }
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

walk('.', function(err, results) {
  if (err) throw err;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY')) {
      content = content.replace(/NEXT_PUBLIC_GOOGLE_MAPS_API_KEY/g, 'NEXT_PUBLIC_MAPPLS_API_KEY');
      fs.writeFileSync(file, content);
      console.log('Updated env var in:', file);
    }
  });
  console.log('Done replacing env vars');
});
