const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 정적 파일 제공
app.use(express.static('public'));

// 경로별로 HTML 파일 제공
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // 기존 인터페이스
});

app.get('/piano', (req, res) => {
    res.sendFile(path.join(__dirname, 'piano.html')); // 피아노 인터페이스
});

app.get('/developer', (req, res) => {
    res.sendFile(path.join(__dirname, 'developer.html')); // 개발자 전용 인터페이스
});

// 클라이언트 관리
let maxClients = []; // Max 패치 클라이언트 목록
let browserClients = []; // 브라우저 클라이언트 목록
let devClients = []; // 개발자 UI 클라이언트 목록

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
        } else if (type === 'developer') {
            devClients.push(socket);
            socket.type = 'developer';
            console.log('Developer UI client connected');
        } else {
            console.log('Unknown client type');
        }

        // 클라이언트 수 업데이트 (개발자 클라이언트에게만 전송)
        devClients.forEach((devSocket) => {
            devSocket.emit('updateClientCount', {
                max: maxClients.length,
                browser: browserClients.length,
                developer: devClients.length,
            });
        });
    });

    // 메시지 처리
    socket.on('message', (data) => {
        console.log(`Received message from ${socket.type}:`, data);

        // 개발자 전용 메시지 처리
        if (socket.type === 'developer') {
            // 개발자 메시지를 Max 클라이언트에게 전달
            maxClients.forEach((maxSocket) => {
                maxSocket.emit('message', data);
            });
        }

        // 브라우저 클라이언트 메시지 처리
        if (socket.type === 'browser') {
            // 브라우저 메시지를 Max 클라이언트에게 전달
            maxClients.forEach((maxSocket) => {
                maxSocket.emit('message', data);
            });
        }
    });

    // 클라이언트 연결 해제 처리
    socket.on('disconnect', () => {
        console.log('A user disconnected');
        if (socket.type === 'max') {
            maxClients = maxClients.filter((maxSocket) => maxSocket !== socket);
        } else if (socket.type === 'browser') {
            browserClients = browserClients.filter(
                (browserSocket) => browserSocket !== socket
            );
        } else if (socket.type === 'developer') {
            devClients = devClients.filter((devSocket) => devSocket !== socket);
        }

        // 클라이언트 수 업데이트 (개발자 클라이언트에게만 전송)
        devClients.forEach((devSocket) => {
            devSocket.emit('updateClientCount', {
                max: maxClients.length,
                browser: browserClients.length,
                developer: devClients.length,
            });
        });
    });
});

// 서버 실행
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
