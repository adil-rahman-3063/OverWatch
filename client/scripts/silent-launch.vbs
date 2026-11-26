Set objShell = CreateObject("WScript.Shell")
If WScript.Arguments.Count > 0 Then
    strScript = WScript.Arguments(0)
    strCmd = "powershell.exe -STA -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & strScript & """"
    objShell.Run strCmd, 0, False
End If
