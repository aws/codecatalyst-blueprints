# This script is used by the blueprint-release workflow to build
# the blueprint, bump its package version, and commit the version
# bump back into the repository.
export PROJEN_DISABLE_POST=1
set -euo pipefail
echo "Installing dependencies..."
yum install -y rsync
npm install -g yarn
yarn

echo "Bumping package version..."
yarn bump
NEW_VERSION=`jq -r .version package.json`

echo "Building blueprint..."
yarn build
yarn blueprint:package

echo "Getting credentials..."
MI=`curl $AWS_CONTAINER_TOKEN_ENDPOINT`
ACCESS_KEY_ID=$(echo "$MI" | jq -r '.AccessKeyId')
SECRET_ACCESS_KEY=$(echo "$MI" | jq -r '.SecretAccessKey')
ORIGINAL_REMOTE=`git config --get remote.origin.url`
SOURCE_REPO_URL=`sed -e "s^//^//$ACCESS_KEY_ID:$SECRET_ACCESS_KEY@^" <<< $ORIGINAL_REMOTE`

echo "Configuring git..."
git remote set-url origin $SOURCE_REPO_URL
git config --global user.email "noreply@amazon.com"
git config --global user.name "Release Workflow"

echo "Committing changes..."
git add .
RELEASE_COMMIT_MESSAGE="chore(release): release $NEW_VERSION"
git commit -m "$RELEASE_COMMIT_MESSAGE"

echo "Pushing to origin..."
git push origin HEAD:main
