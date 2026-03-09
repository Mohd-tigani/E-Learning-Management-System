const {Router} = require("express")
const router = Router()

const assignmentQuery = require("../sqlQueries/assignmentQuery")

router.get("/assignments/:course_id", assignmentQuery.getAssignments);
router.get("/assignmentAttachment/:assignment_id", assignmentQuery.getAssignmentAttachment);

router.post("/submitAssignment/:assignment_id",assignmentQuery.upload.single("submission"),assignmentQuery.submitAssignment);

router.get("/checkSubmission/:assignment_id/:student_id", assignmentQuery.checkSubmission);


module.exports=router
