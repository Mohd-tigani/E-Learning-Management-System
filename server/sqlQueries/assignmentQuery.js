const db = require("../database/dbs")
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

async function getAssignments(req, res) {
  try {
    const courseId = req.params.course_id;

    const result = await db.query(
      `SELECT assignment_id,
              course_id,
              assignment_title,
              assignment_desc,
              due_date
       FROM   assignments
       WHERE  course_id = $1
       ORDER  BY due_date`,
      [courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No assignments found" });
    }

    const assignments = result.rows.map(function (r) {
      return {
        course_id : r.course_id,
        assignmentId:    r.assignment_id,
        assignmentTitle: r.assignment_title,
        assignmentDesc:  r.assignment_desc,
        dueDate:         r.due_date
          ? r.due_date.toISOString().slice(0, 16).replace("T", " ")
          : null
      };
    });

    res.status(200).json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}



async function getAssignmentAttachment(req, res) {
  try {
    const assignmentId = req.params.assignment_id;

    const { rows } = await db.query(
      `SELECT attachment_type, attachment_data
         FROM assignments
        WHERE assignment_id = $1`,
      [assignmentId]
    );

    if (!rows.length || !rows[0].attachment_data) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    const attachmentType = rows[0].attachment_type;
    const attachmentData = rows[0].attachment_data;

    res.set({
      "Content-Type":  attachmentType,
      "Content-Length": attachmentData.length,
      "Content-Disposition":
        `inline; filename="assignment_${assignmentId}.${attachmentType.split("/")[1] || "bin"}"`
    });

    res.status(200).send(attachmentData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

async function submitAssignment(req, res) {
    try {
        const assignmentId = req.params.assignment_id;
        const studentId = req.body.student_id; 
        const fileData = req.file.buffer;
        const fileType = req.file.mimetype;
        const fileName = req.file.originalname;

        await db.query(
            `INSERT INTO assignment_submissions 
                (assignment_id, student_id, submitted_at, file_type, file_data, file_name)
            VALUES ($1, $2, NOW(), $3, $4, $5)`,
            [assignmentId, studentId, fileType, fileData, fileName]
        );

        res.status(200).json({ message: "Assignment submitted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

async function checkSubmission(req, res) {
    const { assignment_id, student_id } = req.params;

    try {
        const result = await db.query(
            `SELECT file_name, submitted_at
             FROM assignment_submissions
             WHERE assignment_id = $1 AND student_id = $2
             ORDER BY submitted_at DESC
             LIMIT 1`,
            [assignment_id, student_id]
        );

        if (result.rows.length > 0) {
            return res.status(200).json({
                submitted: true,
                fileName: result.rows[0].file_name,
                submittedAt: result.rows[0].submitted_at,
            });
        }

        return res.status(200).json({ submitted: false });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
}



async function AssignmentSocket({ assignmentId, studentId, fileName, fileType, fileBase64, submitted_at }) {
  const buffer = Buffer.from(fileBase64, "base64");
  await db.query(
    `INSERT INTO assignment_submissions
       (assignment_id, student_id, submitted_at, file_type, file_data, file_name)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (assignment_id, student_id)
       DO UPDATE SET submitted_at = EXCLUDED.submitted_at,
                     file_type    = EXCLUDED.file_type,
                     file_data    = EXCLUDED.file_data,
                     file_name    = EXCLUDED.file_name`,
    [assignmentId, studentId, submitted_at, fileType, buffer, fileName]
  );
}



module.exports={
  getAssignmentAttachment,
  getAssignments,
  submitAssignment,
  upload,
  checkSubmission,
  AssignmentSocket
}