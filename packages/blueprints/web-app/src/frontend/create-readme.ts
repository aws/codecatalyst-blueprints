export const createReadme = (): string => {
return `

## Usage
This react application is a projen project. You should use projen to manage the configuration of this project.

install dependencies and rebuild project configuration with projen:
\`\`\`
yarn && yarn projen && yarn build
\`\`\`

## Running the front end
Usually, you'll want to run the front end and the backend together. Otherwise the frontend will not be able to fetch anything from the backend. You can configure where the front-end is pointed by changing the url in the configuration file \`src/config.json\`
\`\`\`
{
    "<<my-stack-name>>" : {
        apiurl: "<<my API Url>>"
    }
}
\`\`\`

### isolated front-end
Run just the front end locally.
\`\`\`
yarn react-scripts start
\`\`\`
`;
}
