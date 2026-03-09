import { useEffect, useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import axios from 'axios';
import profileImg from './images/profile_image.png';
import courseImg from "./images/book.png"
import menuImg from "./images/menu.png"
import accountImg from "./images/account.png"

import "./styles/HomeStyle.css"

export default function Dashboard() {
  const [isOnline, setIsOnline] = useState(false);        // Server connectivity
  const [showSidebar, setShowSidebar] = useState(false);
  const [isTrulyOffline, setIsTrulyOffline] = useState(!navigator.onLine);  // Browser-level offline

  const studentId = import.meta.env.VITE_STATIC_STUDENT_ID;

  async function checkConnection() {
    try {
      const res = await axios.get("http://localhost:3000/", {
        withCredentials: false,
        headers: { "Cache-Control": "no-cache" }
      });
      return res.status === 200;
    } catch (err) {
      return false;
    }
  }

  useEffect(() => {
    async function verifyStatus() {
      const serverReachable = await checkConnection();
      setIsOnline(serverReachable);
    }

    function handleStatusChange() {
      const currentlyOffline = !navigator.onLine;
      setIsTrulyOffline(currentlyOffline);

      if (currentlyOffline) {
        setIsOnline(false); // also reset server status
      } else {
        verifyStatus(); // check if server is reachable
      }
    }

    verifyStatus(); // check on load
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        verifyStatus(); // every 5 seconds
      }
    }, 5000);

    return () => {//clean up
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
      clearInterval(intervalId);
    };
  }, []);

  // Display connection status
  const getStatusLabel = () => {
    if (isTrulyOffline)
      {
        return "Offline";
      } 
    if (!isOnline)
      {
        return "Online - Server unreachable";
      } 
    return "Online";
  };

  const getStatusColor = () => {
    if (isTrulyOffline) return '#e81e1e';   // Red
    if (!isOnline) return '#dbe82c';        // Yellow
    return '#29f262';                       // Green
  };

  return (
    <>
      <div className='nav_bar'>
        <div id='title'>
          <h1>LMS Web</h1>
          {studentId && (
            <p><strong>Student ID:</strong> {studentId}</p>
          )}
        </div>

        <div className='profile_status'>
          <div
            id="status_banner"
            style={{
              backgroundColor: getStatusColor(),
              padding: '10px'
            }}
          >
            {getStatusLabel()}
          </div>

          <div id="profile">
            <img src={profileImg} alt="Profile" />
            <p>John Doe</p>
          </div>

          <button className="sidebar-toggle" onClick={() => setShowSidebar(prev => !prev)}>
            <img src={menuImg} alt="Menu" />
          </button>
        </div>
      </div>

      <div className={`sidebar${showSidebar ? ' show' : ''}`}>
        <Link to="/courses" className="link-button">
          <img src={courseImg} alt="Book" />
          Courses
        </Link>
        <Link to="account" className="link-button">
          <img src={accountImg} alt="account" /> Account
        </Link>
      </div>

      <div className='main'>
        <Outlet context={studentId} /> {/*render list of course} */}
      </div>

      <div className='footer'>
        Coded and designed by Mohammed Altigani
      </div>
    </>
  );
}
