import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Link } from 'react-router-dom'
import { Container, Row, Col, Button, Input } from 'reactstrap'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`

// pdfjs.GlobalWorkerOptions.workerSrc =`../../../node_modules/pdfjs-dist/build/pdf.worker.js`
const ExtractPdf = () => {
  const initialFileInfo = { name: '', startPage: '', endPage: '' }

  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)

  // console.log('page num ==>', pageNumber, numPages)
  const [pdfFile, setPdfFile] = useState(null)
  const [filesInfo, setFilesInfo] = useState([initialFileInfo])
  const [pdfPath, setPdfPath] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const fileInputRefs = useRef([])
  // console.log("fileInputRefs==>", fileInputRefs);
  const onDocumentLoadSuccess = ({ numPages }) => {
    // console.log('numPages ==>', numPages)
    setSuccessMessage('')
    setNumPages(numPages)
  }

  const changePage = (offset) => {
    setPageNumber((prevPageNumber) => prevPageNumber + offset)
  }

  const previousPage = () => {
    changePage(-1)
  }

  const nextPage = () => {
    changePage(1)
  }

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0]

    console.log('file==>', file)
    setPdfFile(file)
    setPageNumber(1)
  }

  const addMoreFields = useCallback(() => {
    setFilesInfo([...filesInfo, initialFileInfo])
  }, [filesInfo])

  useEffect(() => {
    const newIndex = filesInfo.length - 1
    if (fileInputRefs.current[newIndex]) {
      fileInputRefs.current[newIndex].focus()
    }
  }, [filesInfo.length])

  const removeFields = (indexToRemove) => {
    setFilesInfo(filesInfo.filter((_, index) => index !== indexToRemove))
  }

  const handleFileNameChange = useCallback(
    (index, value) => {
      const updatedFilesInfo = [...filesInfo]
      updatedFilesInfo[index].name = value
      setFilesInfo(updatedFilesInfo)
    },
    [filesInfo]
  )

  const handleStartPageChange = useCallback(
    (index, value) => {
      const updatedFilesInfo = [...filesInfo]
      updatedFilesInfo[index].startPage = value
      setFilesInfo(updatedFilesInfo)
    },
    [filesInfo]
  )

  const handleEndPageChange = useCallback(
    (index, value) => {
      const updatedFilesInfo = [...filesInfo]
      updatedFilesInfo[index].endPage = value
      setFilesInfo(updatedFilesInfo)
    },
    [filesInfo]
  )

  const handlePdfPathChange = useCallback((e) => {
    setPdfPath(e.target.value)
  }, [])
  const clearForm = () => {
    console.log("called")
    const input = document.querySelector('input[type="file"]');
    if (input) {
      input.value = "";
    }
    setPdfFile(null)
    setFilesInfo([initialFileInfo])
    setPdfPath('')
    setError('')
    setSuccessMessage('PDFs created successfully')
  }

  const sendToIPCMain = async () => {
    const pdfFileName = pdfFile.name
    const uploadedFilePath = pdfFile.path

    const formData = { uploadedFilePath, pdfFileName, pdfPath, filesInfo }
    console.log('Sending PDF file to main process...', formData)

    await window.electron.ipcRenderer.send('create-pdfs', formData)
  }

  const createPdf = async () => {
    // Check if any required field is empty
    const isAnyFieldEmpty = filesInfo.some((info) => !info.name || !info.startPage || !info.endPage)

    if (!pdfPath || isAnyFieldEmpty) {
      setError('Please fill all required fields.')
      return
    }

    // Check if start page <= end page for each file input
    const isValidPageRange = filesInfo.every(
      (info) => parseInt(info.startPage) <= parseInt(info.endPage)
    )

    if (!isValidPageRange) {
      setError('end page count can not be smaller then start page')
      return
    }
    try {
      const res = sendToIPCMain()
      console.log('res ==>', res)
      clearForm()
    } catch (error) {
      console.error('Error:', error)
      setError('Internal Server Error')
    }
  }

  // Clear error message
  const clearError = () => {
    setError('')
  }

  // Rendering logic for multiple file inputs
  const renderFileInputs = () => {
    return filesInfo.map((info, index) => (
      <Row key={index} className="mt-3 mb-3">
        <Col md="1"></Col>
        <Col md="3">
          <Input
            className="mb-2"
            type="text"
            placeholder="File Name"
            value={info.name}
            onChange={(e) => handleFileNameChange(index, e.target.value)}
            innerRef={(inputRef) => (fileInputRefs.current[index] = inputRef)}
          />
        </Col>
        <Col md="2">
          <Input
            className="mb-2"
            type="number"
            placeholder="Start Page"
            value={info.startPage}
            onChange={(e) => handleStartPageChange(index, e.target.value)}
          />
        </Col>
        <Col md="2">
          <Input
            className="mb-2"
            type="number"
            placeholder="End Page"
            value={info.endPage}
            onChange={(e) => handleEndPageChange(index, e.target.value)}
          />
        </Col>

        <Col md="1">
          {index === filesInfo.length - 1 && (
            <Button color="primary" onClick={addMoreFields}>
              Add
            </Button>
          )}
        </Col>
        <Col md="1">
          {index > 0 && (
            <Button color="danger" className="ms-2" onClick={() => removeFields(index)}>
              Remove
            </Button>
          )}
        </Col>

        <Col md="2"></Col>
      </Row>
    ))
  }

  return (
    <Container fluid className='mb-5'>
      <Row className="justify-content-center align-items-center h-100 mt-2">
        <Col md={2}>
          <Link to={'/'}>
            <Button color="dark">Back</Button>
          </Link>
        </Col>
        <Col xs="12" md="8" className="mt-5">
          <div className="border border-black p-3 rounded mb-3">
            <h1>PDF Creator</h1>
            <hr />
            <input type="file" onChange={(e) => onDrop(e.target.files)} />
          </div>
        </Col>
      </Row>
      {/* <Row>
        <Col md="12">
          {pdfFile && (
            <>
              <div className="d-flex  justify-content-center">
                <Document file={pdfFile} onLoadSuccess={onDocumentLoadSuccess}>
                </Document>
              </div>

              <div className="mt-2">
                <p className="text-success">
                  Your PDF is uploaded and it has total page range is :{' '}
                  {pageNumber || (numPages ? 1 : '--')} to {numPages || '--'}
                </p>
              </div>
            </>
          )}
        </Col>
      </Row> */}
      {error && (
        <Row className="mt-2">
          <Col md={{ size: 6, offset: 3 }}>
            <p className="text-danger">{error}</p>
          </Col>
        </Row>
      )}
      {/* {successMessage && (
        <Row className="mt-2">
          <Col md={{ size: 6, offset: 3 }}>
            <p className="text-success">{successMessage}</p>
          </Col>
        </Row>
      )} */}
      {pdfFile && (
        <Row className="mt-3">
          <Col md={{ size: 6, offset: 1 }}>
            <Input
              className="mb-2"
              type="text"
              placeholder="Enter PDF Path"
              value={pdfPath}
              onChange={handlePdfPathChange}
            />
          </Col>
          <Col md={{ size: 3 }}>
            <Button color="primary" onClick={createPdf}>
              Create PDF
            </Button>
          </Col>
        </Row>
      )}
      {pdfFile && renderFileInputs()}
    </Container>
  )
}

export default ExtractPdf
