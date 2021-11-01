/* eslint-disable no-useless-escape */
export const buildPublish = (packageName: string): string => `
#!/bin/sh

package_name=''
package_version=''
package_path=''
CAWS_COOKIE='code-aws-cognito-session=eyJraWQiOiJKWkRxZGpiMEZTK3NxTWtsXC9rdlkyamRIQW43T3QwRnRDeTJVald2VTZIVT0iLCJhbGciOiJSUzI1NiJ9.eyJhdF9oYXNoIjoiUVVoeEZNRmtXMnB0dlhYaGdTRHlXUSIsImN1c3RvbTppZGVudGl0eVN0b3JlVXNlcklkIjoiOTA2NzY0MmFjNy1iOGFjY2YwYy0xOGE0LTRjODAtYTVhOS05Y2Y4MmEwM2EwMzciLCJzdWIiOiI3NDY0MWNmMi0zMjYxLTQ5MjQtYWU1Ni0zNjY5NTJhMDcxMDUiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tXC91cy1lYXN0LTFfWEpmcmZWTEc5IiwiY29nbml0bzp1c2VybmFtZSI6Ijc0NjQxY2YyLTMyNjEtNDkyNC1hZTU2LTM2Njk1MmEwNzEwNSIsImF1ZCI6IjJ1YzAzYThzM2wyMDE3MmZiaXQyNzMyNXBiIiwiZXZlbnRfaWQiOiIwMzY4NGJmYS1kMDkxLTRhNTYtODJjNS03NWMwMTc0MTgyOGQiLCJ0b2tlbl91c2UiOiJpZCIsImF1dGhfdGltZSI6MTYzMjIzOTM2MCwibmFtZSI6Im1hdHQiLCJleHAiOjE2MzIyODI1NjAsImlhdCI6MTYzMjIzOTM2MCwiZW1haWwiOiJtYXR0Z21jZCtvcmdsaXN0QGFtYXpvbi5jb20ifQ.Q-UCI9MTwFI3G-xLp_TDXkjOpEwSuDHRVqJ8iMjazbMwsGSpw1eUjeVD5Dz4Pe3uuChaBlAKgXMlRFwLPK09Pp_I1QC1kcOwi8j4NqRz-bdXEXehpWzh7CyvwSFRKymWkcjzSGoQePsD7HbZCIkJokAnJESmomdls-nIkHFuP_DizYQbKToCq4YHawc-hzGRzza2R6R5cY8MVYfk1gVzhrDg3TkSDUByu-S1igp8Gy21c5Uy5V24Aws1BFw2VxW4zwthgW0memnxSxJuHNGQrxR-7Fnr0DrNLjg6NdDMG14YsYWyFITnbxcem_UQQOOu3G-Cr8qj29qffzdqAzvfzg'
echo $CAWS_COOKIE
# exit;

PUBLISHER='caws'
ORGANIZATION='caws'

while getopts ":n:v:f:" option; do
   case $option in
    n) package_name=$OPTARG
      ;;
    v) package_version=$OPTARG
      ;;
    f) package_path=$OPTARG
      ;;
   esac
done
echo '============'
echo 'Starting publish'
echo $package_name
echo $package_version
echo $package_path
echo '============'

shift $((OPTIND-1))

if [ -z "$PUBLISHER" ]; then
    echo '$PUBLISHER has not been specified'
    exit -1
fi

if [ -z "$ORGANIZATION" ]; then
    echo '$ORGANIZATION has not been specified'
    exit -1
fi

if [ -z "$CAWS_COOKIE" ]; then
    echo 'CAWS_COOKIE has not been specified'
    exit -1
fi

if [ -z "$package_name" ]; then
    echo 'Name (-n) has not been specified'
    exit -1
fi

if [ -z "$package_version" ]; then
    echo 'Version (-v) has not been specified'
    exit -1
fi

if [ -z "$package_path" ]; then
    echo 'Package path has not been specified'
    exit -1
fi

uploadUrl=$(curl -v 'https://api-gamma.quokka.codes/graphql?' \
  -H 'authority: api-gamma.quokka.codes' \
  -H 'accept: application/json' \
  -H 'content-type: application/json' \
  -H 'origin: https://api-gamma.quokka.codes' \
  -H 'x-api-key: CBxZwFn2o0pofwuIE0yR' \
  -H "cookie: $CAWS_COOKIE" \
  --data-raw "{\"query\":\"mutation {\\n  createTemplateUploadUrl(input: {\\n    organizationName: \\\"\${ORGANIZATION}\\\",\\n    publisher: \\\"\${PUBLISHER}\\\"\\n    name: \\\"${packageName}\\\",\\n    version: \\\"\${package_version}\\\"\\n  }) {\\n    uploadUrl,\\n    publishingJobId\\n  }\\n}\",\"variables\":{\"organizationName\":\"\${ORGANIZATION}\"}}" \
  --compressed | jq -r .data.createTemplateUploadUrl.uploadUrl)

echo $uploadUrl
echo $package_path
curl --upload-file "$package_path" $uploadUrl

`