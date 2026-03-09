import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useOutletContext } from "react-router-dom";
import "../../styles/CoursesStyle.css";

export default function CourseList() {
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null)

  const studentId = useOutletContext()
  // console.log("the student id from courses is",studentId)


useEffect(() => {
  //open indexed database
  const request = indexedDB.open("LMS-Database", 1);
  request.onsuccess = function (event) {
    const db = event.target.result;
    fetchCourses(db); // Pass the db only once after it's ready
  };

  request.onerror = function () {
    setError(true);
    setErrorMessage("IndexedDB unavailable: " + request.error?.message);
  };
  
  async function fetchCourses(db) {
    try {
      const res = await axios.get(`http://localhost:3000/courses?studentId=${studentId}`, 
      {
        timeout: 120000
      });

      if (res.status === 200) {
        // console.log("data from server", res.data)
        setCourses(res.data);
        // Store in IndexedDB for offline use
        const tx = db.transaction("courselist", "readwrite");
        const st = tx.objectStore("courselist");
        res.data.forEach(course => st.put(course));
        return; // Done
      }
    } catch (err) {
      // fetch from offline storage when offline
      const tx = db.transaction("courselist", "readonly");
      const req = tx.objectStore("courselist").getAll();

      req.onsuccess = function (event) {
        if (event.target.result.length > 0) {
          setCourses(event.target.result);//store data for offline view
        } else {
          setError(true);
          setErrorMessage("Cannot connect to server and no cached courses available");
        }
      };

      req.onerror = function () {
        setError(true);
        setErrorMessage("IndexedDB read failed: " + req.error?.message);
      };
    }
  }
}, [studentId]);




  if (error) {
    return <h1 style={{ color: "red" }}>{errorMessage}.</h1>;
  }


  if (!courses) {
    return <h1>Loading courses...</h1>
  }

  return (
    <div className="course-grid">
      {courses.map((course) => (
        <Link
          key={course.course_id}
          to={`${course.course_id}`}

          className="cell"
        >
          {course.course_name.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
