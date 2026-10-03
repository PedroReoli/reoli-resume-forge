!include "WinMessages.nsh"

Function AddInstallDirToPath
  ReadRegStr $0 HKCU "Environment" "Path"
  StrCpy $1 ";$0;"
  StrCpy $2 ";$INSTDIR;"
  StrLen $3 $2
  StrCpy $4 0

  reoli_path_add_search:
    StrCpy $5 $1 $3 $4
    StrCmp $5 $2 reoli_path_add_done
    StrCmp $5 "" reoli_path_add_write
    IntOp $4 $4 + 1
    Goto reoli_path_add_search

  reoli_path_add_write:
    StrCmp $0 "" reoli_path_add_first reoli_path_add_append

  reoli_path_add_first:
    WriteRegExpandStr HKCU "Environment" "Path" "$INSTDIR"
    Goto reoli_path_add_broadcast

  reoli_path_add_append:
    WriteRegExpandStr HKCU "Environment" "Path" "$0;$INSTDIR"

  reoli_path_add_broadcast:
    SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=5000

  reoli_path_add_done:
FunctionEnd

Function un.RemoveInstallDirFromPath
  ReadRegStr $0 HKCU "Environment" "Path"
  StrCmp $0 "" reoli_path_remove_done
  StrCpy $1 ";$0;"
  StrCpy $2 ";$INSTDIR;"
  StrLen $3 $2
  StrCpy $4 0

  reoli_path_remove_search:
    StrCpy $5 $1 $3 $4
    StrCmp $5 $2 reoli_path_remove_found
    StrCmp $5 "" reoli_path_remove_done
    IntOp $4 $4 + 1
    Goto reoli_path_remove_search

  reoli_path_remove_found:
    StrCpy $6 $1 $4
    IntOp $7 $4 + $3
    StrCpy $8 $1 "" $7
    StrCpy $9 "$6;$8"
    StrCmp $9 ";" reoli_path_remove_empty
    StrCpy $9 $9 "" 1
    StrLen $6 $9
    IntOp $6 $6 - 1
    StrCpy $9 $9 $6
    WriteRegExpandStr HKCU "Environment" "Path" "$9"
    Goto reoli_path_remove_broadcast

  reoli_path_remove_empty:
    DeleteRegValue HKCU "Environment" "Path"

  reoli_path_remove_broadcast:
    SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=5000

  reoli_path_remove_done:
FunctionEnd

!macro NSIS_HOOK_POSTINSTALL
  Call AddInstallDirToPath
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  Call un.RemoveInstallDirFromPath
!macroend
