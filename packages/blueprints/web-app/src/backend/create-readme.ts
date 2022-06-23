export const createReadme = (): string => {
  return `

  ## Usage
  This react application is a projen project. You should use projen to manage the configuration of this project.

  install dependencies and rebuild project configuration with projen:
  \`\`\`
  npm install && npm run projen && npm run build
  \`\`\`

  ## Deploying the back-end
  To properly run the application you will need to deploy the backend first, otherwise the frontend will not be able to fetch anything from the backend.
  \`\`\`
  # switch into your aws account
  <switch into aws account>
  # Deploy the backend aws resource and copy over the output of the deployed stack into the front end config.json
  npm run deploy:copy-config
  \`\`\`
  `;
};
