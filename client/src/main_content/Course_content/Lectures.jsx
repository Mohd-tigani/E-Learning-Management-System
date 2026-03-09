import { useNavigate, useOutletContext, Link, Outlet, useParams, useLocation } from "react-router-dom"
import backButtonImg from "../../images/back-button.png"
import { useEffect,useState } from "react"
import axios from "axios"
import "../../styles/lectureStyle.css"

export default function Lectures() {
  const navigate = useNavigate()
  const { lecture_id } = useParams();
  const location = useLocation()
  const { courseData, studentId } = useOutletContext()
  const [errorMessage, setErrorMessage] = useState(null)
  const [error, setError] = useState(false)
  const [lectureList, setLectureList] = useState(null)

useEffect(() => {
  const request = indexedDB.open("LMS-Database", 1);

  request.onsuccess = function (event) 
  {
    const db = event.target.result;
    fetchLectures(db); // only call once DB is ready
  };

  request.onerror = function () {
    setError(true);
    setErrorMessage("IndexedDB unavailable: " + request.error?.message);
  };

  async function fetchLectures(db) {
    try {
      const res = await axios.get(
        `http://localhost:3000/lectures/${courseData.course_id}`,
        { timeout: 120000 }
      );

      if (res.status === 200) {
        setLectureList(res.data);

        // cache lecture list offline
        const tx = db.transaction("lectureList", "readwrite");
        const store = tx.objectStore("lectureList");
        res.data.forEach(lecture => store.put(lecture));
        return;
      }
    } catch (err) {
      // fallback to cached lectures
      const tx = db.transaction("lectureList", "readonly");
      const store = tx.objectStore("lectureList");
      const req = store.getAll();

      req.onsuccess = function (event) {

        if (event.target.result.length > 0) {
          setLectureList(event.target.result);
        } else {
          setError(true);
          setErrorMessage("Offline and no cached lectures found");
        }
      };

      req.onerror = function () {
        setError(true);
        setErrorMessage("IndexedDB read failed: " + req.error?.message);
      };
    }
  }
}, [courseData.course_id]);


  if (error) {
    return <h1 style={{ color: "red" }}>{errorMessage}.</h1>;
  }


  if (!lectureList) {
    return <h1>Loading Lectures...</h1>
  }

  if (location.pathname.includes("/lectures/" + lecture_id)) 
    {
    const lecture = lectureList?.find(l => l.lectureId === Number(lecture_id));
    return (
      <>
        <div className="heading">
          <div className="title">
            <button onClick={() => navigate(-1)}>
              <img src={backButtonImg} />
            </button>
            <h1>{lecture.lectureTitle}</h1>
            <p>{courseData.semester}</p>
          </div>
        </div>
        <Outlet context={lecture} />
      </>
    );
  }

  return (
    <>
      <div className="heading">
        <div className="title">
          <button onClick={() => navigate("/courses/" + courseData.course_id)}>
            <img src={backButtonImg} />
          </button>
          <h1>{courseData.courseName}: Lectures</h1>
          <p>{courseData.semester}</p>
        </div>
      </div>

      <div className="lecture-list">
        {lectureList.map(lecture => (

          <Link to={`${lecture.lectureId}`} key={lecture.lectureId} className="lecture-link">

            <p><strong>{lecture.lectureTitle}</strong> </p>
            <p><strong>Description:</strong> {lecture.lectureDescription}</p>
            <p><strong>Date:</strong> {lecture.lectureDate}</p>
          </Link>
        ))}
      </div>
    </>

  )
}