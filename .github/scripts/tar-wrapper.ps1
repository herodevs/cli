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

# Call the real tar with cleaned arguments
& "C:\Windows\system32\tar.exe" $cleanArgs

# Preserve the exit code from the tar command
exit $LASTEXITCODE 
