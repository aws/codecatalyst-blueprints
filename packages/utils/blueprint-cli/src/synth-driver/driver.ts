import * as fs from 'fs';

export const writeSynthDriver = (fileName: string, entrypoint: string) => {
  const content = `const { Blueprint } = require('./${entrypoint}');

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
})();`;
  fs.writeFileSync(fileName, content);
};
