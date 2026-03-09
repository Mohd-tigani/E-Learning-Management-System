import { Link, Outlet, useNavigate, useOutlet, useOutletContext, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/moduleStyle.css";
import backButtonImg from "../../images/back-button.png"


export default function Module() {
    const { module_id } = useParams();
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null)
    const [courseData, setCourseData] = useState("");
    const studentId = useOutletContext()

    const navigate = useNavigate();

    function gotoCourseList() {
        navigate("/courses")
    }

useEffect(() => {
  const request = indexedDB.open("LMS-Database", 1);

  request.onsuccess = function (event) {
    const db = event.target.result;
    fetchCourseData(db);   // use DB only when ready
  };

  request.onerror = function () {
    setError(true);
    setErrorMessage("IndexedDB unavailable: " + request.error?.message);
  };

  async function fetchCourseData(db) {
    try {
      const res = await axios.get(`http://localhost:3000/courseData/${module_id}`, {
        timeout: 120000
      });

      if (res.status === 200) {
        setCourseData(res.data);

        // Store for offline use
        const tx = db.transaction("module", "readwrite");
        const st = tx.objectStore("module");
        st.put(res.data); 
        return;
      }
    } catch (err) {
      // fetch from storage when offline
      const tx = db.transaction("module", "readonly");
      const store = tx.objectStore("module");
      const req = store.get(parseInt(module_id)); // get data from storage

      req.onsuccess = function () {
        const cached = req.result;
        if (cached) {
          setCourseData(cached);
        } else {
          setError(true);
          setErrorMessage("Cannot connect to server and no cached module found");
        }
      };

      req.onerror = function () {
        setError(true);
        setErrorMessage("IndexedDB read error: " + req.error?.message);
      };
    }
  }
}, [module_id]);



    if (error) {
        return <h1 style={{ color: "red" }}>{errorMessage}.</h1>;
    }

    if (!courseData) {
        return <h1>Loading...</h1>;
    }

    if (location.pathname.includes("/quizzes") || location.pathname.includes("/lectures") || location.pathname.includes("/assignments")) {
        return <Outlet context={{ studentId, courseData }} />;
    }

    return (
        <>
            <div className="heading">
                <div className="title">
                    <button onClick={() => gotoCourseList()}>
                        <img src={backButtonImg} />
                    </button>
                    <h1>{courseData.courseName}</h1>
                    <p>{courseData.semester}</p>
                </div>
                <img src={courseData.image} alt={courseData.courseName} />
                <p><strong>Description:</strong> {courseData.courseDescription}</p>
            </div>

            <div className="content">
                <ul>
                    <Link to="lectures" className="content-button">
                        <li>Lectures</li>
                    </Link>

                    <Link to="quizzes" className="content-button">
                        <li>Quizzes</li>
                    </Link>

                    <Link to="assignments" className="content-button">

                        <li>Assignments</li>
                    </Link>

                </ul>
            </div>
        </>
    );

}
