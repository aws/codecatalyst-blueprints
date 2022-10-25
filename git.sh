export username=`aws secretsmanager get-secret-value --secret-id blueprintsGithubUsername | jq -r .SecretString`
export token=`aws secretsmanager get-secret-value --secret-id blueprintsGithubToken | jq -r .SecretString`
git config --global user.email "${username}@no-reply.com",
git config --global user.name "${username}",
export repoName='aws/caws-blueprints'

export triggeringHash='684675653bd0fec291c533b2b0402227e5e4c1ee'
export repository="https://$username:$token@github.com/$repoName.git"
export topRemoteHash=`git ls-remote ${repository} HEAD | awk '{ print $1}'`
echo "triggeringHash [${triggeringHash}]"
echo "remote [${topRemoteHash}]"

# the remote has a different hash, we dont want to run a release as we can lose changes.
if [ $triggeringHash != $topRemoteHash ]; then exit 1; fi
# otherwise continue

git init
`git remote add origin ${repository}`
git add -A

CURRENT_DATE=$(date -u)
git commit -m "chore(release): $CURRENT_DATE"
git fetch origin main
git diff
git pull --rebase origin main -s recursive -X theirs --allow-unrelated-histories --no-edit
# git log
# exit 1
git push --set-upstream origin main --no-verify
