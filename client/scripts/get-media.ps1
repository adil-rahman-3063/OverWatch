try {
    Add-Type -AssemblyName System.Runtime.WindowsRuntime -ErrorAction Stop
    $asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
        $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
    }

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
        } | ConvertTo-Json -Compress
        exit 0
    }

    # 1. Inspect all sessions to find the currently active/playing one
    $sessions = $manager.GetSessions()
    $targetSession = $null

    if ($sessions -and $sessions.Count -gt 0) {
        # Prioritize any session actively Playing
        foreach ($s in $sessions) {
            $info = $s.GetPlaybackInfo()
            if ($info -and $info.PlaybackStatus -eq [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionPlaybackStatus]::Playing) {
                $targetSession = $s
                break
            }
        }

        # Fallback to current session from manager if not found
        if (-not $targetSession) {
            $curr = $manager.GetCurrentSession()
            if ($curr) {
                $targetSession = $curr
            } else {
                # Fallback to the first session in list
                $targetSession = $sessions[0]
            }
        }
    } else {
        $targetSession = $manager.GetCurrentSession()
    }

    if ($targetSession) {
        $propsAsync = $targetSession.TryGetMediaPropertiesAsync()
        $props = Await-AsyncOp $propsAsync ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
        $playbackInfo = $targetSession.GetPlaybackInfo()

        $statusStr = "Stopped"
        if ($playbackInfo) {
            $statusStr = $playbackInfo.PlaybackStatus.ToString()
        }

        [PSCustomObject]@{
            title = if ($props.Title) { $props.Title } else { "" }
            artist = if ($props.Artist) { $props.Artist } else { "" }
            album = if ($props.AlbumTitle) { $props.AlbumTitle } else { "" }
            playbackStatus = $statusStr
            sourceAppId = $targetSession.SourceAppId
        } | ConvertTo-Json -Compress
    } else {
        [PSCustomObject]@{
            title = ""
            artist = ""
            album = ""
            playbackStatus = "NoActiveSession"
            sourceAppId = $null
        } | ConvertTo-Json -Compress
    }
} catch {
    [PSCustomObject]@{
        title = ""
        artist = ""
        album = ""
        playbackStatus = "Stopped"
        error = $_.Exception.Message
    } | ConvertTo-Json -Compress
}
