import fs from 'fs'
import path from 'path'
import { marked } from 'marked'

export function getTermsHtml() {
  const filePath = path.join(process.cwd(), 'TERMS.md')
  const file = fs.readFileSync(filePath, 'utf-8')
  return marked.parse(file)
} 