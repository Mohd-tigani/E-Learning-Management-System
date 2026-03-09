import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from "react-router-dom";
import router from "./routes";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);


if ('serviceWorker' in navigator) {
  // Wait for all static assets to finish loading.
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/serviceworker.js')    // file lives in /public
      .then(reg => console.log('Service Worker registered at', reg.scope))
      .catch(err => console.error('Service Worker registration failed:', err));
  });
}

//create indexedDB database v1 or open existing v1
let openRequest = indexedDB.open("LMS-Database", 1)

openRequest.onerror = function (event) {
  console.error("An error has occured with IndexedDB", event)
}

//upgrade when new version is changed or database is created
openRequest.onupgradeneeded = function (event) {
  const db = event.target.result
  //create a "table" where id is the primary key
  db.createObjectStore("courselist", { keyPath: "course_id" })
  db.createObjectStore("module", { keyPath: "course_id" })
  db.createObjectStore("lectureList", { keyPath: "lectureId" })
  db.createObjectStore("lectureDisplay", { keyPath: "lectureId" });

  db.createObjectStore("pendingSubmissions",{ keyPath: ["studentId", 
                                                      "quiz_id"], });

  db.createObjectStore("assignmentSubmissions", {keyPath: ["assignmentId",
                                                           "studentId"], });

  db.createObjectStore("pendingAssignments", { keyPath: ["studentId", 
                                                "assignmentId"],});

  db.createObjectStore("attachmentList", { keyPath: "assignmentId" });

  //Object store with its indexes
  const quizlist = db.createObjectStore("quizList",{ keyPath: "quiz_id" });
  quizlist.createIndex("by_course", "course_id", { unique: false })

  const questions = db.createObjectStore("quizQuestions",{ keyPath: "question_id" })
  questions.createIndex("by_quiz_id", "quiz_id", { unique: false })

  const assignment = db.createObjectStore("assignmentList", { keyPath: "assignmentId" });
  assignment.createIndex("byCourse", "course_id", { unique: false });
}

