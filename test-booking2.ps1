$url = "https://dxvczwjbroyxpwnnwaca.supabase.co/functions/v1/create-booking"
$apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dmN6d2picm95eHB3bm53YWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAyODI4MjIsImV4cCI6MjA0NTg1ODgyMn0.AtLxmW6yLBIuVpzR3f62J1E4MzWmJvnmVJT-FYYnERA"

# Use the location ID from the screenshot URL
$body = @{
    full_name = "Test User"
    phone = "+995555123456"
    booking_source = "platform_general"
    location_id = "4dc07c4e-dfba-499e-abd8-30e652a472a1"
    flight_type_id = "-1763899078826-qs6tcj"
    flight_type_name = "Standard Flight"
    selected_date = "2026-01-15"
    number_of_people = 1
    base_price = 350
    services_total = 150
    total_price = 500
    currency = "GEL"
    contact_method = "whatsapp"
} | ConvertTo-Json -Depth 10

Write-Host "Request Body:"
Write-Host $body
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $url -Method POST -ContentType "application/json" -Headers @{"apikey"=$apikey} -Body $body -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}
