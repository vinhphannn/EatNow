@echo off
echo 🚀 Starting EatNow Backend with Distance Calculation...
echo.

echo 📦 Building backend...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo.
echo 🔥 Starting backend server...
start "EatNow Backend" cmd /k "npm start"

echo.
echo ⏳ Waiting for server to start...
timeout /t 5 /nobreak > nul

echo.
echo 🧪 Testing API endpoints...
echo 📍 Testing health endpoint...
curl -s http://localhost:3001/status || echo ❌ Health check failed

echo.
echo 📋 Testing orders endpoint...
curl -s -X GET http://localhost:3001/api/v1/orders/customer -H "Authorization: Bearer test" || echo ❌ Orders endpoint failed

echo.
echo ✅ Backend is running on http://localhost:3001
echo 📊 API Documentation: http://localhost:3001/api
echo.
echo 🎯 Ready to test distance calculation!
echo.
pause






