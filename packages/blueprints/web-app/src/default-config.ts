export function generateConfigJson(stackName: string) {
  return `{
    "${stackName}": {
      "apiurl": ""
    }
  }`;
}
