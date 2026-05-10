@echo off
echo Stashing any changes...
git stash

echo Pulling latest changes from remote...
git pull origin master

echo Applying stashed changes...
git stash pop

echo Adding all changes...
git add -A

echo Committing changes...
git commit -m "feat: add landing page as main page with login integration and back to home link"

echo Pushing to GitHub...
git push origin master

echo Done!
pause
