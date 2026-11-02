# Posts a sample author payload to the local n8n webhook with the shared secret.
# Usage: .\test-webhook.ps1 [AUTH003] [-Prod] [-BadSecret]
param(
  [string]$AuthorId = "AUTH003",
  [switch]$Prod,
  [switch]$BadSecret
)
$root = Split-Path $PSScriptRoot -Parent
$envMap = @{}
Get-Content (Join-Path $root ".env") | ForEach-Object { if ($_ -match '^([^=]+)=(.*)$') { $envMap[$Matches[1]] = $Matches[2] } }
$secret = if ($BadSecret) { "wrong-secret" } else { $envMap["BOOKLEAF_WEBHOOK_SECRET"] }
$mode = if ($Prod) { "webhook" } else { "webhook-test" }
$url = "http://localhost:5678/$mode/royalty-summary"
$payload = Get-Content (Join-Path $root "data\payloads\$AuthorId.json") -Raw
try {
  $resp = Invoke-RestMethod -Uri $url -Method Post -Body $payload -ContentType "application/json" -Headers @{ "x-bookleaf-secret" = $secret } -TimeoutSec 90
  $resp | ConvertTo-Json -Depth 5
} catch {
  "HTTP ERROR: $($_.Exception.Message)"
  if ($_.ErrorDetails.Message) { $_.ErrorDetails.Message }
}
