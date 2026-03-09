import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { socket } from "../../socket.js"

export default function Question() {
  const { quiz_id } = useParams();
  const { studentId } = useOutletContext();

  const [questions, setQuestions] = useState(null);
  const [time, setTime] = useState(15); // 15 seconds for demo
  const [answers, setAnswers] = useState({});

  const [status, setStatus] = useState({
    start: false,
    end: false,
    pending: false
  });

  const [errorMessage, setErrorMessage] = useState(null);
  const [error, setError] = useState(false);

  const timerRef = useRef(null);
  const statusRef = useRef(status);
  const answersRef = useRef(answers);


  // ------------------------------------------------------------------
  // If a queued submission exists, show the Pending banner immediately
  // ------------------------------------------------------------------
  useEffect(() => {
    // Only needed when the browser is currently offline.
    if (navigator.onLine) {
      return
    }

    const openReq = indexedDB.open("LMS-Database", 1);

    openReq.onsuccess = event => {
      const db = event.target.result;
      const tx = db.transaction("pendingSubmissions", "readonly");
      const store = tx.objectStore("pendingSubmissions");
      const response = store.get([studentId, quiz_id]);

      response.onsuccess = function (event) {
        if (event.target.result) {
          setStatus(prev => ({ ...prev, pending: true }));
        }
      };
    };

  }, [studentId, quiz_id]);



  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);


  // ------------------------------------------------------------------
  // Fetch questions from server
  // ------------------------------------------------------------------
  useEffect(() => {
    const request = indexedDB.open("LMS-Database", 1);

    request.onsuccess = function (event) {
      const db = event.target.result;
      fetchQuestions(db);
    };

    request.onerror = function () {
      setError(true);
      setErrorMessage("IndexedDB unavailable: " + request.error?.message);
    };

    async function fetchQuestions(db) {
      try {
        const res = await axios.get(`http://localhost:3000/quiz_questions/${quiz_id}`, {
          timeout: 120000
        });

        if (res.status === 200) {
          // console.log("questions from server", res.data);
          setQuestions(res.data);

          // Store each question as its own record
          const tx = db.transaction("quizQuestions", "readwrite");
          const st = tx.objectStore("quizQuestions");
          res.data.forEach(question => st.put(question));
          return;
        }
      } catch (err) {
        // fetch from storage when offline
        const tx = db.transaction("quizQuestions", "readonly");
        const store = tx.objectStore("quizQuestions");
        const req = store.index("by_quiz_id").getAll(parseInt(quiz_id))


        req.onsuccess = function (event) {
          const results = event.target.result;
          // console.log("questions from cache", results);
          if (results.length > 0) {
            setQuestions(results);
          } else {
            setError(true);
            setErrorMessage("Cannot connect to server and no cached questions found");
          }
        };

        req.onerror = function () {
          setError(true);
          setErrorMessage("IndexedDB read failed: " + req.error?.message);
        };
      }
    }
  }, [quiz_id]);


  // ------------------------------------------------------------------
  // Timer
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!status.start || status.end) {
      return;
    }

    timerRef.current = setInterval(() => {
      setTime((t) => t - 1);
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
    };
  }, [status.start, status.end]);

  // ------------------------------------------------------------------
  // Auto-submit when timer hits zero
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!status.start || status.end) {
      return;
    }
    if (time > 0) {
      return;
    }

    clearInterval(timerRef.current);
    submitAnswers();
  }, [time, status.start, status.end]);

  // ------------------------------------------------------------------
  // Auto-submit on unmount 
  // ------------------------------------------------------------------
  useEffect(() => {
    return () => {
      const s = statusRef.current;
      const a = answersRef.current;

      if (s.start && !s.end) {
        // console.log("navigated away auto-submitting");
        submitAnswers();
      }
    };
  }, []);

  // ------------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------------
  function startQuiz() {
    setStatus((prev) => ({ ...prev, start: true }));
  }


  //------------------------------------------------
  // Send to server
  //-----------------------------------------

  async function sendToServer(payload) {
      //check connectivity status
    if (!navigator.onLine || !socket.active) {
      throw new Error("offline");
    }
    if (socket.connected && socket.active) {
      await socket
        .timeout(8000) // give the server 8s to reply
        .emitWithAck("quiz-submit", payload)
        .then(res => { // ACK payload from server
          if (!res?.ok) throw new Error("NACK"); // submission rejected
        });
      return;  //complete
    }
    await axios.post("http://localhost:3000/quiz_submission", payload, {
      timeout: 120000,
    }); //fallback if socket is not functioning
  }


  async function submitAnswers() {
    if (statusRef.current.end) {
      return;
    }

    const payload = {
      studentId,
      quiz_id,
      answers: answersRef.current,
      submitted_at: new Date().toISOString(),
    };

    try {
      await sendToServer(payload);
      setStatus(p => ({ ...p, end: true }));
    } catch {
      const req = indexedDB.open("LMS-Database", 1);
      req.onsuccess = function (event) {
        const db = event.target.result;
        db.transaction("pendingSubmissions", "readwrite")
          .objectStore("pendingSubmissions")
          .put(payload);
        setStatus(p => ({ ...p, end: true, pending: true }));
      };

    }
  }


  //flush on reconnect
  useEffect(() => {
    if (!status.pending) {
        return;
      }
    function flush() {
      if (!socket.connected || !socket.active) {
        return;
      }
      const open = indexedDB.open("LMS-Database", 1);
      open.onsuccess =function (event){
      const db = event.target.result;
      const key = [studentId, quiz_id];
      const tx = db.transaction("pendingSubmissions")           
      const store =  tx.objectStore("pendingSubmissions")
      const req =  store.get(key);

        req.onsuccess = async () => {
        const rec = req.result;
        if (!rec) {
            return;
          }
          
        try {
          await socket.timeout(8000)   
            .emitWithAck("quiz-submit", rec)
            .then(res => { if (!res?.ok) throw new Error("NACK"); });

          db.transaction("pendingSubmissions", "readwrite")
            .objectStore("pendingSubmissions")
            .delete(key);

          setStatus(p => ({ ...p, pending: false }));
        } catch (err) {
          console.log("Still offline or server NACK:", err.message);
        }
        };
      };
    };
    
    flush();                          // run immediately
    socket.on("connect", flush);      // run on every future reconnect
    return () => socket.off("connect", flush);
  }, [status.pending, studentId, quiz_id]);

  //--------------------------------------------------------
  // helper functions
  //--------------------------------------------------------
  async function quizSubmission(event) {
    event.preventDefault();
    clearInterval(timerRef.current);
    await submitAnswers();
  }

  function handleAnswerChange(questionId, selectedOption) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: selectedOption,
    }));
  }

  // ------------------------------------------------------------------
  // Render shortcuts
  // ------------------------------------------------------------------
  if (error) {
    return <h1 style={{ color: "red" }}>{errorMessage}.</h1>;
  }

  if (!questions) {
    return <h1>Loading questions...</h1>;
  }


  if (status.pending) {
    return <h1>Pending submission</h1>
  }


  if (!status.start) {
    return (
      <button className="quiz-button" onClick={startQuiz}>
        Start quiz
      </button>
    );
  }

  if (status.end) {
    return <h1>Quiz completed</h1>;
  }

// ------------------------------------------------------------------
// Quiz Form
// ------------------------------------------------------------------
return (
  <div className="question-container">
    {status.start && !status.end && (
      <div className="timer">
        Time left: {Math.floor(time / 60)}:
        {String(time % 60).padStart(2, "0")}
      </div>
    )}

    <form onSubmit={quizSubmission}>
      <ol>
        {questions.map((q, i) => (
          <li key={q.question_id} className="question-item">
            <p>
              Q{i + 1}: {q.question_text}
            </p>
            <ul className="option-list">
              {["A", "B", "C", "D"].map((opt) => (
                <li key={opt}>
                  <label>
                    <input
                      type="radio"
                      name={`question_${q.question_id}`}
                      value={opt}
                      onChange={() =>
                        handleAnswerChange(q.question_id, opt)
                      }
                      checked={answers?.[q.question_id] === opt}
                    />
                    <span>
                      {opt}) {q[`option_${opt.toLowerCase()}`]}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <button className="quiz-button" type="submit">
        Submit
      </button>
    </form>
  </div>
);
}
