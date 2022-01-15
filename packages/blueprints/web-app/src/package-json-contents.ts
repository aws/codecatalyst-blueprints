export function generatePackageJson(
  reactFolderName: string,
  nodeFolderName: string,
) {
  return `{
    "type": "module",
    "private": true,
    "scripts": {
      "build-server": "cd ./${nodeFolderName} && npm install && npm run build",
      "build-client": "cd ./${reactFolderName} && npm install && npm run build"
    }
  }
  `;
}
