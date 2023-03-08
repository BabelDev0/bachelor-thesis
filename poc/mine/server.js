import { Server } from 'socket.io';
import * as http from 'http';

// create a server instance and wrap it with the socket.io server
const server = http.createServer();
const io = new Server(server);

// listen for the 'connection' event
io.on('connection', (socket) => {
	console.log('a user connected');

	// listen for the 'register' event
	socket.on('register', (data) => {
		console.log(`Received registration data: ${data}`);
		registration(data);
	});

	socket.on('interaction', (data) => {
		console.log(`Received interaction data: ${data}`);
	});
});

// start listening on port 3000
server.listen(3000, () => {
	console.log('Server started on port 3000');
});

function registration(data) {
	console.log('data');
}
