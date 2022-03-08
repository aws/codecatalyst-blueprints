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
  # switch into your aws account

  # deploy the backend the first time. Copy over the output of the deployed stack into the front end
  deploy:copy-config

  # watch the backend stack and deploy it whenever it changes
  yarn autodeploy
  \`\`\`
  `;
};
