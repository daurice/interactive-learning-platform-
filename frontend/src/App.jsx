import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'

const API = 'http://localhost:8000/api'

export default function App() {
  const [code, setCode] = useState('node user { has name; }\nedge knows { has strength; }')
  const [output, setOutput] = useState('Run some Jac code!')
  const [quizOutput, setQuizOutput] = useState('Generate a quiz!')
  const [topic, setTopic] = useState('Walkers')
  const [username, setUsername] = useState('Alice')
  const [progress, setProgress] = useState([])

  const runCode = async () => {
    setOutput('⏳ Executing...')
    try {
      const res = await fetch(`${API}/execute`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({code})
      })
      const data = await res.json()
      setOutput(data.success ? `✅ Success!\n\n${data.output}` : `❌ Error:\n${data.error}`)
    } catch (e) {
      setOutput(`❌ Error: ${e.message}`)
    }
  }

  const generateQuiz = async () => {
    setQuizOutput(`🤖 Generating quiz for '${topic}'...`)
    try {
      const res = await fetch(`${API}/quiz`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({topic_name: topic, difficulty: 2})
      })
      const data = await res.json()
      setQuizOutput(`📚 Topic: ${data.topic}\n\n${data.quiz}`)
    } catch (e) {
      setQuizOutput(`❌ Error: ${e.message}`)
    }
  }

  const loadProgress = async () => {
    try {
      const res = await fetch(`${API}/progress/${username}`)
      const data = await res.json()
      setProgress(data.progress || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => { loadProgress() }, [])

  return (
    <div style={{padding: '20px', maxWidth: '1200px', margin: '0 auto'}}>
      <h1 style={{textAlign: 'center', marginBottom: '30px'}}>🎓 Interactive Jaseci Learning Platform</h1>
      
      <div style={{background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '20px', marginBottom: '20px'}}>
        <h2>👤 Learner Profile</h2>
        <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
          <input value={username} onChange={e => setUsername(e.target.value)} style={{background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', padding: '8px', borderRadius: '4px'}} />
          <button onClick={loadProgress} style={{background: '#21262d', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'}}>Load Progress</button>
        </div>
        <div style={{display: 'flex', gap: '15px', marginTop: '15px', flexWrap: 'wrap'}}>
          {progress.map(p => (
            <div key={p.topic} style={{background: '#21262d', padding: '10px 15px', borderRadius: '4px'}}>
              {p.topic}: {(p.score * 100).toFixed(0)}%
            </div>
          ))}
        </div>
      </div>

      <div style={{background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '20px', marginBottom: '20px'}}>
        <h2>💻 Code Editor</h2>
        <Editor height="200px" defaultLanguage="javascript" theme="vs-dark" value={code} onChange={setCode} />
        <button onClick={runCode} style={{background: '#238636', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', marginTop: '15px'}}>▶️ Run Code</button>
        <pre style={{background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', padding: '15px', marginTop: '10px', whiteSpace: 'pre-wrap'}}>{output}</pre>
      </div>

      <div style={{background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '20px'}}>
        <h2>📝 AI Quiz Generator</h2>
        <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
          <select value={topic} onChange={e => setTopic(e.target.value)} style={{background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', padding: '8px', borderRadius: '4px'}}>
            <option>Jac Basics</option>
            <option>Walkers</option>
            <option>OSP Graphs</option>
            <option>byLLM Agents</option>
            <option>Jac Client</option>
          </select>
          <button onClick={generateQuiz} style={{background: '#238636', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'}}>🎲 Generate Quiz</button>
        </div>
        <pre style={{background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', padding: '15px', marginTop: '10px', whiteSpace: 'pre-wrap', color: '#fbbf24'}}>{quizOutput}</pre>
      </div>
    </div>
  )
}
