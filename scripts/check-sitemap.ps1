# Sitemap Analyzer Script
# გამოყენება: .\scripts\check-sitemap.ps1

Write-Host "🗺️  Sitemap Analyzer for xparagliding.com" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$sitemapUrl = "https://xparagliding.com/sitemap.xml"

try {
    # Fetch sitemap
    Write-Host "📡 Fetching sitemap..." -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri $sitemapUrl -UseBasicParsing
    $xml = [xml]$response.Content
    
    # Total URLs
    $totalUrls = $xml.urlset.url.Count
    Write-Host "✅ Total URLs: $totalUrls`n" -ForegroundColor Green
    
    # Group by lastmod date
    Write-Host "📅 Last Modified Distribution:" -ForegroundColor Cyan
    $xml.urlset.url | Group-Object lastmod | Sort-Object Name -Descending | ForEach-Object {
        $date = $_.Name
        $count = $_.Count
        Write-Host "  - $date : $count URLs" -ForegroundColor White
    }
    
    # Group by priority
    Write-Host "`n🎯 Priority Distribution:" -ForegroundColor Cyan
    $xml.urlset.url | Group-Object priority | Sort-Object Name -Descending | ForEach-Object {
        $priority = $_.Name
        $count = $_.Count
        Write-Host "  - Priority $priority : $count URLs" -ForegroundColor White
    }
    
    # Group by changefreq
    Write-Host "`n🔄 Change Frequency Distribution:" -ForegroundColor Cyan
    $xml.urlset.url | Group-Object changefreq | ForEach-Object {
        $freq = $_.Name
        $count = $_.Count
        Write-Host "  - $freq : $count URLs" -ForegroundColor White
    }
    
    # Check for hreflang alternates
    Write-Host "`n🌐 Checking hreflang alternates..." -ForegroundColor Cyan
    $firstUrlWithAlternates = $xml.urlset.url | Where-Object { $_.link -ne $null } | Select-Object -First 1
    if ($firstUrlWithAlternates) {
        Write-Host "✅ hreflang alternates found" -ForegroundColor Green
        Write-Host "Sample URL: $($firstUrlWithAlternates.loc)" -ForegroundColor White
        $firstUrlWithAlternates.link | ForEach-Object {
            Write-Host "  - $($_.hreflang): $($_.href)" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠️  No hreflang alternates found" -ForegroundColor Red
    }
    
    # Sample URLs by type
    Write-Host "`n📋 Sample URLs:" -ForegroundColor Cyan
    Write-Host "Home pages:" -ForegroundColor Yellow
    $xml.urlset.url | Where-Object { $_.loc -match "^https://xparagliding\.com/[a-z]{2}$" } | Select-Object -First 3 | ForEach-Object {
        Write-Host "  - $($_.loc)" -ForegroundColor White
    }
    
    Write-Host "`nCountry pages:" -ForegroundColor Yellow
    $xml.urlset.url | Where-Object { $_.loc -match "/locations/[^/]+$" } | Select-Object -First 3 | ForEach-Object {
        Write-Host "  - $($_.loc)" -ForegroundColor White
    }
    
    Write-Host "`nLocation pages:" -ForegroundColor Yellow
    $xml.urlset.url | Where-Object { $_.loc -match "/locations/[^/]+/[^/]+" } | Select-Object -First 3 | ForEach-Object {
        Write-Host "  - $($_.loc)" -ForegroundColor White
    }
    
    # Validation
    Write-Host "`n✅ Validation:" -ForegroundColor Cyan
    Write-Host "  - XML is valid: ✅" -ForegroundColor Green
    Write-Host "  - Namespace: $($xml.urlset.xmlns)" -ForegroundColor Gray
    Write-Host "  - xhtml namespace: $($xml.urlset.GetAttribute('xmlns:xhtml'))" -ForegroundColor Gray
    
    # Check if dates are stable (compare with previous fetch)
    Write-Host "`n⏱️  Waiting 5 seconds to check date stability..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    $response2 = Invoke-WebRequest -Uri $sitemapUrl -UseBasicParsing
    $xml2 = [xml]$response2.Content
    
    $dates1 = $xml.urlset.url.lastmod | Sort-Object
    $dates2 = $xml2.urlset.url.lastmod | Sort-Object
    
    $datesChanged = Compare-Object $dates1 $dates2
    if ($datesChanged) {
        Write-Host "⚠️  PROBLEM: lastmod dates are changing on every request!" -ForegroundColor Red
        Write-Host "This indicates the bug is NOT fixed yet." -ForegroundColor Red
    } else {
        Write-Host "✅ lastmod dates are STABLE (not changing)" -ForegroundColor Green
        Write-Host "This is correct behavior!" -ForegroundColor Green
    }
    
    Write-Host "`n✅ Analysis complete!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📚 Next steps:" -ForegroundColor Cyan
Write-Host "1. If dates are stable, resubmit sitemap to Google Search Console" -ForegroundColor White
Write-Host "2. Monitor indexing in GSC over the next 2-3 days" -ForegroundColor White
Write-Host "3. Check Coverage report for improvements" -ForegroundColor White
