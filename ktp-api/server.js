const express = require("express");
const cors = require("cors");
require("dotenv").config();
const membersRoutes = require("./routes/members");
const photosRoutes = require("./routes/photos");
const eventsRoutes = require("./routes/events");
const usersRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
// TODO: Re-enable messages when message model/controller logic is ready.
// const messagesRoutes = require("./routes/messages");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// TODO: Add shared middleware, request logging, or validation here.

app.get("/", (req, res) => {
  res.json({ message: "KTP API is running" });
});

// Register routes
app.use("/members", membersRoutes);
app.use("/photos", photosRoutes);
app.use("/events", eventsRoutes);
app.use("/users", usersRoutes);
app.use("/admin", adminRoutes);
// TODO: Re-enable messages when needed.
// app.use("/messages", messagesRoutes);

app.listen(PORT, () => {
  console.log(`KTP API server running on port ${PORT}`);
});
