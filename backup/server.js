const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 정적 파일 제공
app.use(express.static('public'));

// 클라이언트 관리
let maxClients = []; // 맥스 패치 클라이언트 목록
let browserClients = []; // 브라우저 클라이언트 목록

// WebSocket 연결 처리
io.on('connection', (socket) => {
    console.log('A user connected');

    // 클라이언트 종류 식별
    socket.on('identify', (type) => {
        if (type === 'max') {
            maxClients.push(socket);
            socket.type = 'max';
            console.log('Max client connected');
        } else if (type === 'browser') {
            browserClients.push(socket);
            socket.type = 'browser';
            console.log('Browser client connected');
        } else {
            console.log('Unknown client type');
        }
    });

    // 메시지 처리
    socket.on('message', (data) => {
        console.log(`Received message from ${socket.type}:`, data);

        // 브라우저 클라이언트에서 온 메시지만 맥스 패치로 전송
        if (socket.type === 'browser') {
            maxClients.forEach((maxSocket) => {
                maxSocket.emit('message', data);
            });
        }
    });

    // 클라이언트 연결 해제 처리
    socket.on('disconnect', () => {
        console.log('A user disconnected');
        // 연결 해제 시 목록에서 제거
        if (socket.type === 'max') {
            maxClients = maxClients.filter((maxSocket) => maxSocket !== socket);
        } else if (socket.type === 'browser') {
            browserClients = browserClients.filter(
                (browserSocket) => browserSocket !== socket
            );
        }
    });
});

// 서버 실행
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
