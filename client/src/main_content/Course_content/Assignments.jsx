import { useNavigate, useOutletContext, Link, Outlet, useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import backButtonImg from "../../images/back-button.png";
import "../../styles/assignmentStyle.css";

export default function Assignments() {
const navigate = useNavigate();
const location = useLocation();
const { assignment_id } = useParams();            
const { courseData, studentId } = useOutletContext();

const [assignments, setAssignments] = useState(null);
const [error, setError] = useState(false);
const [errorMessage, setErrorMessage] = useState(null);

useEffect(() => {
  /* open (or reuse) the DB once */
  const openReq = indexedDB.open("LMS-Database", 1);

  openReq.onsuccess = function(event){
    fetchAssignments(event.target.result);

  }

  openReq.onerror = function(){
    setError(true);
    setErrorMessage("IndexedDB unavailable: " + openReq.error.message);
  };

  async function fetchAssignments(db) {
    try {
      const res = await axios.get(
        `http://localhost:3000/assignments/${courseData.course_id}`,
        { timeout: 120000 }
      );

      if (res.status === 200) {
        console.log("assignment from server",res.data)
        setAssignments(res.data); 

        //  store for offline use
        const tx = db.transaction("assignmentList", "readwrite");
        const store = tx.objectStore("assignmentList");
        res.data.forEach(assign => store.put(assign));            
        return;                                        // done
      }
    } catch  {
      //if offline
      const tx  = db.transaction("assignmentList", "readonly");
      const ix  = tx.objectStore("assignmentList").index("byCourse");
      const req = ix.getAll(courseData.course_id);     // array back

      req.onsuccess = function(event){
        if (event.target.result.length>0) {
          setAssignments(event.target.result);   
        } else {
          setError(true);
          setErrorMessage("Cannot connect to server and no cached assignments available");
        }
      };

      req.onerror = function() {
        setError(true);
        setErrorMessage("IndexedDB read failed: " + req.error?.message);
      };
    }
  }
}, [courseData.course_id]);

//show error if facing server problems
if (error) {
    return <h1 style={{ color: "red" }}>{errorMessage}.</h1>;
}

//A user interface to display component loading
if (!assignments) {
    return <h1>Loading assignments.</h1>;
}

// render assignment submission page when user clicks on assignment list
if (location.pathname.includes("/assignments/" + assignment_id)) {
const assignment = assignments.find(
    (a) => a.assignmentId === Number(assignment_id)
);

return (
<>
    <div className="heading">
        <div className="title">
            <button onClick={() => navigate(-1)}>
                <img src={backButtonImg} />
            </button>
            <h1>{assignment.assignmentTitle}</h1>
            <p>{courseData.semester}</p>
        </div>
    </div>

    <Outlet context={{assignment,studentId}} />
</>
);
}

// assignment list view 
return (
<>
    <div className="heading">
        <div className="title">
            <button onClick={() => navigate("/courses/" + courseData.course_id)}>
                <img src={backButtonImg} />
            </button>
            <h1>{courseData.courseName}: Assignments</h1>
            <p>{courseData.semester}</p>
        </div>
    </div>

    <div className="assignment-list">
        {assignments.map((a) => (
            <Link
                to={`${a.assignmentId}`}
                key={a.assignmentId}
                className="assignment-link"
            >
                <p><strong>{a.assignmentTitle}</strong></p>
                <p>Description: {a.assignmentDesc ?? "—"}</p>
                <p>Due date: {a.dueDate ?? "—"}</p>
            </Link>
        ))}
    </div>
</>
);
}
