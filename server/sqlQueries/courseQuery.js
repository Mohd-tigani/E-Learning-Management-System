const db = require("../database/dbs")

async function getCourseList(req, res) {
  const { studentId } = req.query;

  // console.log("the studentId ", studentId)
  try {
        const courseList = await db.query(
          `SELECT c.course_id,
                  c.course_name,
                  c.semester,
                  c.course_img_type,
                  c.course_img
            FROM courses   AS c
            JOIN enrolments AS e USING (course_id)
            WHERE e.student_id = $1`,
          [studentId]
        );


    if (courseList.rows.length === 0) {
      return res.status(404).json({ message: "List of Courses not found" });
    }

    res.status(200).json(courseList.rows);
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).json({ message: "Server error" });
  }
}

async function courseData(req, res) {
  try {
    const courseData = await db.query(
      "SELECT course_id,course_name, course_img, course_img_type, course_description, semester FROM courses WHERE course_id = $1",
      [req.params.module_id]
    );

    // console.log(req.params.module_id)
    if (courseData.rows.length === 0) {
      return res.status(404).json({ message: "Course data not found" });
    }

    const { course_id, course_name, course_img, course_img_type, course_description, semester } = courseData.rows[0];
    const base64Image = Buffer.from(course_img).toString("base64");

    res.status(200).json({
      course_id: course_id,
      courseName: course_name,
      courseDescription: course_description,
      semester: semester,
      image: `data:${course_img_type};base64,${base64Image}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports={courseData,getCourseList}