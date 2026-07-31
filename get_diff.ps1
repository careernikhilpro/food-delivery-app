$lines = Get-Content 'C:\Users\Nikhil Raj\.gemini\antigravity\brain\a364ffe7-96c6-4397-95b4-65123e52d130\.system_generated\logs\transcript.jsonl'
foreach ($line in $lines) {
    if ($line -match "The following changes were made by the multi_replace_file_content tool to: D:\\\\swaddo-main\\\\swaddo-main\\\\swaddo-customer-app\\\\src\\\\app\\\\cart\\\\page.tsx") {
        $obj = $line | ConvertFrom-Json
        if ($obj.tool_calls[0].response.output) {
            Write-Output "FOUND DIFF:"
            Write-Output $obj.tool_calls[0].response.output
        }
    }
}
