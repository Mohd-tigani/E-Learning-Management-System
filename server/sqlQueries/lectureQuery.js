const db = require("../database/dbs")

async function getLectures(req, res) {
  try {
    const courseId = req.params.module_id;

    const { rows } = await db.query(
      `SELECT lecture_id,
              lecture_title,
              lecture_description,
              lecture_date
       FROM   lectures
       WHERE  course_id = $1
       ORDER  BY lecture_date`,
      [courseId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "No lectures found" });
    }

    // map each DB row → clean JSON object
    const lectures = rows.map(r => ({
      lectureId:          r.lecture_id,
      lectureTitle:       r.lecture_title,
      lectureDescription: r.lecture_description,
      lectureDate:        r.lecture_date.toISOString().slice(0, 10) // "YYYY-MM-DD"
    }));

    res.status(200).json(lectures);   // ← send an array
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

async function getLectureAttachment(req, res) {
  try {
    const { lecture_id } = req.params;

    const { rows } = await db.query(
      `SELECT attachment_type, attachment_data
         FROM lectures
        WHERE lecture_id = $1`,
      [lecture_id]
    );

    if (!rows.length || !rows[0].attachment_data) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    const { attachment_type, attachment_data } = rows[0];

    res.set({
      "Content-Type":  attachment_type,               // e.g. application/pdf
      "Content-Length": attachment_data.length,
      "Content-Disposition": `inline; filename="lecture_${lecture_id}.pdf"`
    });

    res.status(200).send(attachment_data);                        // small/medium files
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}


module.exports={getLectureAttachment,getLectures}