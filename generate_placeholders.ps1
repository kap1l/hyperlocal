
Add-Type -AssemblyName System.Drawing

function New-Image {
    param (
        [string]$OutputPath,
        [int]$Width,
        [int]$Height,
        [string]$Text,
        [string]$BgColorName,
        [int]$FontSize = 40
    )

    $bmp = New-Object System.Drawing.Bitmap $Width, $Height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::FromName($BgColorName))

    # Fixed Font Constructor
    $fontFamily = New-Object System.Drawing.FontFamily "Arial"
    $fontStyle = [System.Drawing.FontStyle]::Bold
    $unit = [System.Drawing.GraphicsUnit]::Pixel
    $font = New-Object System.Drawing.Font $fontFamily, $FontSize, $fontStyle, $unit

    $textBrush = [System.Drawing.Brushes]::White
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center

    $rect = New-Object System.Drawing.RectangleF 0, 0, $Width, $Height
    $g.DrawString($Text, $font, $textBrush, $rect, $format)

    # Save
    $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $OutputPath"
}

# Ensure assets dir exists
$assetsDir = Join-Path $PSScriptRoot "assets"
if (!(Test-Path $assetsDir)) { New-Item -ItemType Directory -Path $assetsDir | Out-Null }

# 1. Feature Graphic (1024x500)
New-Image -OutputPath (Join-Path $assetsDir "feature_graphic.png") `
          -Width 1024 -Height 500 `
          -Text "OutWeather`nStop guessing. Start doing." `
          -BgColorName "DarkSlateGray" `
          -FontSize 40

# 2. Screenshots (1242x2208 - Standard 5.5 inch)
$screens = @(
    @{ Name="screen_1_home.png"; Text="Home Screen`n10/10 Running Score"; Color="SteelBlue" },
    @{ Name="screen_2_hourly.png"; Text="Hourly Forecast`nPrecise Weather"; Color="DimGray" },
    @{ Name="screen_3_activity.png"; Text="Activity Details`nSafe & Fun"; Color="DarkOliveGreen" },
    @{ Name="screen_4_settings.png"; Text="Dark Mode`nPremium Features"; Color="Black" }
)

foreach ($s in $screens) {
    New-Image -OutputPath (Join-Path $assetsDir $s.Name) `
              -Width 1242 -Height 2208 `
              -Text $s.Text `
              -BgColorName $s.Color `
              -FontSize 60
}
