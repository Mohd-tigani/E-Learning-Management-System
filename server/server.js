const express = require('express');
const path = require("path")
const cors = require("cors")
// const query = require("./database/query.js")
const cookieParser = require("cookie-parser");
const http = require('http');
const { Server } = require('socket.io');

require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const app = express();
const server = http.createServer(app);   // wrap Express
const io = new Server(server, {      //Socket.IO instance
    cors: {
        origin: ['http://localhost:5173'],
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
const PORT = process.env.PORT

//allows application to accept json format
app.use(express.json());
app.use(express.urlencoded());
//allows server to read incoming cookies requests
app.use(cookieParser())


const courseRoute = require("./routes/coursesRoute.js")
const quizRoute = require("./routes/quizRoute.js")
const lectureRoute = require("./routes/lectureRoute.js")
const assignmentRoute = require("./routes/assignmentRoute.js")

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:4173"],
    methods: ['GET', 'POST'],
    credentials: true //allows cookie requests
}))

app.get("/", function (req, res) {
    res.status(200).send("connected");
})

//course route
app.use(courseRoute)

//quizzes route
app.use(quizRoute)


// lecture route
app.use(lectureRoute)

//assignment route
app.use(assignmentRoute)

//SQL function
const { socketSubmission } = require("./sqlQueries/quizQuery");  

io.on("connection", socket => { //listen to incoming socket
  socket.on("quiz-submit", async (data, ack) => {
    //when client emit quiz-submit
    try {
      console.log("quiz-submit from", data.studentId);   
      await socketSubmission(data);                       
      console.log("DB saved, sending ACK");              
      ack({ ok: true });    // ack successfull from client                  
    } catch (e) {
      console.error("save failed:", e);
      ack({ ok: false });  // ack failed, retry
    }
  });
});


const { AssignmentSocket } = require("./sqlQueries/assignmentQuery");

io.on("connection", socket => {

  socket.on("assignment-submit", async (data, ack) => {
    try {
      console.log("assignment-submit received:", data);
      await AssignmentSocket(data);  
      ack({ ok: true });              
    } catch (err) {
      console.error("assignment-submit failed:", err);
      ack({ ok: false });
    }
  });
});



server.listen(PORT, () => {
    console.log('API + Socket.IO running on http://localhost:' + PORT);
});

// app.listen(PORT,()=>{
//     console.log("Server running on http://localhost:"+PORT)
// })

