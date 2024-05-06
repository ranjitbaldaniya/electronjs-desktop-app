import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container,
  Row,
  Col,
  Button,
  Card,
  CardBody,
  Input,
  Spinner,
  FormGroup,
  Label,
  InputGroup
} from 'reactstrap'
import * as XLSX from 'xlsx'
// import { ipcRenderer } from 'electron';

const CreateFolder = () => {
  const [error, setError] = useState(null)
  const [excelData, setExcelData] = useState([])
  // console.log("excelData  ===>", excelData);
  const [successMessage, setSuccessMessage] = useState('')

  const [selectedDoctors, setSelectedDoctors] = useState([])
  // console.log("selectedDoctors ===>", selectedDoctors);

  const [selectedPath, setSelectedPath] = useState('')

  // console.log("selected path ===>", selectedPath);
  const [loading, setLoading] = useState(false)

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      setLoading(true)
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        // console.log("parsed xlsx data ===>", parsedData);

        // Filter out rows with empty data
        const filteredData = parsedData.filter(
          (row) => row.length > 0 && row.some((cell) => cell !== null && cell !== undefined)
        )
        // console.log("filteredData ===>", filteredData);

        const lastDate = filteredData[filteredData.length - 1][1]

        // console.log("lastDate ===>", lastDate);

        // Group data based on the last date
        const groupedData = {}
        filteredData.forEach((row) => {
          const date = row[1]
          if (date === lastDate) {
            if (!groupedData[date]) {
              groupedData[date] = []
            }
            groupedData[date].push(row)
          }
        })

        // console.log("Grouped data based on the last date:", groupedData);

        // console.log(
        //   "Grouped data based on Today's Date:==>",
        //   groupedData["03.01.2024"]
        // );

        const docIdIndex = parsedData[0].indexOf('DOC ID')
        const doctorNameIndex = parsedData[0].indexOf('Doctor name')
        const todaysDateIndex = parsedData[0].indexOf("Today's Date")
        const reportTypeIndex = parsedData[0].indexOf('Report type')
        const patientNameIndex = parsedData[0].indexOf('Patient name')
        const vendorIndex = parsedData[0].indexOf('vendor')
        const doctorsArray = parsedData.slice(1).map((row) => ({
          docId: row[docIdIndex],
          doctorName: row[doctorNameIndex],
          todaysDate: row[todaysDateIndex],
          reportType: row[reportTypeIndex],
          patientName: row[patientNameIndex],
          vendor: row[vendorIndex]
        }))
        const filteredDocArray = doctorsArray.filter((row) => row.todaysDate === lastDate)
        groupedData[lastDate] = filteredData

        setExcelData(filteredDocArray)
        setSuccessMessage('')
        setLoading(false)
      }
      reader.readAsArrayBuffer(file)
    } else {
      setError('Please upload an Excel file (.xlsx).')
    }
  }

  const handleRemoveFile = () => {
    setExcelData([])
    setSelectedDoctors([])
    setSelectedPath('')
    setError(null)
    // Reset the input field value
    const input = document.getElementById('fileInput')
    if (input) {
      input.value = null
    }
  }

  const handleDoctorCheckboxChange = (selectedDoctor) => {
    console.log(' checkbox click ==>', selectedDoctor)

    setSelectedDoctors((prevSelectedDoctors) => {
      const index = prevSelectedDoctors.findIndex((doctor) => doctor.docId === selectedDoctor.docId)
      if (index !== -1) {
        const updatedDoctors = [...prevSelectedDoctors]
        updatedDoctors.splice(index, 1)
        return updatedDoctors
      } else {
        return [...prevSelectedDoctors, selectedDoctor]
      }
    })
  }

  const handleMasterCheckboxChange = (doctorName) => {
    // console.log("master checkbox click ==>" , doctorName)
    const doctorData = excelData.filter((doctor) => doctor.doctorName === doctorName)
    if (
      doctorData.every((doctor) =>
        selectedDoctors.some((selectedDoctor) => Object.is(selectedDoctor, doctor))
      )
    ) {
      setSelectedDoctors((prevSelectedDoctors) =>
        prevSelectedDoctors.filter(
          (doctor) => !doctorData.some((selectedDoctor) => Object.is(doctor, selectedDoctor))
        )
      )
    } else {
      setSelectedDoctors((prevSelectedDoctors) => [...prevSelectedDoctors, ...doctorData])
    }
  }

  const handleCreateFolder = () => {
    handleFoldersDataSubmit()
  }

  const sendToIPCMain = async (selectedDoctors, selectedPath) => {
    await window.electron.ipcRenderer.send('create-folders', { selectedDoctors, selectedPath })
  }

  const handleFoldersDataSubmit = async () => {
    setLoading(true)
    try {
      const res = sendToIPCMain(selectedDoctors, selectedPath)
      console.log('res --->', res)
      setSuccessMessage('Folders created successfully')
      handleRemoveFile()
    } catch (error) {
      console.error('Error creating folders:', error)
      setError('Failed to create folders. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container>
      <Row className="justify-content-center align-items-center h-100 mt-2">
        <Col md={2} className="">
          <Link to={'/'}>
            <Button color="dark">Back</Button>
          </Link>
        </Col>
        <Col md={10} className="mt-5">
          <div className="border border-black p-3 rounded mb-3">
            <h1>Excel Folder Creator</h1>
            <hr />
            <input type="file" accept=".xlsx" onChange={handleFileUpload} id="fileInput" />
            {error && <div className="text-danger">{error}</div>}
          </div>
        </Col>
      </Row>
      {/* {successMessage && (
        <Row className="mt-2">
          <Col md={{ size: 6, offset: 3 }}>
            <p className="text-success">{successMessage}</p>
          </Col>
        </Row>
      )} */}
      <Row>
        <Col md={12} className="mt-5">
          {loading ? (
            <div className="text-center">
              <Spinner color="primary" />
            </div>
          ) : (
            excelData.length > 0 && (
              <div>
                <h4>Uploaded Excel Data:</h4>

                <Row>
                  <Col md={6}>
                    <FormGroup className="ms-2 mb-2">
                      <Label for="folderPath">Enter Folder Path:</Label>
                      <InputGroup>
                        <Input
                          type="text"
                          id="folderPath"
                          placeholder="Enter folder path..."
                          value={selectedPath}
                          onChange={(e) => setSelectedPath(e.target.value)}
                        />
                      </InputGroup>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    {' '}
                    <div className="d-flex justify-content-end mt-4">
                      <Button color="danger" onClick={handleRemoveFile} className="">
                        Remove Uploaded File
                      </Button>

                      <Button
                        className="ms-3"
                        color="primary"
                        onClick={handleCreateFolder}
                        disabled={selectedPath.length === 0 || selectedDoctors.length <= 0}
                      >
                        Create Folder
                      </Button>
                    </div>
                  </Col>
                </Row>
                <Row>
                  {Array.from(new Set(excelData.map((doctor) => doctor.doctorName))).map(
                    (doctorName, index) => {
                      const doctorData = excelData.filter(
                        (doctor) => doctor.doctorName === doctorName
                      )
                      return (
                        <Col md={12} key={index}>
                          <Card className="mb-3">
                            <CardBody>
                              <h5>{doctorName}</h5>
                              <Input
                                type="checkbox"
                                onChange={() => handleMasterCheckboxChange(doctorName)}
                                checked={doctorData.every((doctor) =>
                                  selectedDoctors.some((selectedDoctor) =>
                                    Object.is(selectedDoctor, doctor)
                                  )
                                )}
                                style={{
                                  position: 'absolute',
                                  top: '10px',
                                  right: '10px',
                                  cursor: 'pointer',
                                  border: '1px solid gray'
                                }}
                              />
                              <div>
                                <Row>
                                  {doctorData.map((doctor, index) => (
                                    <Col md={3} key={index}>
                                      <Card
                                        className="mb-3 "
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleDoctorCheckboxChange(doctor)}
                                      >
                                        <CardBody style={{ position: 'relative' }}>
                                          <Input
                                            type="checkbox"
                                            id={`doctor-${doctor.docId}`}
                                            checked={selectedDoctors.some(
                                              (selectedDoctor) =>
                                                selectedDoctor.docId === doctor.docId
                                            )}
                                            onChange={(e) => {
                                              e.stopPropagation() // Prevent parent onClick event from firing
                                              handleDoctorCheckboxChange(e, doctor)
                                            }}
                                            style={{
                                              position: 'absolute',
                                              top: '-2px',
                                              right: '1px',
                                              cursor: 'pointer',
                                              // color:"red",
                                              // background:"red"
                                              border: '1px solid gray'
                                            }}
                                          />
                                          <p
                                            htmlFor={`doctor-${doctor.docId}`}
                                            className="ml-2 fw-bold"
                                          >
                                            {doctor.doctorName} - {doctor.docId}
                                          </p>
                                          <p className="fw-bold">
                                            Patient Name :- {doctor.patientName}
                                          </p>
                                          <p className="fw-bold">Date :- {doctor.todaysDate}</p>
                                        </CardBody>
                                      </Card>
                                    </Col>
                                  ))}
                                </Row>
                              </div>
                            </CardBody>
                          </Card>
                        </Col>
                      )
                    }
                  )}
                </Row>
              </div>
            )
          )}
        </Col>
      </Row>
    </Container>
  )
}

export default CreateFolder
