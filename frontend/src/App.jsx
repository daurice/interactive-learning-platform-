import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'

const API = 'http://localhost:8000/api'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authMode, setAuthMode] = useState('signin')
  const [page, setPage] = useState('profile')
  const [code, setCode] = useState('node user { has name; }\nedge knows { has strength; }')
  const [output, setOutput] = useState('Run some Jac code!')
  const [quizOutput, setQuizOutput] = useState('Generate a quiz!')
  const [topic, setTopic] = useState('Walkers')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [progress, setProgress] = useState([])
  const [codeError, setCodeError] = useState('')
  const [recommendations, setRecommendations] = useState({unlocked: [], locked: []})

  const runCode = async () => {
    setOutput('Validating...')
    setCodeError('')
    try {
      const res = await fetch(`${API}/execute`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({code})
      })
      const data = await res.json()
      if (data.success) {
        setOutput(`Success!\n\n${data.output}`)
        setCodeError('')
      } else {
        setOutput(`Error:\n${data.error}`)
        setCodeError(data.error)
      }
    } catch (e) {
      setOutput(`Error: ${e.message}`)
      setCodeError(e.message)
    }
  }

  const generateQuiz = async () => {
    setQuizOutput(`Generating quiz for '${topic}'...`)
    try {
      const res = await fetch(`${API}/quiz`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({topic_name: topic, difficulty: 2})
      })
      const data = await res.json()
      setQuizOutput(`Topic: ${data.topic}\n\n${data.quiz}`)
    } catch (e) {
      setQuizOutput(`Error: ${e.message}`)
    }
  }

  const loadProgress = async () => {
    try {
      const res = await fetch(`${API}/progress/${username}`)
      const data = await res.json()
      setProgress(data.progress || [])
      
      const recRes = await fetch(`${API}/recommend/${username}`)
      const recData = await recRes.json()
      setRecommendations(recData)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => { if (username && isLoggedIn) loadProgress() }, [username, isLoggedIn])

  const handleAuth = () => {
    if (authMode === 'signin') {
      if (username && password) {
        setIsLoggedIn(true)
        loadProgress()
      }
    } else {
      if (username && email && password) {
        setIsLoggedIn(true)
        loadProgress()
      }
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUsername('')
    setPassword('')
    setEmail('')
    setProgress([])
    setRecommendations({unlocked: [], locked: []})
  }

  const saveProfile = () => {
    setEditMode(false)
    loadProgress()
  }

  if (!isLoggedIn) {
    return (
      <div style={{minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '40px', width: '400px'}}>
          <h1 style={{textAlign: 'center', marginBottom: '30px', color: '#58a6ff'}}>Jaseci Learning Platform</h1>
          <div style={{display: 'flex', gap: '10px', marginBottom: '30px'}}>
            <button onClick={() => setAuthMode('signin')} style={{flex: 1, background: authMode === 'signin' ? '#238636' : '#21262d', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer'}}>Sign In</button>
            <button onClick={() => setAuthMode('signup')} style={{flex: 1, background: authMode === 'signup' ? '#238636' : '#21262d', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer'}}>Sign Up</button>
          </div>
          <div style={{display: 'grid', gap: '15px'}}>
            <div>
              <label style={{display: 'block', marginBottom: '5px', color: '#8b949e'}}>Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} style={{width: '100%', background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', padding: '10px', borderRadius: '4px'}} />
            </div>
            {authMode === 'signup' && (
              <div>
                <label style={{display: 'block', marginBottom: '5px', color: '#8b949e'}}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{width: '100%', background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', padding: '10px', borderRadius: '4px'}} />
              </div>
            )}
            <div>
              <label style={{display: 'block', marginBottom: '5px', color: '#8b949e'}}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{width: '100%', background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', padding: '10px', borderRadius: '4px'}} />
            </div>
            <button onClick={handleAuth} style={{background: '#238636', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', marginTop: '10px', fontSize: '16px'}}>{authMode === 'signin' ? 'Sign In' : 'Sign Up'}</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight: '100vh', background: '#0d1117'}}>
      <nav style={{background: '#161b22', borderBottom: '1px solid #30363d', padding: '15px 20px', marginBottom: '20px'}}>
        <div style={{maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '20px', alignItems: 'center'}}>
          <h1 style={{margin: 0, fontSize: '20px', color: '#58a6ff'}}>Jaseci Learning</h1>
          <button onClick={() => setPage('profile')} style={{background: page === 'profile' ? '#238636' : 'transparent', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'}}>Profile</button>
          <button onClick={() => setPage('skillmap')} style={{background: page === 'skillmap' ? '#238636' : 'transparent', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'}}>Skill Map</button>
          <button onClick={() => setPage('editor')} style={{background: page === 'editor' ? '#238636' : 'transparent', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'}}>Code Editor</button>
          <button onClick={() => setPage('quiz')} style={{background: page === 'quiz' ? '#238636' : 'transparent', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'}}>AI Quiz</button>
          <div style={{marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center'}}>
            <span style={{color: '#8b949e'}}>{username}</span>
            <button onClick={handleLogout} style={{background: '#da3633', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'}}>Logout</button>
          </div>
        </div>
      </nav>
      <div style={{padding: '20px', maxWidth: '1200px', margin: '0 auto'}}>
      
        {page === 'profile' && (
          <div style={{background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '20px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2>Learner Profile</h2>
              <button onClick={() => editMode ? saveProfile() : setEditMode(true)} style={{background: '#238636', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'}}>{editMode ? 'Save' : 'Edit'}</button>
            </div>
            <div style={{display: 'grid', gap: '15px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '5px', color: '#8b949e'}}>Username</label>
                <input value={username} onChange={e => setUsername(e.target.value)} disabled={!editMode} style={{width: '100%', background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', padding: '10px', borderRadius: '4px'}} />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '5px', color: '#8b949e'}}>Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} disabled={!editMode} style={{width: '100%', background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', padding: '10px', borderRadius: '4px'}} />
              </div>
            </div>
            <div style={{marginTop: '30px'}}>
              <h3 style={{marginBottom: '15px'}}>Progress Overview</h3>
              <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
                {progress.map(p => (
                  <div key={p.topic} style={{background: '#21262d', padding: '15px 20px', borderRadius: '6px', minWidth: '150px'}}>
                    <div style={{fontSize: '14px', color: '#8b949e', marginBottom: '5px'}}>{p.topic}</div>
                    <div style={{fontSize: '24px', fontWeight: 'bold', color: '#58a6ff'}}>{(p.score * 100).toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {page === 'skillmap' && (
          <div style={{background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '20px'}}>
            <h2>Skill Map - Adaptive Learning</h2>
            <div style={{marginTop: '20px'}}>
              <h3 style={{color: '#3fb950', fontSize: '18px', marginBottom: '15px'}}>Unlocked Topics (Ready to Learn)</h3>
              <div style={{display: 'grid', gap: '15px'}}>
                {recommendations.unlocked?.map(t => (
                  <div key={t.name} style={{background: '#1a472a', border: '1px solid #3fb950', padding: '15px', borderRadius: '6px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div>
                        <div style={{fontSize: '16px', fontWeight: 'bold', marginBottom: '5px'}}>{t.name}</div>
                        <div style={{fontSize: '14px', color: '#8b949e'}}>Difficulty: {t.difficulty} | Current: {(t.current_score * 100).toFixed(0)}%</div>
                      </div>
                      <button onClick={() => setPage('quiz')} style={{background: '#238636', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'}}>Start Learning</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{marginTop: '30px'}}>
              <h3 style={{color: '#f85149', fontSize: '18px', marginBottom: '15px'}}>Locked Topics (Complete Prerequisites)</h3>
              <div style={{display: 'grid', gap: '15px'}}>
                {recommendations.locked?.map(t => (
                  <div key={t.name} style={{background: '#4c1f1f', border: '1px solid #f85149', padding: '15px', borderRadius: '6px'}}>
                    <div style={{fontSize: '16px', fontWeight: 'bold', marginBottom: '5px'}}>{t.name}</div>
                    <div style={{fontSize: '14px', color: '#8b949e'}}>Required: {t.missing_prereqs?.map(m => `${m.topic} (${(m.required * 100).toFixed(0)}%)`).join(', ')}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {page === 'editor' && (
          <div style={{background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '20px'}}>
            <h2>Code Editor</h2>
            {codeError && <div style={{background: '#da3633', color: 'white', padding: '8px 12px', borderRadius: '4px', marginBottom: '10px', fontSize: '14px'}}>{codeError}</div>}
            <Editor height="400px" defaultLanguage="javascript" theme="vs-dark" value={code} onChange={setCode} />
            <button onClick={runCode} style={{background: '#238636', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', marginTop: '15px'}}>Run Code</button>
            <pre style={{background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', padding: '15px', marginTop: '10px', whiteSpace: 'pre-wrap', minHeight: '100px'}}>{output}</pre>
          </div>
        )}

        {page === 'quiz' && (
          <div style={{background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '20px'}}>
            <h2>AI Quiz Generator</h2>
            <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
              <select value={topic} onChange={e => setTopic(e.target.value)} style={{flex: 1, background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', padding: '10px', borderRadius: '4px'}}>
                <option>Jac Basics</option>
                <option>Walkers</option>
                <option>OSP Graphs</option>
                <option>byLLM Agents</option>
                <option>Jac Client</option>
              </select>
              <button onClick={generateQuiz} style={{background: '#238636', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer'}}>Generate Quiz</button>
            </div>
            <pre style={{background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', padding: '20px', marginTop: '15px', whiteSpace: 'pre-wrap', color: '#fbbf24', minHeight: '200px', fontSize: '14px', lineHeight: '1.6'}}>{quizOutput}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
