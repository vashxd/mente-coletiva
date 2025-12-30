import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

const socket = io(URL, {
    autoConnect: false,
    reconnection: true,
});

export default socket;
