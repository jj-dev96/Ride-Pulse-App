import io from 'socket.io-client';

// 10.0.2.2 is the special IP for 'localhost' when running in Android Emulator
const SOCKET_URL = 'http://10.0.2.2:3000';

class SocketService {
    socket = null;

    connect() {
        try {
            console.log('Attempting to connect to socket backend...');
            this.socket = io(SOCKET_URL);

            this.socket.on('connect', () => {
                console.log('Connected to Backend:', this.socket.id);
            });

            this.socket.on('connect_error', (err) => {
                console.log('Socket Connection Error:', err);
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from Backend');
            });
        } catch (error) {
            console.log('Socket Init Error:', error);
        }
    }

    createLobby(hostName, bike) {
        if (this.socket) this.socket.emit('create_lobby', { hostName, bike });
    }

    joinLobby(code, userName, bike) {
        if (this.socket) this.socket.emit('join_lobby', { code, userName, bike });
    }

    startRide(code) {
        if (this.socket) this.socket.emit('start_ride', code);
    }

    updateLocation(data) {
        if (this.socket) this.socket.emit('update_location', data);
    }

    on(event, callback) {
        if (this.socket) this.socket.on(event, callback);
    }

    off(event) {
        if (this.socket) this.socket.off(event);
    }
}

export default new SocketService();
