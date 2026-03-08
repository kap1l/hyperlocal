
# Function to convert image to PNG
function Convert-ToPng {
    param (
        [string]$FilePath
    )

    if (Test-Path $FilePath) {
        Write-Host "Converting $FilePath to real PNG..."
        try {
            Add-Type -AssemblyName System.Drawing
            $image = [System.Drawing.Image]::FromFile($FilePath)
            $tempPath = $FilePath + ".tmp.png"
            $image.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
            $image.Dispose()
            
            Remove-Item $FilePath -Force
            Rename-Item $tempPath $FilePath
            Write-Host "Success: $FilePath converted."
        } catch {
            Write-Error "Failed to convert $FilePath : $_"
        }
    } else {
        Write-Warning "File not found: $FilePath"
    }
}

# Convert the problematic assets
Convert-ToPng "c:\Users\kapil\Documents\python\antigravity\hyperlocal\assets\icon.png"
Convert-ToPng "c:\Users\kapil\Documents\python\antigravity\hyperlocal\assets\adaptive-icon.png"
Convert-ToPng "c:\Users\kapil\Documents\python\antigravity\hyperlocal\assets\splash.png"
