const { Blueprint } = require('./src/index.ts');

// ============================
// ============================
// Synthetization
// ============================
(() => {
  // node cached-synth.js '{options-selected}' 'outputDirectory'
  const options = JSON.parse(process.argv[2]);
  const outputdir = process.argv[3];

  console.log("===== Starting synthesis ===== ");
  console.log("options: ", options);
  console.log("outputDir: ", outputdir);

  new Blueprint({
    ...options,
    outdir: outputdir
  }).synth();
  console.log("===== Ending synthesis ===== ");
})();