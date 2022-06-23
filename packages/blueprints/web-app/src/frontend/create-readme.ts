export const createReadme = (): string => {
  return `

## Usage
This react application is a projen project. You should use projen to manage the configuration of this project.

install dependencies and rebuild project configuration with projen:
\`\`\`
npm install && npm run projen && npm run build
\`\`\`

## Running the front end
To properly run the frontend you will need to deploy the backend first, otherwise the frontend will not be able to fetch anything from the backend. You can configure where the front-end is pointed by changing the url in the configuration file \`src/config.json\`
\`\`\`
# switch into your aws account
<switch into aws account>
# switch into backend folder
npm run deploy:copy-config
\`\`\`

## Run the front end locally.
\`\`\`
npm run dev
\`\`\`

The frontend should be hosted at http://localhost:*port-number*

`;
};
