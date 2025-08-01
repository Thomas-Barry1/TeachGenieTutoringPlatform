'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { DocumentArrowUpIcon, DocumentTextIcon, AcademicCapIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { createClient } from '@/lib/supabase/client'

// Add custom styles for the collapsible disclaimer
const disclaimerStyles = `
  details[open] summary svg {
    transform: rotate(180deg);
  }
  
  details summary {
    list-style: none;
  }
  
  details summary::-webkit-details-marker {
    display: none;
  }
`

interface ExamPrediction {
  predictedScore: number
  confidence: number
  keyTopics: string[]
  weakAreas: string[]
  studyRecommendations: string[]
  practiceQuestions: string[]
  estimatedStudyTime: string
}

export default function ExamPredictorPage() {
  return <div>Coming Soon</div>
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [prediction, setPrediction] = useState<ExamPrediction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [examType, setExamType] = useState('')
  const [legalConsent, setLegalConsent] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles)
    setError(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024 // 10MB per file
  })

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const analyzeMaterials = async () => {
    if (!subject || !examType || files.length === 0) {
      setError('Please provide subject, exam type, and upload at least one file')
      return
    }

    if (!legalConsent) {
      setError('You must agree to the legal terms before proceeding')
      return
    }

    setAnalyzing(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Upload files to Supabase Storage
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const fileName = `${Date.now()}-${file.name}`
          const { data, error } = await supabase.storage
            .from('exam-materials')
            .upload(fileName, file)

          if (error) throw error
          return { fileName, originalName: file.name }
        })
      )

      // Call AI exam prediction API
      const response = await fetch('/api/ai/exam-prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'predict_exam',
          subject,
          examType,
          materials: uploadedFiles.map(f => f.fileName),
          materialNames: uploadedFiles.map(f => f.originalName)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze materials')
      }

      const result = await response.json()
      setPrediction(result.data)

    } catch (err) {
      console.error('Error analyzing materials:', err)
      setError('Failed to analyze materials. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const clearAll = () => {
    setFiles([])
    setSubject('')
    setExamType('')
    setPrediction(null)
    setError(null)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <style dangerouslySetInnerHTML={{ __html: disclaimerStyles }} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam Predictor</h1>
        <p className="text-gray-600">
          Upload your study materials and get AI-powered predictions for your upcoming exam
        </p>
        
        {/* Legal Disclaimers */}
        <details className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <summary className="cursor-pointer p-4 hover:bg-yellow-100 transition-colors">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Important Legal Notice (Click to expand)</h3>
                <p className="text-xs text-yellow-600 mt-1">Please read before uploading materials</p>
              </div>
              <div className="ml-auto">
                <svg className="h-4 w-4 text-yellow-400 transform transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </summary>
          <div className="px-4 pb-4 text-sm text-yellow-700">
            <p className="mb-2">
              <strong>By uploading materials, you confirm that:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>You own the copyright to all uploaded materials, OR</li>
              <li>You have explicit permission from the copyright owner, OR</li>
              <li>The materials are in the public domain or under fair use</li>
            </ul>
            <p className="mt-2">
              <strong>AI Processing Notice:</strong> Uploaded materials will be processed by AI systems to generate predictions. 
              By using this feature, you grant TeachGenie a license to use your materials for AI analysis and platform improvement.
            </p>
            <p className="mt-2">
              <strong>Accuracy Disclaimer:</strong> AI predictions are estimates based on uploaded materials and should not be 
              considered as guaranteed outcomes. Always consult with your instructors for official guidance.
            </p>
          </div>
        </details>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Materials</h2>
            
            {/* Subject and Exam Type */}
            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Mathematics, Physics, History"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label htmlFor="examType" className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Type
                </label>
                <select
                  id="examType"
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select exam type</option>
                  <option value="midterm">Midterm Exam</option>
                  <option value="final">Final Exam</option>
                  <option value="quiz">Quiz</option>
                  <option value="test">Test</option>
                  <option value="assignment">Assignment</option>
                </select>
              </div>
            </div>

            {/* File Upload */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-400'
              }`}
            >
              <input {...getInputProps()} />
              <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              {isDragActive ? (
                <p className="text-primary-600">Drop the files here...</p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">
                    Drag & drop files here, or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports PDF, DOC, DOCX, TXT, and images (max 10MB each)
                  </p>
                </div>
              )}
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h3>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legal Consent Checkbox */}
            <div className="mt-6">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={legalConsent}
                  onChange={(e) => setLegalConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  I confirm that I have the legal right to upload these materials and understand that they will be processed by AI systems. 
                  I have read and agree to the{' '}
                  <a href="/TERMS" target="_blank" className="text-primary-600 hover:text-primary-500 underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/PRIVACY" target="_blank" className="text-primary-600 hover:text-primary-500 underline">
                    Privacy Policy
                  </a>
                  , including the AI processing and copyright provisions.
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex space-x-3">
              <button
                onClick={analyzeMaterials}
                disabled={analyzing || files.length === 0 || !subject || !examType || !legalConsent}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {analyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <AcademicCapIcon className="h-4 w-4 mr-2" />
                    Analyze Materials
                  </>
                )}
              </button>
              
              <button
                onClick={clearAll}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Clear All
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {prediction ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Exam Prediction Results</h2>
              
              {/* Score Prediction */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900">Predicted Score</h3>
                  <span className="text-sm text-gray-500">
                    Confidence: {prediction.confidence}%
                  </span>
                </div>
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary-600">
                      {prediction.predictedScore}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Topics */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Key Topics to Focus On</h3>
                <div className="space-y-2">
                  {prediction.keyTopics.map((topic, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-gray-700">{topic}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weak Areas */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Areas Needing Improvement</h3>
                <div className="space-y-2">
                  {prediction.weakAreas.map((area, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                      <span className="text-gray-700">{area}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Study Recommendations */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Study Recommendations</h3>
                <div className="space-y-2">
                  {prediction.studyRecommendations.map((rec, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2"></div>
                      <span className="text-gray-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estimated Study Time */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Estimated Study Time</h3>
                <div className="bg-blue-50 rounded-lg p-3">
                  <span className="text-blue-700 font-medium">{prediction.estimatedStudyTime}</span>
                </div>
              </div>

              {/* Practice Questions */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Suggested Practice Questions</h3>
                <div className="space-y-2">
                  {prediction.practiceQuestions.map((question, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <span className="text-gray-700 text-sm">{question}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-12">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Yet</h3>
                <p className="text-gray-600">
                  Upload your study materials and click &quot;Analyze Materials&quot; to get your exam prediction.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="text-center text-sm text-gray-500">
          <p>
            By using the Exam Predictor, you acknowledge that AI predictions are estimates only and should not replace 
            professional academic guidance. TeachGenie is not responsible for decisions made based on AI-generated content.
          </p>
          <p className="mt-2">
            For questions about copyright, data usage, or to submit takedown requests, contact us at{' '}
            <a href="mailto:teachgenieai@gmail.com" className="text-primary-600 hover:text-primary-500">
              teachgenieai@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
} 