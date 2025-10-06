import React, { useEffect, useRef, useState } from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import ReactQuill from 'react-quill';
import { io } from 'socket.io-client';
import 'react-quill/dist/quill.snow.css';
import 'animate.css';
import { v4 as uuidv4 } from 'uuid';

const SERVER_URL = 'http://localhost:4000';
const SAVE_INTERVAL = 2000;

export default function Editor({ docId, username }) {
  const [socket, setSocket] = useState();
  const [connectedUsers, setConnectedUsers] = useState([]);
  const quillRef = useRef();

  // Generate a unique ID per session
  const USER_ID = uuidv4();

  useEffect(() => {
    const s = io(SERVER_URL, {
      auth: { userId: USER_ID, username }
    });
    setSocket(s);
    return () => s.disconnect();
  }, [username]);

  useEffect(() => {
    if (!socket || !docId) return;

    socket.emit('get-document', docId);

    socket.on('load-document', (data) => {
      const quill = quillRef.current.getEditor();
      quill.setContents(data);
      quill.enable();
    });

    socket.on('receive-changes', (delta) => {
      const quill = quillRef.current.getEditor();
      quill.updateContents(delta);
    });

    socket.on('users-update', (users) => {
      setConnectedUsers(users);
    });

    return () => {
      socket.off('load-document');
      socket.off('receive-changes');
      socket.off('users-update');
    };
  }, [socket, docId]);

  useEffect(() => {
    if (!socket) return;
    const quill = quillRef.current.getEditor();

    const handler = (delta, old, source) => {
      if (source !== 'user') return;
      socket.emit('send-changes', delta);
    };

    quill.on('text-change', handler);
    return () => quill.off('text-change', handler);
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    const interval = setInterval(() => {
      const data = quillRef.current.getEditor().getContents();
      socket.emit('save-document', data);
    }, SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [socket]);

  return (
    <Container fluid>
      <Row className="mb-3">
        <Col>
          <Card className="shadow-sm p-3 animate__animated animate__fadeIn">
            <Card.Body className="d-flex justify-content-between align-items-center flex-wrap">
              <h5 className="text-primary mb-0">
                Document ID: <Badge bg="secondary">{docId}</Badge>
              </h5>
              <div>
                {connectedUsers.map(([userId, name]) => (
                  <Badge
                    key={userId}
                    bg={userId === USER_ID ? 'primary' : 'success'}
                    className="me-1"
                  >
                    {userId === USER_ID ? 'You' : name.charAt(0).toUpperCase()}
                  </Badge>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col>
          <Card className="shadow-lg animate__animated animate__fadeInUp">
            <Card.Body>
              <ReactQuill
                ref={quillRef}
                theme="snow"
                style={{ minHeight: '60vh', borderRadius: '8px' }}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
