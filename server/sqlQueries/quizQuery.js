const db = require("../database/dbs")

async function quizData(req, res) {
  try {

    // const { course_id } = req.query;

    const quizData = await db.query(
      "SELECT * FROM quizzes WHERE course_id=$1",
      [req.params.course_id]
    )

    if (quizData.rows.length === 0) {
      return res.status(404).json({ message: "quizzes not found" });
    }

    // console.log("questions from quiz ",quizData.rows[0])
    // console.log("length of quiz ",quizData.length)

    res.status(200).json(quizData.rows)
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

async function quizQuestions(req, res) {

  try {
    // const { quiz_id } = req.params.quiz_id

    const questions = await db.query("select * FROM quiz_questions WHERE quiz_id=$1",
      [req.params.quiz_id]
    );

    // console.log("questions from quiz ",questions.rows)
    // console.log("length of quiz ",questions.rows.length)


    if (questions.rows.length === 0) {
      return res.status(404).json({ message: "Quiz questions not found" })
    }

    return res.status(200).json(questions.rows)
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }


}

async function quizSubmission(req, res) {
  try {
    const { quiz_id, studentId, answers, submitted_at } = req.body;

    console.log("Received submission:", {
      quiz_id,
      studentId,
      answers,
      submitted_at
    });

    await db.query(
      `INSERT INTO quiz_submissions (student_id, quiz_id, submitted_at, answers)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (student_id, quiz_id)
      DO UPDATE
      SET submitted_at = EXCLUDED.submitted_at,
          answers      = EXCLUDED.answers`,
      [studentId, quiz_id, submitted_at, answers]
    );

    res.status(200).json({ message: "Submission recorded successfully." });

  } catch (error) {
    console.error("Error submitting quiz:", error);
    res.status(500).json({ error: "Server" });
  }
}


async function socketSubmission({ quiz_id, studentId, answers, submitted_at }) {
  await db.query(
    `INSERT INTO quiz_submissions (student_id, quiz_id, submitted_at, answers)
       VALUES ($1,$2,$3,$4)
     ON CONFLICT (student_id, quiz_id)
       DO UPDATE SET submitted_at = EXCLUDED.submitted_at,
                     answers      = EXCLUDED.answers`,
    [studentId, quiz_id, submitted_at, answers]
  );
}


module.exports={quizQuestions,quizData,quizSubmission,socketSubmission}