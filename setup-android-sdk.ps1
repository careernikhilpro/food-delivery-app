$ErrorActionPreference = "Stop"
$SdkDir = "d:\swaddoapk\android-sdk"
$CmdLineToolsDir = "$SdkDir\cmdline-tools"
$ZipPath = "$SdkDir\cmdline-tools.zip"

Write-Host "Creating directories..."
New-Item -ItemType Directory -Force -Path $CmdLineToolsDir | Out-Null

if (-not (Test-Path "$CmdLineToolsDir\latest\bin\sdkmanager.bat")) {
    Write-Host "Downloading Android Command Line Tools..."
    # URL for commandlinetools-win-11076708_latest.zip
    $maxRetries = 3
    $retryCount = 0
    $success = $false
    while (-not $success -and $retryCount -lt $maxRetries) {
        try {
            Invoke-WebRequest -Uri "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip" -OutFile $ZipPath
            $success = $true
        } catch {
            $retryCount++
            Write-Host "Download failed. Retrying ($retryCount/$maxRetries)..."
            Start-Sleep -Seconds 5
        }
    }
    if (-not $success) {
        throw "Failed to download after $maxRetries retries."
    }
    Write-Host "Extracting..."
    Expand-Archive -Path $ZipPath -DestinationPath $CmdLineToolsDir -Force
    
    # The zip contains a folder named "cmdline-tools". We need to rename it to "latest" inside "cmdline-tools"
    Rename-Item -Path "$CmdLineToolsDir\cmdline-tools" -NewName "latest"
    Remove-Item -Path $ZipPath
}

Write-Host "Setting Environment Variables for this session..."
$env:ANDROID_HOME = $SdkDir
$env:PATH += ";$SdkDir\cmdline-tools\latest\bin;$SdkDir\platform-tools"

Write-Host "Accepting licenses..."
# Piping 'y' to sdkmanager to accept all licenses
# We repeat 'y' just in case there are multiple licenses.
cmd.exe /c "echo y| ""$CmdLineToolsDir\latest\bin\sdkmanager.bat"" --licenses"

Write-Host "Installing packages..."
& "$CmdLineToolsDir\latest\bin\sdkmanager.bat" "platform-tools" "platforms;android-34" "build-tools;34.0.0"

Write-Host "SDK Setup Complete."
