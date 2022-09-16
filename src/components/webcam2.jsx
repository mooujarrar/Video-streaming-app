import React from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import { Button, FloatingLabel, Form } from 'react-bootstrap';
import axios from 'axios';
import ReactPlayer from 'react-player';

function WebCam2() {
  const [videoSources, setVideoSources] = useState([]);
  const [audioSources, setAudioSources] = useState([]);
  const [validated, setValidated] = useState(false);
  const [connected, setConnected] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const form = event.currentTarget;
    const post = { videoSource: form.videoSource.value, audioSource: form.audioSource.value };
    try {
      const res = await axios.post('http://localhost:5000/live', post);
      console.log("here", true);
      setConnected(true);
    } catch (e) {
      alert(e)
    }
  };

  const handleValidation = (event) => {
    const form = event.currentTarget;
    setValidated(form.checkValidity())
  };

  useEffect(() => {
    const getSources = async () => {
      const res = await axios('http://localhost:5000/live');
      if (res.data) {
        console.log("here");
        setVideoSources(res.data.video ?? []);
        setAudioSources(res.data.audio ?? []);
      }
    };
    getSources();
    return async () => await axios('http://localhost:5000/stopStream');
  }, []);

  return (
    <div className="flex-grow-1 d-flex align-items-center justify-content-center">
      <div className="d-flex flex-column align-items-center justify-content-center">
        <Form noValidate validated={validated} onChange={handleValidation} onSubmit={handleSubmit}>
          <Form.Group controlId="formValidator">
            <FloatingLabel controlId="videoSource" label="Video source" className="mb-3">
              <Form.Select required aria-label="Select source">
                <option key={'initial'} value=""></option>
                {videoSources.map((source, index) => (
                  <option key={index} value={source}>
                    {source}
                  </option>
                ))}
              </Form.Select>
            </FloatingLabel>
            <FloatingLabel controlId="audioSource" label="Audio source" className="mb-3">
              <Form.Select required aria-label="Select source">
                <option key={'initial'} value=""></option>
                {audioSources.map((source, index) => (
                  <option key={index} value={source}>
                    {source}
                  </option>
                ))}
              </Form.Select>
            </FloatingLabel>

            <Button variant="primary" type="submit" disabled={!validated}>
              Submit
            </Button>
          </Form.Group>
        </Form>

        <h1 className="h3 text-success">
          Mode: <i className="bi bi-webcam"></i>
        </h1>
        {connected ? 
        <ReactPlayer url="http://localhost:5000/index.m3u8" playing={true} controls={true}/> : ""}
      </div>
    </div>
  );
}

export default WebCam2;
