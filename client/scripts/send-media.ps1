param(
    [string]$Action = "play_pause",
    [int]$SessionIndex = -1
)

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

    # Global Key Helper for master volume fallback
    if (-not ([System.Management.Automation.PSTypeName]'OverWatchMediaKey').Type) {
        Add-Type -TypeDefinition @"
        using System;
        using System.Runtime.InteropServices;
        public class OverWatchMediaKey {
            [DllImport("user32.dll")]
            public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
            public static void PressKey(byte vk) {
                keybd_event(vk, 0, 0, UIntPtr.Zero);
                keybd_event(vk, 0, 2, UIntPtr.Zero);
            }
        }
"@
    }

    # Volume commands are system-wide master volume
    if ($Action -eq "volume_up") {
        [OverWatchMediaKey]::PressKey(0xAF)
        Write-Host "Volume Up dispatched"
        exit 0
    } elseif ($Action -eq "volume_down") {
        [OverWatchMediaKey]::PressKey(0xAE)
        Write-Host "Volume Down dispatched"
        exit 0
    } elseif ($Action -eq "volume_mute") {
        [OverWatchMediaKey]::PressKey(0xAD)
        Write-Host "Volume Mute dispatched"
        exit 0
    }

    # Transport commands: Target the specific WinRT session directly!
    [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media,ContentType=WindowsRuntime] | Out-Null
    $managerAsync = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()
    $manager = Await-AsyncOp $managerAsync ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])

    $sessions = @($manager.GetSessions())
    $target = $null

    if ($SessionIndex -ge 0 -and $SessionIndex -lt $sessions.Length) {
        $target = $sessions[$SessionIndex]
    } elseif ($sessions.Length -gt 0) {
        foreach ($s in $sessions) {
            $info = $s.GetPlaybackInfo()
            if ($info -and $info.PlaybackStatus -eq [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionPlaybackStatus]::Playing) {
                $target = $s
                break
            }
        }
        if (-not $target) { $target = $sessions[0] }
    } else {
        $target = $manager.GetCurrentSession()
    }

    if ($target) {
        $op = $null
        if ($Action -eq "play_pause") {
            $op = $target.TryTogglePlayPauseAsync()
        } elseif ($Action -eq "play") {
            $op = $target.TryPlayAsync()
        } elseif ($Action -eq "pause") {
            $op = $target.TryPauseAsync()
        } elseif ($Action -eq "next") {
            $op = $target.TrySkipNextAsync()
        } elseif ($Action -eq "prev") {
            $op = $target.TrySkipPreviousAsync()
        } elseif ($Action -eq "stop") {
            $op = $target.TryStopAsync()
        }

        if ($op) {
            $res = Await-AsyncOp $op ([System.Boolean])
            Write-Host "Targeted WinRT Session [Index $SessionIndex] Action [$Action] -> Result: $res"
            exit 0
        }
    }

    # Fallback to generic keybd_event if target session was not found
    $vkMap = @{
        "play_pause" = [byte]0xB3
        "next"       = [byte]0xB0
        "prev"       = [byte]0xB1
        "stop"       = [byte]0xB2
    }
    if ($vkMap.ContainsKey($Action)) {
        [OverWatchMediaKey]::PressKey($vkMap[$Action])
        Write-Host "Fallback KeybdEvent dispatched for $Action"
    }
} catch {
    Write-Error $_.Exception.Message
}
