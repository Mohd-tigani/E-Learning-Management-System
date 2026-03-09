const {Router} = require("express")
const lectureQuery = require("../sqlQueries/lectureQuery")
const route = Router()


route.get("/lectures/:module_id",lectureQuery.getLectures)

route.get("/attachment/:lecture_id",lectureQuery.getLectureAttachment)

module.exports=route