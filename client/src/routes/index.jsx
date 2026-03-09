// Dashboard
import Dashboard from "../Home.jsx";

// Courses
import Courses from "../main_content/Courses/Courses.jsx";
import CourseList from "../main_content/Courses/CourseList.jsx";
import Module from "../main_content/Courses/Module.jsx";

// Course Content
import Quizzes from "../main_content/Course_content/Quizzes.jsx";
import Question from "../main_content/Course_content/Question.jsx";
import Lectures from "../main_content/Course_content/Lectures.jsx";
import Lecturedisplay from "../main_content/Course_content/Lecturedisplay.jsx";
import Assignments from "../main_content/Course_content/Assignments.jsx";
import AssignmentSubmission from "../main_content/Course_content/AssignmentSubmission.jsx";


//acount
import { Account } from "../main_content/Account/Account.jsx";

// Router
import { createBrowserRouter, Navigate } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard />, //parent
    children: [             //child
      { index: true, element: <Navigate to="/courses" replace /> }, 
      { path: "courses", element: <Courses />, 
        children: [
          { 
            index: true, element: <CourseList /> 
          },
          { path: ":module_id", element: <Module />, 
            children: [
              {
                path: "quizzes", element: <Quizzes />,
                children: [
                  { path: ":quiz_id/question", element: <Question /> }]
              },
              {
                path: "lectures", element: <Lectures />,
                children: [
                  { path: ":lecture_id", element: <Lecturedisplay /> }
                ]
              },
              {
                path: "assignments", element: <Assignments />,
                children: [
                  { path: ":assignment_id", element: <AssignmentSubmission /> }
                ]
              }
            ]
          }
        ]
      },
      {
        path:"account",
        element:<Account />
      }
    ]
  }
]);

export default router;
