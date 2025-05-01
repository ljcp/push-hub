require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const aedes = require('aedes')();
const net = require('net');
const { sendNotification, shutdownProvider } = require('./service');

// Express HTTP Server
const app = express();
app.use(bodyParser.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Send via HTTP
app.post('/send', async (req, res) => {
  const { deviceTokens, notification } = req.body;
  if (!deviceTokens || !notification) {
    return res.status(400).json({ error: 'deviceTokens and notification required' });
  }
  try {
    const result = await sendNotification(deviceTokens, notification);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Shutdown via HTTP
app.post('/shutdown', (req, res) => {
  shutdownProvider();
  res.json({ status: 'shutdown' });
});

// Start HTTP server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`push-hub HTTP listening on ${PORT}`));

// Embedded MQTT Broker Setup
const MQTT_PORT = process.env.MQTT_PORT || 1883;
const mqttServer = net.createServer(aedes.handle);
mqttServer.listen(MQTT_PORT, () => {
  console.log(`push-hub MQTT broker listening on ${MQTT_PORT}`);
});

// Handle incoming MQTT publish events
aedes.on('publish', async (packet, client) => {
  // Only handle client-originated messages
  if (!client) return;
  const topic = packet.topic;
  const payload = packet.payload.toString();
  const replyTopic = `${topic}/response`;

  try {
    if (topic === 'push-hub/send') {
      const { deviceTokens, notification } = JSON.parse(payload);
      const result = await sendNotification(deviceTokens, notification);
      aedes.publish({ topic: replyTopic, payload: JSON.stringify(result) });
    } else if (topic === 'push-hub/shutdown') {
      shutdownProvider();
      aedes.publish({ topic: replyTopic, payload: JSON.stringify({ status: 'shutdown' }) });
    }
  } catch (err) {
    aedes.publish({ topic: 'push-hub/error', payload: JSON.stringify({ error: err.message }) });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  shutdownProvider();
  mqttServer.close(() => process.exit());
});