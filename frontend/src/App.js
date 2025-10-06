import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
import Editor from './Editor';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'animate.css';

export default function App() {
  const path = window.location.pathname.slice(1);
  const docId = path || null;

  const [username, setUsername] = useState('');
  const [nameSubmitted, setNameSubmitted] = useState(false);

  const handleSubmitName = (e) => {
    e.preventDefault();
    if (username.trim()) setNameSubmitted(true);
  };

  const [existingDocId, setExistingDocId] = useState('');

  const openExistingDoc = () => {
    if (!existingDocId.trim()) return;
    window.location.pathname = `/${existingDocId.trim()}`;
  };

  return (
    <Container fluid className="p-4 bg-light min-vh-100">
      {!docId ? (
        <Row className="justify-content-center">
          <Col xs={12} md={6} lg={4}>
            <Card className="shadow-lg p-4 animate__animated animate__zoomIn">
              <Card.Body className="text-center">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-100 mb-3"
                  onClick={() => {
                    const id = Math.random().toString(36).slice(2, 10);
                    window.location.pathname = `/${id}`;
                  }}
                >
                  <i className="fas fa-plus-circle me-2"></i>Create New Document
                </Button>

                <Form
                  onSubmit={(e) => {
                    e.preventDefault();
                    openExistingDoc();
                  }}
                  className="d-flex gap-2 justify-content-center"
                >
                  <Form.Control
                    type="text"
                    placeholder="Enter Document ID"
                    value={existingDocId}
                    onChange={(e) => setExistingDocId(e.target.value)}
                  />
                  <Button variant="success" type="submit">
                    <i className="fas fa-folder-open me-1"></i>Open
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : !nameSubmitted ? (
        <Row className="justify-content-center mt-5">
          <Col xs={12} md={6} lg={4}>
            <Card className="p-4 shadow-lg">
              <Card.Body>
                <h5 className="text-center mb-3">Enter your name</h5>
                <Form onSubmit={handleSubmitName}>
                  <Form.Control
                    type="text"
                    placeholder="Your Name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <Button type="submit" className="mt-3 w-100">
                    Enter Document
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : (
        <Editor docId={docId} username={username} />
      )}
    </Container>
  );
}
