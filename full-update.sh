echo Remove node modules
echo 
rm -rf  node_modules

echo Remove package-lock.json
echo 
rm package-lock.json

echo Install modules
echo 
npm i

echo 
echo GULP
echo 
gulp

echo Completed

