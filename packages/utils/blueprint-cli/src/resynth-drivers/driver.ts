import * as fs from 'fs';

export const RESYNTH_TS_NAME = 'resynth-driver.ts';
export const writeResynthDriver = (
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
// Resynthetization
// ============================
(() => {
  // node cached-resynth.js 'options' 'outputDirectory' 'entropy' 'ancestorBundleDirectory' 'existingBundleDirectory' 'proposedBundleDirectory'
  const options = JSON.parse(process.argv[2]);
  const outputdir = process.argv[3];
  const entropy = process.argv[4] ? process.argv[4] : '';

  const ancestorBundleDirectory = process.argv[5] ? process.argv[5] : '';
  const existingBundleDirectory = process.argv[6] ? process.argv[6] : '';
  const proposedBundleDirectory = process.argv[7] ? process.argv[7] : '';

  process.env.CONTEXT_SPACENAME = process.env.CONTEXT_SPACENAME || '<<FAKE_SPACENAME>>';
  process.env.CONTEXT_PROJECTNAME = process.env.CONTEXT_PROJECTNAME || '<<FAKE_PROJECTNAME>>';
  process.env.CONTEXT_ENVIRONMENTID = process.env.CONTEXT_ENVIRONMENTID || 'prod';

  process.env.PACKAGE_NAME = process.env.PACKAGE_NAME || packageJson.name || '<<FAKE_BLUEPRINT_PACKAGENAME>>';
  process.env.PACKAGE_VERSION = process.env.PACKAGE_VERSION || packageJson.version || '<<FAKE_BLUEPRINT_PACKAGEVERSION>>';

  process.env.EXISTING_BUNDLE_ABS = process.env.EXISTING_BUNDLE_ABS || '';

  process.env.BRANCH_NAME = process.env.BRANCH_NAME || '';
  process.env.PROJEN_DISABLE_POST = '1';
  
  console.log("===== Starting resynthesis ===== ");
  console.log("options: ", options);
  console.log("outputDir: ", outputdir);
  try {
    const bp = new Blueprint({
      ...options,
      outdir: outputdir
    })
    bp.resynth(ancestorBundleDirectory, existingBundleDirectory, proposedBundleDirectory);
    
    console.log("===== Ending resynthesis ===== ");
  } catch (err) {
    const errorMessage = JSON.stringify(err, Object.getOwnPropertyNames(err));
    console.error(\`===== BlueprintSynthesisError-\${entropy} =====\`);
    console.error(\`\${errorMessage}\`);
    console.error(\`===== BlueprintSynthesisError-\${entropy} =====\`);
    console.log("===== RESYNTHESIS FAILED ===== ");
    throw err;
  }
})();`;
  fs.writeFileSync(fileName, content);
  return fileName;
};
