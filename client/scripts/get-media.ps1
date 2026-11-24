try {
    Add-Type -AssemblyName System.Runtime.WindowsRuntime -ErrorAction Stop
    $asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
        $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1
    } | Select-Object -First 1

    function Await-AsyncOp($asyncOp, $type) {
        $method = $asTaskGeneric.MakeGenericMethod($type)
        $task = $method.Invoke($null, @($asyncOp))
        $task.Wait()
        return $task.Result
    }

    [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media,ContentType=WindowsRuntime] | Out-Null
    $managerAsync = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()
    $manager = Await-AsyncOp $managerAsync ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])

    if (-not $manager) {
        [PSCustomObject]@{
            title = ""
            artist = ""
            album = ""
            playbackStatus = "NoActiveSession"
            sourceAppId = $null
            sessions = @()
            activeSessionIndex = 0
        } | ConvertTo-Json -Compress
        exit 0
    }

    $rawSessions = $manager.GetSessions()
    $sessionList = @()
    $activeIdx = 0
    $idx = 0

    if ($rawSessions) {
        foreach ($s in $rawSessions) {
            try {
                $propsAsync = $s.TryGetMediaPropertiesAsync()
                $props = Await-AsyncOp $propsAsync ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
                $info = $s.GetPlaybackInfo()

                $statusStr = "Stopped"
                if ($info -and $info.PlaybackStatus) {
                    $statusStr = $info.PlaybackStatus.ToString()
                }

                $title = if ($props.Title) { $props.Title.Trim() } else { "" }
                $artist = if ($props.Artist) { $props.Artist.Trim() } else { "" }
                $album = if ($props.AlbumTitle) { $props.AlbumTitle.Trim() } else { "" }

                # Format sourceAppId cleanly (e.g. "Google Chrome", "Spotify", etc.)
                $appDisplay = $s.SourceAppId
                if ($appDisplay) {
                    if ($appDisplay -match "chrome") { $appDisplay = "Chrome" }
                    elseif ($appDisplay -match "msedge") { $appDisplay = "Edge" }
                    elseif ($appDisplay -match "spotify") { $appDisplay = "Spotify" }
                } else {
                    $appDisplay = "Windows Media"
                }

                if ($title -or $artist) {
                    $sessionItem = [PSCustomObject]@{
                        index = $idx
                        title = $title
                        artist = $artist
                        album = $album
                        playbackStatus = $statusStr
                        sourceAppId = $appDisplay
                    }
                    $sessionList += $sessionItem

                    # Mark playing session as active default
                    if ($statusStr -eq "Playing") {
                        $activeIdx = $idx
                    }
                    $idx++
                }
            } catch {}
        }
    }

    # Primary media info is the active session (or first)
    $primary = if ($sessionList.Count -gt 0) { $sessionList[$activeIdx] } else { $null }

    [PSCustomObject]@{
        title = if ($primary) { $primary.title } else { "" }
        artist = if ($primary) { $primary.artist } else { "" }
        album = if ($primary) { $primary.album } else { "" }
        playbackStatus = if ($primary) { $primary.playbackStatus } else { "NoActiveSession" }
        sourceAppId = if ($primary) { $primary.sourceAppId } else { $null }
        sessions = $sessionList
        activeSessionIndex = $activeIdx
    } | ConvertTo-Json -Depth 3 -Compress
} catch {
    [PSCustomObject]@{
        title = ""
        artist = ""
        album = ""
        playbackStatus = "Stopped"
        error = $_.Exception.Message
        sessions = @()
        activeSessionIndex = 0
    } | ConvertTo-Json -Compress
}
