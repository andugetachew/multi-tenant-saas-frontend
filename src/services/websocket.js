class WebSocketService {
    constructor() {
        this.sockets = {};
    }

    connectNotifications(userId, onMessage) {
        if (this.sockets.notifications &&
            (this.sockets.notifications.readyState === WebSocket.OPEN ||
                this.sockets.notifications.readyState === WebSocket.CONNECTING)) {
            console.log("⚠️ Notifications socket already exists");
            return this.sockets.notifications;
        }

        const token = localStorage.getItem("access_token");
        if (!token) {
            console.warn("❌ No access token found");
            return null;
        }


        const ws = new WebSocket(
            `ws://localhost:8001/ws/notifications/?token=${token}`  // ← FIXED
        );

        ws.onopen = () => {
            console.log("✅ Notifications WebSocket connected");
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (err) {
                console.error("❌ Invalid notification message:", event.data);
            }
        };

        ws.onerror = (error) => {
            console.error("❌ Notifications WebSocket error:", error);
        };

        ws.onclose = (event) => {
            console.log(`⚠️ Notifications socket closed: code=${event.code}`);
            delete this.sockets.notifications;

            if (event.code === 4001) {
                console.warn("❌ Authentication failed");
                return;
            }

            const latestToken = localStorage.getItem("access_token");
            if (latestToken) {
                setTimeout(() => {
                    this.connectNotifications(userId, onMessage);
                }, 3000);
            }
        };

        this.sockets.notifications = ws;
        return ws;
    }

    connectComments(projectId, onNewComment) {
        const key = `comments_${projectId}`;

        if (this.sockets[key] &&
            (this.sockets[key].readyState === WebSocket.OPEN ||
                this.sockets[key].readyState === WebSocket.CONNECTING)) {
            console.log("⚠️ Comments socket already exists");
            return this.sockets[key];
        }

        // FIX: Change port from 8000 to 8001
        const ws = new WebSocket(
            `ws://localhost:8001/ws/comments/${projectId}/`  // ← FIXED
        );

        ws.onopen = () => {
            console.log(`✅ Comments connected: ${projectId}`);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "new_comment") {
                    onNewComment(data.comment);
                }
            } catch (err) {
                console.error("❌ Invalid comment message:", event.data);
            }
        };

        ws.onerror = (error) => {
            console.error("❌ Comments WebSocket error:", error);
        };

        ws.onclose = () => {
            console.log(`⚠️ Comments socket closed: ${projectId}`);
            delete this.sockets[key];
        };

        this.sockets[key] = ws;
        return ws;
    }

    connectTasks(projectId, onTaskUpdate) {
        const key = `tasks_${projectId}`;

        if (this.sockets[key] &&
            (this.sockets[key].readyState === WebSocket.OPEN ||
                this.sockets[key].readyState === WebSocket.CONNECTING)) {
            console.log("⚠️ Tasks socket already exists");
            return this.sockets[key];
        }

        // FIX: Change port from 8000 to 8001
        const ws = new WebSocket(
            `ws://localhost:8001/ws/tasks/${projectId}/`  // ← FIXED
        );

        ws.onopen = () => {
            console.log(`✅ Tasks connected: ${projectId}`);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "task_updated") {
                    onTaskUpdate(data.task);
                }
            } catch (err) {
                console.error("❌ Invalid task message:", event.data);
            }
        };

        ws.onerror = (error) => {
            console.error("❌ Tasks WebSocket error:", error);
        };

        ws.onclose = () => {
            console.log(`⚠️ Tasks socket closed: ${projectId}`);
            delete this.sockets[key];
        };

        this.sockets[key] = ws;
        return ws;
    }

    sendTaskUpdate(projectId, taskId, status) {
        const key = `tasks_${projectId}`;
        const ws = this.sockets[key];

        if (!ws) {
            console.warn("⚠️ No task socket found");
            return;
        }

        if (ws.readyState !== WebSocket.OPEN) {
            console.warn("⚠️ Task socket is not open");
            return;
        }

        ws.send(JSON.stringify({
            type: "task_update",
            task_id: taskId,
            status: status,
        }));
    }

    disconnect(room) {
        if (this.sockets[room]) {
            this.sockets[room].close();
            delete this.sockets[room];
        }
    }

    disconnectAll() {
        Object.keys(this.sockets).forEach((key) => {
            this.sockets[key].close();
            delete this.sockets[key];
        });
    }
}

const websocketService = new WebSocketService();
export default websocketService;