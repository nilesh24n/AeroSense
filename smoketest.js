try {
  const fs = require('fs');
  const w = {};
  w.addEventListener = () => {};
  global.window = w;
  global.document = {
    createElement: (t) => {
      return { tagName:t, style:{}, children:[], className:'', innerHTML:'', setAttribute(){}, addEventListener(){}, appendChild(c){ }, querySelector:()=>null, querySelectorAll:()=>[] };
    },
    createTextNode: (t) => t,
    getElementById: () => ({ innerHTML:'', appendChild:()=>{}, children:[] }),
    addEventListener: () => {},
    head: { appendChild: ()=>{} }
  };
  global.location = { hash: '' };
  global.L = undefined;
  global.setInterval = () => 1;
  global.clearInterval = () => {};
  global.requestAnimationFrame = (fn) => { try { fn(); } catch(e) {} };

  eval(fs.readFileSync('assets/js/data.js','utf8'));
  eval(fs.readFileSync('assets/js/forecast.js','utf8'));
  eval(fs.readFileSync('assets/js/attribution.js','utf8'));
  eval(fs.readFileSync('assets/js/simulator.js','utf8'));
  eval(fs.readFileSync('assets/js/map.js','utf8'));
  eval(fs.readFileSync('assets/js/enforcement.js','utf8'));
  eval(fs.readFileSync('assets/js/advisory.js','utf8'));
  eval(fs.readFileSync('assets/js/app.js','utf8'));
  console.log('SUCCESS - all modules loaded without error');
} catch(e) {
  console.error('ERROR:', e.message);
  console.error(e.stack.split('\n').slice(0,8).join('\n'));
}
