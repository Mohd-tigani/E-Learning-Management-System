import { useEffect, useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import { socket } from "../../socket.js";


// Helper to auto-increment filename
function IncrementedFileName(file, previousFileName) {
    if (!previousFileName) {
        return file;
    }

    const dotIndex = file.name.lastIndexOf(".");
    const fileExtension = file.name.slice(dotIndex);
    const currentFullName = file.name.slice(0, dotIndex);

    const prevDotIndex = previousFileName.lastIndexOf(".");
    const prevFullName = previousFileName.slice(0, prevDotIndex);

    // Extract base names without (number) if present
    const currentMatch = currentFullName.match(/^(.*)\((\d+)\)$/);
    const currentBaseName = currentMatch ? currentMatch[1].trim() : currentFullName;

    const prevMatch = prevFullName.match(/^(.*)\((\d+)\)$/);
    const prevBaseName = prevMatch ? prevMatch[1].trim() : prevFullName;

    // Only rename if the base names match
    if (currentBaseName !== prevBaseName) {
        return file;
    }

    const previousNumber = prevMatch ? parseInt(prevMatch[2], 10) : 0;
    const nextNumber = previousNumber + 1;

    const newFileName = `${currentBaseName}(${nextNumber})${fileExtension}`;
    return new File([file], newFileName, { type: file.type });
}



export default function AssignmentSubmission() {

    const { assignment, studentId } = useOutletContext();

    const [pdfUrl, setPdfUrl] = useState(null);
    const [error, setError] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [submittedFileName, setSubmittedFileName] = useState(null);

    const fileRef = useRef();

    // ------------------------------------------------------------------
    // Check if the student has submitted before online, and store offline
    // ------------------------------------------------------------------
    useEffect(() => {
        const openReq = indexedDB.open("LMS-Database", 1);

        openReq.onsuccess = async function (event) {
            const db = event.target.result;
            const key = [assignment.assignmentId, studentId];

            try {
                const res = await axios.get(
                    `http://localhost:3000/checkSubmission/${assignment.assignmentId}/${studentId}`,
                    { timeout: 120000 }
                );

                if (res.data.submitted) {
                    setHasSubmitted(true);
                    setSubmittedFileName(res.data.fileName);
                }

                const tx = db.transaction("assignmentSubmissions", "readwrite");
                tx.objectStore("assignmentSubmissions").put({
                    assignmentId: assignment.assignmentId,
                    studentId,
                    submitted: res.data.submitted,
                    fileName: res.data.fileName ?? null,
                });
            } catch (err) {
                const tx = db.transaction("assignmentSubmissions", "readonly");
                const get = tx.objectStore("assignmentSubmissions").get(key);

                get.onsuccess = function (event) {
                    const record = event.target.result;
                    if (record?.submitted) {
                        setHasSubmitted(true);
                        setSubmittedFileName(record.fileName);
                    } else {
                        console.error("No cached submission status & server unreachable");
                    }
                };
            }
        };

    }, [assignment.assignmentId, studentId]);


    // ------------------------------------------------------------------
    // Check if submission is in a queue
    // ------------------------------------------------------------------

    useEffect(() => {
        const open = indexedDB.open("LMS-Database", 1);
        open.onsuccess = (e) => {
            const db = e.target.result;
            const key = [studentId, assignment.assignmentId];

            db.transaction("pendingAssignments", "readonly")
                .objectStore("pendingAssignments")
                .get(key).onsuccess = (ev) => {
                    if (ev.target.result) {
                        setUploadStatus("Submission pending.");
                    }
                };
        };
    }, [studentId, assignment.assignmentId]);


    // ------------------------------------------------------------------
    // Load PDF from server online, and store for offline storage
    // ------------------------------------------------------------------
    useEffect(function () {

        const openReq = indexedDB.open("LMS-Database", 1);

        openReq.onsuccess = function (event) {
            var db = event.target.result;
            fetchAttachment(db);
        };

        openReq.onerror = function () {
            setError(true);
            setErrorMsg("IndexedDB unavailable: " + openReq.error.message);
        };

        async function fetchAttachment(db) {
            try {
                const response = await axios.get(
                    "http://localhost:3000/assignmentAttachment/" +
                    assignment.assignmentId,
                    { responseType: "blob", timeout: 120000 }
                );

                if (response.status === 200) {
                    const blob = response.data;
                    setPdfUrl(URL.createObjectURL(blob));

                    const tx = db.transaction("attachmentList", "readwrite");
                    const store = tx.objectStore("attachmentList");
                    store.put({ assignmentId: assignment.assignmentId, blob: blob });
                    return;
                }
            }
            catch {
                const tx = db.transaction("attachmentList", "readonly");
                const req = tx.objectStore("attachmentList")
                    .get(assignment.assignmentId);

                req.onsuccess = function (event) {
                    const record = event.target.result;
                    if (record && record.blob) {
                        setPdfUrl(URL.createObjectURL(record.blob));
                    }
                    else {
                        setError(true);
                        setErrorMsg("Cannot connect to server and no cached assignments available");
                    }
                };

            }
        }
    }, [assignment.assignmentId]);


    async function handleSubmit(e) {
        e.preventDefault();

        if (!selectedFile) {
            setUploadStatus("Please select a file to submit.");
            return;
        }

        if (selectedFile.type !== "application/pdf") {
            setUploadStatus("Only PDF files are allowed.");
            return;
        }

        const maxSizeMB = 5;
        if (selectedFile.size > maxSizeMB * 1024 * 1024) {
            setUploadStatus(`File too large. Max allowed is ${maxSizeMB}MB.`);
            return;
        }

        const updatedFile = IncrementedFileName(selectedFile, submittedFileName);
        const fileName = updatedFile.name;

        const formData = new FormData();
        formData.append("submission", updatedFile);
        formData.append("student_id", studentId);

        try {
            const res = await axios.post(
                `http://localhost:3000/submitAssignment/${assignment.assignmentId}`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            if (res.status === 200) {
                setHasSubmitted(true);
                setSubmittedFileName(fileName);
                setUploadStatus("Submission successful.");
                setSelectedFile(null);
                fileRef.current.value = "";
            }
        }
        catch {
            setUploadStatus("Submission pending.");
            const open = indexedDB.open("LMS-Database", 1);
            open.onsuccess = function (event) {
                const db = event.target.result;
                db.transaction("pendingAssignments", "readwrite")
                    .objectStore("pendingAssignments")
                    .put({
                        studentId,
                        assignmentId: assignment.assignmentId,
                        fileName,
                        fileBlob: updatedFile,
                        submitted_at: new Date().toISOString(),
                    });

                setHasSubmitted(true);
                setSubmittedFileName(fileName);
            };
        }
    }

    if (error) {
        return <h1 style={{ color: "red" }}>{errorMsg}.</h1>;
    }

    if (!pdfUrl) {
        return <h1>Loading document…</h1>;
    }

    return (
        <div className="assignment-pdf">
            <h3>Solve the following assignment in the attached document below:</h3>
            <br />
            <embed src={pdfUrl} type="application/pdf" width="100%" height="800" />

            <form onSubmit={handleSubmit}>
                <h3>Submit Your Assignment (PDF only):</h3>
                <br />
                <input
                    type="file"
                    ref={fileRef}
                    accept=".pdf"
                    onChange={(e) => {
                        setSelectedFile(e.target.files[0])
                        setUploadStatus("");
                    }}
                />
                <button type="submit">
                    {hasSubmitted ? "New Submission" : "Submit"}
                </button>
            </form>

            {hasSubmitted && submittedFileName && (
                <p>You submitted: <strong>{submittedFileName}</strong></p>
            )}

            {uploadStatus && <p>{uploadStatus}</p>}
        </div>
    );
}
