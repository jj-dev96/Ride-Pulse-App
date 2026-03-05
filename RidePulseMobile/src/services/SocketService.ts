import { io, Socket } from 'socket.io-client';

// 10.0.2.2 is the special IP for 'localhost' when running in Android Emulator
const SOCKET_URL = 'http://10.0.2.2:3000';

interface LocationData {
    groupId?: string;
    userId?: string;
    latitude?: number;
    longitude?: number;
    [key: string]: unknown;
}

class SocketService {
    socket: Socket | null = null;

    connect(): void {
        try {
            console.log('Attempting to connect to socket backend...');
            this.socket = io(SOCKET_URL);

            this.socket.on('connect', () => {
                console.log('Connected to Backend:', this.socket?.id);
            });

            this.socket.on('connect_error', (err: Error) => {
                console.log('Socket Connection Error:', err);
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from Backend');
            });
        } catch (error) {
            console.log('Socket Init Error:', error);
        }
    }

    createLobby(hostName: string, bike: string): void {
        if (this.socket) this.socket.emit('create_lobby', { hostName, bike });
    }

    joinLobby(code: string, userName: string, bike: string): void {
        if (this.socket) this.socket.emit('join_lobby', { code, userName, bike });
    }

    startRide(code: string): void {
        if (this.socket) this.socket.emit('start_ride', code);
    }

    updateLocation(data: LocationData): void {
        if (this.socket) this.socket.emit('update_location', data);
    }

    on(event: string, callback: (...args: unknown[]) => void): void {
        if (this.socket) this.socket.on(event, callback);
    }

    off(event: string): void {
        if (this.socket) this.socket.off(event);
    }
}

export default new SocketService();
