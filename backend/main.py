
from backend.util import save_credentials, get_credentials
# Endpoint to get all usernames stored in Windows Credential Manager

from fastapi import FastAPI, HTTPException, Response
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from backend.util import connect_rdp_session # Assuming util is a module you have for handling RDP connections

app = FastAPI()
app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")

@app.get("/")
async def read_root():
    return HTMLResponse(content=open('frontend/index.html').read(), status_code=200)

import json

@app.get("/connections")
async def get_connections():
    try:
        with open('connections.json', 'r') as file:
            connections = json.load(file)
            return connections
    except FileNotFoundError:
        return []
    except Exception as e:
        print(f"Error reading connections: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/connections")
async def create_connection(connection: dict):
    try:
        # Load existing connections
        try:
            with open('connections.json', 'r') as file:
                connections = json.load(file)
        except (FileNotFoundError, json.JSONDecodeError):
            connections = []
        # Assign an id
        connection['id'] = max([c.get('id', 0) for c in connections], default=0) + 1
        connections.append(connection)
        with open('connections.json', 'w') as file:
            json.dump(connections, file)
        return {"message": "Connection created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.delete("/connections/{connection_id}")
async def delete_connection(connection_id: int):    
    try:
        with open('connections.json', 'r') as file:
            connections = json.load(file)
        # Filter out the connection to delete
        connections = [c for c in connections if c.get('id') != connection_id]
        with open('connections.json', 'w') as file:
            json.dump(connections, file)
        return {"message": "Connection deleted successfully"}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Connections file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/connections/{connection_id}")
async def update_connection(connection_id: int, connection: dict):
    try:
        with open('connections.json', 'r') as file:
            connections = json.load(file)
        # Find the connection to update
        for i, c in enumerate(connections):
            if c.get('id') == connection_id:
                connections[i] = connection
                connections[i]['id'] = connection_id  # Ensure id remains the same
                break
        else:
            raise HTTPException(status_code=404, detail="Connection not found")
        with open('connections.json', 'w') as file:
            json.dump(connections, file)
        return {"message": "Connection updated successfully"}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Connections file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.post('/connections/{connection_id}/connect')
async def connect_to_rdp(connection_id: int):
    print('connecting to rdp')
    try:
        with open('connections.json', 'r') as file:
            connections = json.load(file)
        # Find the connection to connect to
        for conn in connections:
            if conn.get('id') == connection_id:
                print(f"Connecting to {conn['ip']} as {conn['username']}")
                connect_rdp_session(conn['ip'], conn['username'])
                return {"message": f"Connecting to {conn['ip']} as {conn['username']}"}
        raise HTTPException(status_code=404, detail="Connection not found")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Connections file not found")
    except Exception as e:
        print(f"Error connecting to RDP: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/usernames")
async def get_usernames():
    import keyring.backends.Windows
    import keyring.util.platform_ as platform
    usernames = []
    # Windows Credential Manager stores credentials per service, but keyring does not provide a direct list API
    # We'll use a simple file to track usernames for dropdown
    cred_file = "usernames.json"
    try:
        with open(cred_file, "r") as f:
            usernames = json.load(f)
    except Exception:
        usernames = []
    return usernames

# Endpoint to add credentials
@app.post("/credentials")
async def add_credentials(data: dict):
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
    save_credentials(username, password)
    # Track username in file for dropdown
    cred_file = "usernames.json"
    try:
        with open(cred_file, "r") as f:
            usernames = json.load(f)
    except Exception:
        usernames = []
    if username not in usernames:
        usernames.append(username)
        with open(cred_file, "w") as f:
            json.dump(usernames, f)
    return {"message": "Credentials saved"}

# Edit credential password
@app.put("/credentials/{username}")
async def edit_credential(username: str, data: dict):
    password = data.get("password")
    if not password:
        raise HTTPException(status_code=400, detail="Password required")
    save_credentials(username, password)
    return {"message": "Password updated"}

# Delete credential
@app.delete("/credentials/{username}")
async def delete_credential(username: str):
    import keyring
    key = f"rdp_manager:{username}"
    try:
        keyring.delete_password("rdp_manager", key)
    except keyring.errors.PasswordDeleteError:
        pass
    # Remove from usernames.json
    cred_file = "usernames.json"
    try:
        with open(cred_file, "r") as f:
            usernames = json.load(f)
    except Exception:
        usernames = []
    if username in usernames:
        usernames.remove(username)
        with open(cred_file, "w") as f:
            json.dump(usernames, f)
    return {"message": "Credential deleted"}