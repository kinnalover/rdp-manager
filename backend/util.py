import pyautogui
import pygetwindow as gw
import subprocess
import os
import tempfile
import keyring
import time
import ctypes

def save_credentials(username, password):
    # Store password in Windows Credential Manager by username only
    key = f"rdp_manager:{username}"
    keyring.set_password("rdp_manager", key, password)

def get_credentials(username):
    key = f"rdp_manager:{username}"
    return keyring.get_password("rdp_manager", key)

def activate_window(wnd):
    for _ in range(3):
        try:
            wnd.minimize()
            wnd.restore()
            wnd.activate()
        except Exception as ex:
            print(f"Failed to activate window: {ex}")
            time.sleep(3)
        if wnd.isActive:
            return True
    return False

def disable_capslock():
    # Only works on Windows
    VK_CAPITAL = 0x14
    # Get current state
    caps_state = ctypes.windll.user32.GetKeyState(VK_CAPITAL)
    if caps_state & 1:
        # If enabled, send capslock key to disable
        pyautogui.press('capslock')

def connect_rdp_session(ip, username):
    try:
        # Retrieve password from Windows Credential Manager
        password = get_credentials(username)
        with tempfile.NamedTemporaryFile(delete=False, suffix='.rdp', mode='w') as rdp_file:
            rdp_file.write(f"full address:s:{ip}\nusername:s:{username}\nauthentication level:i:0\n")
            rdp_path = rdp_file.name
        proc = subprocess.Popen(["mstsc.exe", rdp_path])
        time.sleep(3)
       
        rdp_windows = [w for w in gw.getWindowsWithTitle(ip)]
        if not rdp_windows:
            rdp_windows = [w for w in gw.getWindowsWithTitle("Remote Desktop Connection")]
        if not rdp_windows:
            rdp_windows = [w for w in gw.getWindowsWithTitle("Безопасность Windows")]
        if rdp_windows and password:
            win = rdp_windows[0]
            activated = activate_window(win)
            if not activated:
                raise Exception("window is not active somehow")
            disable_capslock()
            time.sleep(0.5)
            pyautogui.write(password, interval=0.05)
            pyautogui.press('enter')
        else:
            print("RDP window not found for password automation or password missing.")
    except Exception as e:
        print(f"Error launching RDP connection: {str(e)}")
        raise Exception(f"Failed to connect to RDP: {str(e)}")
    return f"Connecting to {ip} as {username}"
    