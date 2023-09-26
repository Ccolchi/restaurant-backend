import { Container, Row, Col, Card } from 'react-bootstrap'
import giftcard from '../img/giftcard.png'

const Home = () => {
  return (
    <>
      <Container className="container-fluid container-home">
        <Row>
          <Col xs={12} sm={6} className="col-home">
            <Row className="p-3">
              <h1>¿Tienes una Gift Card?</h1>
              <h3>Prueba todas las marcas que la aceptan de manera online</h3>
            </Row>
          </Col>

          <Col xs={12} sm={6} className="col-home">
            <Row className="card p-3" style={{width: '100%'}}>
              <img className="img-home" src={giftcard} alt="Portada Giftcards" />
            </Row>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Home
