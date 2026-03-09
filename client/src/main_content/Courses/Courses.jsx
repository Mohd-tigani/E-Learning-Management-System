import { Outlet, useOutletContext } from "react-router-dom";

export default function Courses() {

  const studentId = useOutletContext();
  return (
    <>
     {/*this renders the list of courses based on student id} */}
      <Outlet context={studentId} /> 
    </>
  );
}