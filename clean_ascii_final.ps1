$files = @(
    "app\marketplace\create\page.tsx",
    "components\merchant\MobileMerchant.tsx",
    "components\CreateListing.tsx",
    "functions\src\index.ts",
    "scripts\injectDemoData.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding UTF8
        
        # Replace emojis and special characters
        $content = $content -replace "📊", ""
        $content = $content -replace "🏆", "[Top]"
        $content = $content -replace "—", "-"
        $content = $content -replace "🚀", ">>"
        $content = $content -replace "🔍", "[?]"
        $content = $content -replace "✅", "[+]"
        $content = $content -replace "⚠️", "[!]"
        $content = $content -replace "📦", "[#]"
        $content = $content -replace "🛒", "[*]"
        $content = $content -replace "🚩", "[!]"
        $content = $content -replace "⚖️", "[^]"
        $content = $content -replace "🚫", "[X]"
        $content = $content -replace "⭐", "[*]"
        $content = $content -replace "✨", "***"
        
        # Final safety check for any remaining non-ASCII
        # Note: This might be too aggressive if there are valid UTF8 chars we want to keep, 
        # but the goal is "final non-ASCII cleanup for Vercel build"
        # Let's stick to the specific ones found first.

        [System.IO.File]::WriteAllText((Resolve-Path $file), $content, [System.Text.Encoding]::ASCII)
        Write-Host "Cleaned $file"
    }
}
