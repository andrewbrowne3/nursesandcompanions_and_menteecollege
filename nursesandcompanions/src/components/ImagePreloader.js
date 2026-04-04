import React, { useState, useEffect } from 'react';
import { Spinner, Container, Row, Col } from 'react-bootstrap';

const ImagePreloader = ({ images, children, loadingComponent }) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    if (!images || images.length === 0) {
      setImagesLoaded(true);
      return;
    }

    let loadedImages = 0;
    const imagePromises = images.map((imageSrc) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          loadedImages++;
          setLoadedCount(loadedImages);
          resolve();
        };
        img.onerror = () => {
          loadedImages++;
          setLoadedCount(loadedImages);
          resolve(); // Still resolve to not block other images
        };
        img.src = imageSrc;
      });
    });

    Promise.all(imagePromises).then(() => {
      setImagesLoaded(true);
    });
  }, [images]);

  if (!imagesLoaded) {
    return (
      loadingComponent || (
        <Container>
          <Row className="justify-content-center">
            <Col xs={12} className="text-center" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Spinner animation="border" variant="primary" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
              <h5 className="text-muted mb-2">Loading images...</h5>
              <p className="text-muted">
                {loadedCount} of {images?.length || 0} images loaded
              </p>
            </Col>
          </Row>
        </Container>
      )
    );
  }

  return children;
};

export default ImagePreloader; 