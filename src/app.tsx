import {useState} from 'react'
import {ActionBar, Editor, Issues, Labels} from '@/components'
import 'github-markdown-css'

import '@/app.css'

export default function App() {
  const [issuesVisible, setIssuesVisible] = useState(true)
  const [labelsVisible, setLabelsVisible] = useState(false)

  return (
    <div className="app">
      <Editor />
      <Issues visible={issuesVisible} onIssuesVisible={setIssuesVisible} />
      <Labels visible={labelsVisible} onLabelsVisible={setLabelsVisible} />
      <ActionBar onLabelsVisible={setLabelsVisible} onIssuesVisible={setIssuesVisible} />
    </div>
  )
}
