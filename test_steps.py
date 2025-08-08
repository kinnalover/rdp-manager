import subprocess
def connect_to_rdp(ip, username, password):
    subprocess.run(["cmdkey", "/add:", ip, "/user:", username, "/pass:", password])

    # Подключение к RDP
    subprocess.run(["mstsc", f"/v:{ip}"])

if __name__ == '__main__':
    ip = 'robo-1a-0030'
    username= 'rpa_128'
    password = ''
    connect_to_rdp(ip, username, password)