# Manifest Engine One-Click Installer
Write-Host "Installing Manifest Engine v1.3..." -ForegroundColor Cyan

# Clone repository
git clone https://github.com/CB-PORTAL/manifest-engine-v1.3.git
cd manifest-engine-v1.3

# Install dependencies
npm install
.\scripts\install-local.bat

# Start application
.\start-local.bat

Write-Host "Installation Complete!" -ForegroundColor Green