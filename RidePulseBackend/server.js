const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Store active lobbies and rides
const lobbies = {}; // { code: { hostId, riders: [] } }
const activeRides = {}; // { code: { startTime, riders: [{ id, lat, lon, speed }] } }

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // --- LOBBY EVENTS ---

    socket.on('create_lobby', (data) => {
        // data: { hostName, bike }
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        lobbies[code] = {
            hostId: socket.id,
            hostName: data.hostName,
            riders: [{
                id: socket.id,
                name: data.hostName,
                bike: data.bike,
                isHost: true,
                avatar: 'helmet-safety'
            }]
        };

        socket.join(code);
        socket.emit('lobby_created', { code, riders: lobbies[code].riders });
        console.log(`Lobby ${code} created by ${data.hostName}`);
    });

    socket.on('join_lobby', (data) => {
        // data: { code, userName, bike }
        const { code, userName, bike } = data;
        const lobby = lobbies[code];

        if (lobby) {
            const newRider = {
                id: socket.id,
                name: userName,
                bike: bike,
                isHost: false,
                avatar: 'user'
            };

            lobby.riders.push(newRider);
            socket.join(code);

            // Notify everyone in the room
            io.to(code).emit('rider_joined', lobby.riders);
            socket.emit('join_success', { code, riders: lobby.riders });
            console.log(`${userName} joined lobby ${code}`);
        } else {
            socket.emit('error', { message: 'Lobby not found' });
        }
    });

    // --- RIDE EVENTS ---

    socket.on('start_ride', (code) => {
        if (lobbies[code] && lobbies[code].hostId === socket.id) {
            activeRides[code] = {
                startTime: Date.now(),
                riders: lobbies[code].riders.map(r => ({ ...r, lat: 0, lon: 0, speed: 0 }))
            };

            io.to(code).emit('ride_started');
            console.log(`Ride started for lobby ${code}`);
        }
    });

    socket.on('update_location', (data) => {
        // data: { code, lat, lon, speed }
        const { code, lat, lon, speed } = data;

        // Broadcast location to others in the ride/lobby
        socket.to(code).emit('rider_location_update', {
            id: socket.id,
            lat,
            lon,
            speed
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Cleanup logic (remove from lobbies/rides) would go here
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`RidePulse Backend listening on port ${PORT}`);
});
