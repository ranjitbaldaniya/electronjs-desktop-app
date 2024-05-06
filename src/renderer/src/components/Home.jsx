import React from 'react'
import { Link } from 'react-router-dom'
import { Container, Row, Col, Card, CardTitle, Button } from 'reactstrap'

const Home = () => {
  return (
    <>
      <Container>
        <Row fluid className="mt-5">
          <Col md={6} lg={6} sm={12} className='mb-3'>
            <div className="cardDiv">
              <Card body>
                <CardTitle tag="h5">Create Folder</CardTitle>
                <Link to={'/createfolder'}>
                  <Button color="dark">Click here to create Folder</Button>
                </Link>
              </Card>
            </div>
          </Col>
          <Col md={6} lg={6} sm={12} className='mb-3'>
            <div className="cardDiv">
              <Card body>
                <CardTitle tag="h5">Create PDF</CardTitle>
                <Link to={'/extractpdf'}>
                  <Button color="dark">Click here to Create PDF</Button>
                </Link>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default Home
