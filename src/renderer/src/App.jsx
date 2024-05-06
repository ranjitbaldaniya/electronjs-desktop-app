import 'bootstrap/dist/css/bootstrap.min.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import CreateFolder from './components/CreateFolder'
import ExtractPdf from './components/ExtractPdf'
import Footer from './components/Footer'
import { useState, useEffect } from 'react'
import { Container, Row, Col, Alert, Spinner } from 'reactstrap' // Import Spinner for loader

function App() {
  const [isValidDate, setIsValidDate] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const [currentTime, setCurrentTime] = useState(null)
  const [isLoading, setIsLoading] = useState(true) // State for loader

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true); // Set loading to true before fetching data
        await ipcIsOnline()
        await fetchCurrentTime()
        setIsLoading(false); // Set loading to false after data is fetched
      } catch (error) {
        console.error('Error fetching data:', error)
        setIsLoading(false); // Set loading to false in case of error
      }
    }

    fetchData()

    return () => {
      // Cleanup
      window.electron.ipcRenderer.removeAllListeners('check-internet-connection')
      window.electron.ipcRenderer.removeAllListeners('get-current-time')
      window.electron.ipcRenderer.removeAllListeners('current-time')
      window.electron.ipcRenderer.removeAllListeners('current-time-error')
    }
  }, []) // Dependency added to rerun useEffect when currentTime changes

  const ipcIsOnline = async () => {
    try {
      await window.electron.ipcRenderer.send('check-internet-connection')
      window.electron.ipcRenderer.once('check-internet-connection', (event, onlineStatus) => {
        console.log('Internet connection status:', onlineStatus)
        setIsOnline(onlineStatus)
      })
    } catch (error) {
      console.error('Error checking internet connection:', error)
      setIsOnline(false) // Set online status to false if there's an error
    }
  }

  const fetchCurrentTime = async () => {
    console.log('Fetching time...')
    try {
      await window.electron.ipcRenderer.send('get-current-time')
      window.electron.ipcRenderer.once('current-time', (event, time) => {
        setCurrentTime(time)
        console.log('Fetching time done...', time)
      })
      window.electron.ipcRenderer.once('current-time-error', (event, errorMessage) => {
        console.error('Error:', errorMessage)
      })
    } catch (error) {
      console.error('Error fetching current time:', error)
    }
  }

  useEffect(() => {
    if (currentTime !== null) {
      checkDateValidity()
    }
  }, [currentTime])

  const checkDateValidity = () => {
    try {
      if (!currentTime) return // Wait until current time is fetched
      const currentDate = new Date(currentTime)
      console.log('Current date:', currentDate)
      const fixedDate = new Date('2024-05-01')
      console.log('Fixed date:', fixedDate)

      const differenceInDays = Math.floor((currentDate - fixedDate) / (1000 * 60 * 60 * 24))
      console.log('Difference in days:', differenceInDays)

      setIsValidDate(differenceInDays <= 15)
    } catch (error) {
      console.error('Error checking date validity:', error)
      setIsValidDate(false)
    }
  }

  if (!isOnline) {
    return (
      <Container>
        <Row className="mt-5">
          <Col md={{ size: 6, offset: 3 }}>
            <Alert color="warning" className="text-center">
              Please turn on your internet to run the software!
            </Alert>
          </Col>
        </Row>
      </Container>
    )
  }

  if (!isValidDate) {
    return (
      <Container>
        <Row className="mt-5">
          <Col md={{ size: 6, offset: 3 }}>
            <Alert color="danger" className="text-center">
              Program Expired. Please contact support.
            </Alert>
          </Col>
        </Row>
      </Container>
    )
  }

  return (
    <>
      {isLoading ? ( // Render loader if isLoading is true
        <Spinner animation="border" role="status">
          <span className="sr-only">Loading...</span>
        </Spinner>
      ) : (
        <>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/CreateFolder" element={<CreateFolder />} />
              <Route path="/ExtractPdf" element={<ExtractPdf />} />
            </Routes>
          </BrowserRouter>
          <Footer />
        </>
      )}
    </>
  )
}

export default App
