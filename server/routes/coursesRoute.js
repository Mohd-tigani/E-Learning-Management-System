const {Router} = require("express")
const router = Router()

const courseQuery = require("../sqlQueries/courseQuery")

router.get("/courses",courseQuery.getCourseList)

router.get("/courseData/:module_id",courseQuery.courseData)


module.exports=router