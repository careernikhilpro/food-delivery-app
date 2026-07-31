# start-swaddo.ps1
# Script to launch the Swaddo ecosystem locally

Write-Host "Starting Docker Services (Postgres, Redis)..." -ForegroundColor Cyan
docker-compose up -d

Write-Host "Starting Swaddo Backend (Port 5005)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd swaddo-backend; npm install --legacy-peer-deps; npm run dev"

Write-Host "Starting Customer App PWA (Port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd swaddo-customer-app; npm install --legacy-peer-deps; npm run dev"

Write-Host "Starting Merchant App (Port 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd swaddo-merchant-app; npm install --legacy-peer-deps; npm run dev"

Write-Host "Starting Delivery App (Port 3002)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd swaddo-delivery-app; npm install --legacy-peer-deps; npm run dev"

Write-Host "Starting Admin Panel (Port 3003)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd swaddo-admin-panel; npm install --legacy-peer-deps; npm run dev"

Write-Host "All services are launching in separate windows!" -ForegroundColor Green
Write-Host "Ensure Docker Desktop is running. The initial npm installs may take a few minutes."
