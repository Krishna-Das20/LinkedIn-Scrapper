@echo off
echo Launching Chrome in Debug Mode (Port 9222)...
echo Please ensure all other Chrome windows are closed first!
echo.
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\selenium\ChromeProfile"
pause
