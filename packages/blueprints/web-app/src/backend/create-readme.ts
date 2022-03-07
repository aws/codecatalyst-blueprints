export const createReadme = (): string => {
  return `

  ## Usage
  This react application is a projen project. You should use projen to manage the configuration of this project.

  install dependencies and rebuild project configuration with projen:
  \`\`\`
  yarn && yarn projen && yarn build
  \`\`\`

  ### Running the back-end
  Deploy the backend in watch mode.
  \`\`\`
  yarn autodeploy
  \`\`\`
  `;
  }
