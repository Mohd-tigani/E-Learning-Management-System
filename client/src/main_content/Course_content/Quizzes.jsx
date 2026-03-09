import { useEffect, useState } from "react"
import { useNavigate, useOutletContext, Link, Outlet, useParams } from "react-router-dom";
import backButtonImg from "../../images/back-button.png"
import axios from "axios";
import "../../styles/quizStyle.css"

export default function Quizzes() {
    const { quiz_id } = useParams()

  const navigate = useNavigate();
  const { courseData, studentId } = useOutletContext()


  const [errorMessage, setErrorMessage] = useState(null)
  const [quizzes, setQuizzes] = useState(null)
  const [error, setError] = useState(false)

useEffect(() => {
  const openReq = indexedDB.open("LMS-Database", 1);

  openReq.onsuccess = function(event)
  {
    const db = event.target.result
    fetchQuizzes(db);
  } 
  openReq.onerror =function(){
    setError(true);
    setErrorMessage("IndexedDB unavailable: " + openReq.error?.message);
  };

  async function fetchQuizzes(db) {
    try {
      const res = await axios.get(
        `http://localhost:3000/quizzes/${courseData.course_id}`,
        { timeout: 120000 }
      );

      if (res.status === 200) {
        setQuizzes(res.data);

        const tx = db.transaction("quizList", "readwrite");
        const st = tx.objectStore("quizList");
        res.data.forEach(quiz => st.put(quiz)); 
        return;
      }
    } catch{
      //fetch from storage when offline
      const tx  = db.transaction("quizList", "readonly");
      const store = tx.objectStore("quizList")
      const req = store.index("by_course").getAll(courseData.course_id)

      req.onsuccess = () => {
        if (req.result.length) {
          setQuizzes(req.result);   // show cached quizzes
        } else {
          setError(true);
          setErrorMessage("Cannot connect to server and no cached quiz data available");
        }
      };

      req.onerror = () => {
        setError(true);
        setErrorMessage("IndexedDB read failed: " + req.error?.message);
      };
    }
  }
}, [courseData.course_id, studentId]);



  //show server error
  if (error) {
    return <h1 style={{ color: "red" }}>{errorMessage}.</h1>;
  }

  // a GUI to show user component is loading
  if (!quizzes) {
    return <h1>Loading quizzes...</h1>
  }

  //render quiz questions when user clicks on quizzes
if (location.pathname.includes(`${quiz_id}/question`)) 
  {
  const selectedQuiz = quizzes.find(q => q.quiz_id == quiz_id);
  return (
    <>
      <div className="heading">
        <div className="title">
          <button onClick={() =>navigate("/courses/"+quiz_id+"/quizzes")}>
            <img src={backButtonImg} />
          </button>
          <h1>{courseData.courseName}: {selectedQuiz ? selectedQuiz.quiz_title : ""}</h1>
          <p>{courseData.semester}</p>
        </div>
      </div>
      <Outlet context={{ studentId}} />
    </>
  );
}


// show list of quizzes
  return (
    <>
      <div className="heading">
        <div className="title">
          <button onClick={() => navigate("/courses/" + courseData.course_id)}>
            <img src={backButtonImg} />
          </button>
          <h1>{courseData.courseName}: Quizzes</h1>
          <p>{courseData.semester}</p>
        </div>
      </div>

      <div className="quiz-grid">
        {quizzes.map((quiz) => (
          <div className="quiz-cell" key={quiz.quiz_id}>
            <Link to={`${quiz.quiz_id}/question`} className="quiz-cell">

              <p>Title: {quiz.quiz_title}</p>
              <p>Description: {quiz.quiz_description}</p>
              <p>
                Due date: {new Date(quiz.due_date).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}
              </p>
            </Link>
          </div>
        ))}


        <div className="quiz-cell">
          <p>Title: Sample Quiz</p>
          <p>Description: This is a dummy quiz for layout preview.</p>
          <p>
            Due date: {new Date('2025-05-30T12:00:00Z').toLocaleString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}
          </p>
        </div>

        <div className="quiz-cell">
          <p>Title: Sample Quiz</p>
          <p>Description: This is a dummy quiz for layout preview.</p>
          <p>
            Due date: {new Date('2025-05-30T12:00:00Z').toLocaleString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}
          </p>
        </div>
      </div>
    </>

  )
}