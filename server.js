const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 정적 파일 제공
app.use(express.static('public'));

// WebSocket 연결 처리
io.on('connection', (socket) => {
    console.log('A user connected');

    // 클라이언트에서 메시지 수신
    socket.on('message', (data) => {
        console.log('Received message:', data);

        // 모든 클라이언트로 메시지 브로드캐스트
        io.emit('message', data);
    });

    // 클라이언트 연결 해제
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// 서버 실행
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
