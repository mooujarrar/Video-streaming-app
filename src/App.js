import "./App.css";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import WebCam from "./components/webcam";
import VideoStreaming from "./components/videostream";
import WebCam2 from "./components/webcam2";

function App() {
  return (
    <Router>
      <div className="h-100 d-flex flex-column">
        <nav className="navbar navbar-expand navbar-brand">
          <ul className="navbar-nav">
            <li>
              <Link className="nav-link" to="/">Home</Link>
            </li>
            <li>
              <Link className="nav-link" to="/webcam">Webcam</Link>
            </li>
            <li>
              <Link className="nav-link" to="/video-streaming">Video Streaming</Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={
            <div className="flex-grow-1 d-flex justify-content-center align-items-center p-3 display-1">
              Video streaming demo
          </div>
          }>
          </Route>
          <Route path="/webcam" element={<WebCam2 />} />
          <Route path="/video-streaming" element={<VideoStreaming />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
