# PowerShell script to start both frontend and backend servers
Write-Host "🚀 Starting Trippin Development Environment..." -ForegroundColor Green
Write-Host ""

# Start backend server
Write-Host "📡 Starting Backend Server..." -ForegroundColor Blue
$backendJob = Start-Job -ScriptBlock {
    Set-Location "F:\goon-main\goon-main\backend"
    npm run dev
}

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend server
Write-Host "🌐 Starting Frontend Server..." -ForegroundColor Blue
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "F:\goon-main\goon-main"
    npm run dev
}

Write-Host ""
Write-Host "✅ Development servers starting..." -ForegroundColor Green
Write-Host "📡 Backend: http://localhost:3001" -ForegroundColor Yellow
Write-Host "🌐 Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "🧪 Test Plan: http://localhost:5173/test-plan" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Red

# Function to stop jobs on Ctrl+C
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Write-Host "`n🛑 Shutting down servers..." -ForegroundColor Red
    Stop-Job $backendJob, $frontendJob
    Remove-Job $backendJob, $frontendJob
    Write-Host "✅ Servers stopped" -ForegroundColor Green
}

# Keep the script running
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Stop-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
}
