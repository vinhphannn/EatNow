@echo off
echo Fixing Next.js build...
if exist .next rmdir /s /q .next
echo Building frontend...
npm run build
echo Done!

