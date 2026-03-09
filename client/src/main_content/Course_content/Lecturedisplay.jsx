import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Lecturedisplay() {
    const lecture = useOutletContext();
    const [pdfUrl, setPdfUrl] = useState(null);
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    // console.log("the lecture from outlet", lecture)
 useEffect(() => {
  //open IndexedDB database
  const request = indexedDB.open("LMS-Database", 1);

  request.onsuccess = function (event) {
    const db = event.target.result;
    fetchAttachment(db);  // run only after DB is ready
  };

    request.onerror = function(){
    setError(true);
    setErrorMessage("IndexedDB unavailable: " + request.error?.message);
  };

  async function fetchAttachment(db) {
    try {
      const res = await axios.get(
        `http://localhost:3000/attachment/${lecture.lectureId}`,
        { responseType: "blob", timeout: 120000 }
      );

      if (res.status === 200) {
        setPdfUrl(URL.createObjectURL(res.data));

        // store for offline use
        const tx = db.transaction("lectureDisplay", "readwrite");
        tx.objectStore("lectureDisplay").put({
          lectureId: lecture.lectureId,
          blob : res.data
        });
        return; //
      }
    } catch (err) {
      //fetch from indexedDB storage
      const tx  = db.transaction("lectureDisplay", "readonly");
      const req = tx.objectStore("lectureDisplay").get(lecture.lectureId);

      req.onsuccess = function () {
        const cached = req.result;
        if (cached?.blob) {
          setPdfUrl(URL.createObjectURL(cached.blob));
        } else {
          setError(true);
          setErrorMessage("Offline and no cached attachment found");
        }
      };

      req.onerror = function () {
        setError(true);
        setErrorMessage("IndexedDB read failed: " + req.error?.message);
      };
    }
  }
}, [lecture.lectureId]);



    if (error) {
        return <h1 style={{ color: "red" }}>{errorMessage}.</h1>;
    }
    if (!pdfUrl) {
        return <h1>Loading document…</h1>;
    }


    return (
        <div className="pdf-wrapper">
            <object
                data={pdfUrl}
                type="application/pdf"
                aria-label="PDF document"
                width="100%"
                height="100%"
            >
                {/* Fallback for browsers that won’t render PDFs */}
                <p>
                    This browser can’t display PDFs.
                    <a href={pdfUrl} target="_blank" rel="noopener">
                        Tap here to download the file.
                    </a>
                </p>
            </object>
        </div>
    );

}
