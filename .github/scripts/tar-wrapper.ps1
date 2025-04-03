# tar-wrapper.ps1
# This script intercepts tar commands and removes the --force-local flag
# This is needed because oclif pack adds --force-local on Windows, but Windows' native tar
# doesn't support this flag. See https://github.com/oclif/oclif/issues/1525 for details.

param (
    [Parameter(ValueFromRemainingArguments=$true)]
    $args
)

# Process arguments and remove --force-local if present
$cleanArgs = @()
foreach ($arg in $args) {
    if ($arg -ne "--force-local") {
        $cleanArgs += $arg
    }
}

# Find the real tar executable
try {
    $tarPath = (Get-Command tar.exe -ErrorAction Stop).Path
} catch {
    Write-Error "Could not find tar.exe in PATH. Error: $_"
    exit 1
}

Write-Host "Using tar from: $tarPath"
Write-Host "Running command: $tarPath $cleanArgs"

# Call the real tar with cleaned arguments
& $tarPath $cleanArgs

# Preserve the exit code from the tar command
$exitCode = $LASTEXITCODE
Write-Host "tar exited with code: $exitCode"
exit $exitCode 
