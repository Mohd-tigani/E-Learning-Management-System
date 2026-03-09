const {Router} = require("express")
const route = Router();

const quizQuery = require("../sqlQueries/quizQuery")

route.get("/quiz_questions/:quiz_id",quizQuery.quizQuestions)

route.post("/quiz_submission",quizQuery.quizSubmission)

route.get("/quizzes/:course_id",quizQuery.quizData)

module.exports=route