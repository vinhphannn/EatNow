@echo off
echo 🚀 Starting EatNow Frontend with Distance Calculation...
echo.

echo 📦 Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo.
echo 🔥 Starting frontend server...
start "EatNow Frontend" cmd /k "npm start"

echo.
echo ⏳ Waiting for server to start...
timeout /t 10 /nobreak > nul

echo.
echo ✅ Frontend is running on http://localhost:3000
echo.
echo 🎯 Test the following features:
echo 📍 Go to: http://localhost:3000/customer/cart
echo 🛒 Add items to cart
echo 📍 Select delivery address
echo 📏 Check distance calculation
echo 💰 Check delivery fee calculation
echo 🚚 Place order and verify distance is saved
echo.
pause






