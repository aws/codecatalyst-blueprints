export username=`aws secretsmanager get-secret-value --secret-id blueprintsGithubUsername | jq -r .SecretString`
export token=`aws secretsmanager get-secret-value --secret-id blueprintsGitHubToken | jq -r .SecretString`
export repoName='alexforsyth/caws-blueprints'

export triggeringHash='6c4aaecc739753d4f4aed65f4006b9d3accabb7b'
export repository="https://$username:$token@github.com/$repoName.git"
export topRemoteHash=`git ls-remote ${repository} HEAD | awk '{ print $1}'`
echo "triggeringHash ${triggeringHash}"
echo "remote ${topRemoteHash}"

# the remote has a different hash, we dont want to run a release as we can lose changes.
[ $triggeringHash != $topRemoteHash ] && exit 1

# otherwise continue

git init
`git remote add origin ${repository}`
git add -A

export date=`date`
git commit -m "chore(release) ${date}"
git fetch origin main
git pull --rebase origin main -s recursive -X ours --allow-unrelated-histories --no-edit
exit 1
git push --set-upstream origin main --no-verify

# git fetch origin main

# git pull origin main -s recursive -X ours




echo 'proceeding'
exit 1

# git push ${repository} --force


