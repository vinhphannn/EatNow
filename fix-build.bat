@echo off
echo Fixing build issues...

cd frontend
echo Cleaning .next directory...
if exist .next rmdir /s /q .next

echo Installing dependencies...
npm install

echo Building project...
npm run build

echo Starting development server...
npm run dev

pause

