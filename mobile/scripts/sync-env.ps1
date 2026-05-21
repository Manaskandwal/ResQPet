$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$frontendEnv = Join-Path $repoRoot "frontend\.env"
$backendEnv = Join-Path $repoRoot "backend\.env"
$mobileEnv = Join-Path $repoRoot "mobile\.env"

function Read-EnvFile($path) {
    $values = @{}
    if (!(Test-Path $path)) { return $values }

    Get-Content $path | ForEach-Object {
        $line = $_.Trim()
        if (!$line -or $line.StartsWith("#") -or !$line.Contains("=")) { return }
        $parts = $line.Split("=", 2)
        $values[$parts[0]] = $parts[1]
    }
    return $values
}

function Socket-Url($apiUrl) {
    if (!$apiUrl) { return "http://localhost:5000" }
    return $apiUrl -replace "/api/?$", ""
}

$front = Read-EnvFile $frontendEnv
$back = Read-EnvFile $backendEnv

$apiUrl = $front["VITE_API_URL"]
if (!$apiUrl) { $apiUrl = "http://localhost:5000/api" }

$googleWebClientId = $front["VITE_GOOGLE_CLIENT_ID"]
if (!$googleWebClientId) { $googleWebClientId = $back["GOOGLE_WEB_CLIENT_ID"] }

$razorpayKey = $front["VITE_RAZORPAY_KEY_ID"]
if (!$razorpayKey) { $razorpayKey = $back["RAZORPAY_KEY_ID"] }

$content = @(
    "EXPO_PUBLIC_API_URL=$apiUrl",
    "EXPO_PUBLIC_SOCKET_URL=$(Socket-Url $apiUrl)",
    "EXPO_PUBLIC_RAZORPAY_KEY_ID=$razorpayKey",
    "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=$googleWebClientId",
    "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=",
    "EXPO_PUBLIC_MAP_STYLE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png"
)

Set-Content -Path $mobileEnv -Value $content
Write-Output "Wrote mobile\.env from frontend/backend env files. Fill EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID before Android Google sign-in builds."
