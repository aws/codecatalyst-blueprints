import * as fs from 'fs';

export const SYNTH_TS_NAME = 'synth-driver.ts';
export const writeSynthDriver = (
  fileName: string,
  entrypoint: string,
  options?: {
    packageJsonLocation?: string;
  },
): string => {
  const content = `const { Blueprint } = require('./${entrypoint}');
const packageJson = require('${options?.packageJsonLocation || './package.json'}');

// ============================
// ============================
// Synthetization
// ============================
void (async () => {
  // node cached-synth.js '{options-selected}' 'outputDirectory'
  const options = JSON.parse(process.argv[2]);
  const outputdir = process.argv[3];
  const entropy = process.argv[4] ? process.argv[4] : '';

  process.env.CONTEXT_SPACENAME = process.env.CONTEXT_SPACENAME || '<<FAKE_SPACENAME>>';
  process.env.CONTEXT_PROJECTNAME = process.env.CONTEXT_PROJECTNAME || '<<FAKE_PROJECTNAME>>';
  process.env.CONTEXT_ENVIRONMENTID = process.env.CONTEXT_ENVIRONMENTID || 'prod';

  process.env.PACKAGE_NAME = process.env.PACKAGE_NAME || packageJson.name || '<<FAKE_BLUEPRINT_PACKAGENAME>>';
  process.env.PACKAGE_VERSION = process.env.PACKAGE_VERSION || packageJson.version || '<<FAKE_BLUEPRINT_PACKAGEVERSION>>';

  process.env.EXISTING_BUNDLE_ABS = process.env.EXISTING_BUNDLE_ABS || '';
  process.env.BRANCH_NAME = process.env.BRANCH_NAME || '';

  process.env.PROJEN_DISABLE_POST = '1';
  
  console.log("===== Starting synthesis ===== ");
  console.log("options: ", options);
  console.log("outputDir: ", outputdir);
  try {
    const bp = new Blueprint({
      ...options,
      outdir: outputdir
    })
    await bp.synth();
    console.log("===== Ending synthesis ===== ");
  } catch (err) {
    const errorMessage = JSON.stringify(err, Object.getOwnPropertyNames(err));
    console.error(\`===== BlueprintSynthesisError-\${entropy} =====\`);
    console.error(\`\${errorMessage}\`);
    console.error(\`===== BlueprintSynthesisError-\${entropy} =====\`);
    console.log("===== SYNTHESIS FAILED ===== ");
    throw err;
  }
})();`;
  fs.writeFileSync(fileName, content);
  return fileName;
};
