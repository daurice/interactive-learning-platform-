import { useState, useEffect, useRef } from 'react'
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
  const [editorTheme, setEditorTheme] = useState('vs-dark')
  const [colorScheme, setColorScheme] = useState('default')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [editorKey, setEditorKey] = useState(0)
  const [dashboardData, setDashboardData] = useState({})
  const [classrooms, setClassrooms] = useState([])
  const [schedule, setSchedule] = useState([])
  const [chapters, setChapters] = useState([])
  const editorRef = useRef(null)

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor
    const scheme = colorSchemes[colorScheme]
    const fgHex = scheme.fg.replace('#', '')
    monaco.editor.defineTheme('customTheme', {
      base: scheme.theme === 'light' ? 'vs' : 'vs-dark',
      inherit: false,
      rules: [
        {token: '', foreground: fgHex},
        {token: 'keyword', foreground: fgHex},
        {token: 'string', foreground: fgHex},
        {token: 'number', foreground: fgHex},
        {token: 'comment', foreground: fgHex},
        {token: 'identifier', foreground: fgHex},
        {token: 'delimiter', foreground: fgHex}
      ],
      colors: {
        'editor.background': scheme.bg,
        'editor.foreground': scheme.fg,
        'editorLineNumber.foreground': scheme.fg,
        'editorCursor.foreground': scheme.fg,
        'editor.selectionBackground': scheme.fg + '40'
      }
    })
    monaco.editor.setTheme('customTheme')
  }

  const colorSchemes = {
    default: {bg: '#1e1e1e', fg: '#d4d4d4', theme: 'vs-dark', name: 'Dark'},
    greenOnBlack: {bg: '#000000', fg: '#00ff00', theme: 'vs-dark', name: 'Green/Black'},
    purpleOnBlack: {bg: '#000000', fg: '#da70d6', theme: 'vs-dark', name: 'Purple/Black'},
    cyanOnBlack: {bg: '#000000', fg: '#00ffff', theme: 'vs-dark', name: 'Cyan/Black'},
    pinkOnBlack: {bg: '#000000', fg: '#ff69b4', theme: 'vs-dark', name: 'Pink/Black'},
    yellowOnBlack: {bg: '#000000', fg: '#ffff00', theme: 'vs-dark', name: 'Yellow/Black'},
    orangeOnBlack: {bg: '#000000', fg: '#ffa500', theme: 'vs-dark', name: 'Orange/Black'},
    blueOnWhite: {bg: '#ffffff', fg: '#0000ff', theme: 'light', name: 'Blue/White'},
    purpleOnWhite: {bg: '#ffffff', fg: '#8b008b', theme: 'light', name: 'Purple/White'},
    greenOnWhite: {bg: '#ffffff', fg: '#006400', theme: 'light', name: 'Green/White'},
    redOnWhite: {bg: '#ffffff', fg: '#dc143c', theme: 'light', name: 'Red/White'},
    pinkOnNavy: {bg: '#000080', fg: '#ff1493', theme: 'vs-dark', name: 'Pink/Navy'},
    goldOnPurple: {bg: '#4b0082', fg: '#ffd700', theme: 'vs-dark', name: 'Gold/Purple'}
  }

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
      
      const dashRes = await fetch(`${API}/dashboard/${username}`)
      const dashData = await dashRes.json()
      setDashboardData(dashData)
    } catch (e) {
      console.error(e)
    }
  }

  const loadClassrooms = async () => {
    try {
      const res = await fetch(`${API}/classrooms`)
      const data = await res.json()
      setClassrooms(data.classrooms || [])
    } catch (e) {
      console.error(e)
    }
  }

  const loadSchedule = async () => {
    try {
      const res = await fetch(`${API}/schedule`)
      const data = await res.json()
      setSchedule(data.events || [])
    } catch (e) {
      console.error(e)
    }
  }

  const loadChapters = async (topicName) => {
    if (!topicName) return
    try {
      const res = await fetch(`${API}/chapters/${topicName}`)
      const data = await res.json()
      setChapters(data.chapters || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => { 
    if (username && isLoggedIn) {
      loadProgress()
      loadClassrooms()
      loadSchedule()
      const interval = setInterval(loadProgress, 5000)
      return () => clearInterval(interval)
    }
  }, [username, isLoggedIn])

  useEffect(() => {
    setEditorKey(prev => prev + 1)
  }, [colorScheme])

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
      <div style={{minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px'}}>
        <div style={{flex: 1, maxWidth: '500px', textAlign: 'center'}}>
          <svg width="300" height="300" viewBox="0 0 300 300" style={{margin: '0 auto'}}>
            <rect width="300" height="300" fill="#161b22" rx="20"/>
            <circle cx="150" cy="100" r="40" fill="#58a6ff"/>
            <rect x="100" y="160" width="100" height="15" fill="#238636" rx="5"/>
            <rect x="80" y="190" width="140" height="15" fill="#8b949e" rx="5"/>
            <rect x="90" y="220" width="120" height="15" fill="#8b949e" rx="5"/>
            <path d="M 50 250 Q 150 270 250 250" stroke="#58a6ff" strokeWidth="3" fill="none"/>
          </svg>
          <h2 style={{color: '#58a6ff', marginTop: '20px'}}>Learn Jaseci with AI</h2>
          <p style={{color: '#8b949e'}}>Interactive coding platform powered by OSP graphs and byLLM</p>
        </div>
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
          <button onClick={() => setPage('dashboard')} style={{background: page === 'dashboard' ? '#238636' : 'transparent', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'}}>Dashboard</button>
          <button onClick={() => setPage('profile')} style={{background: page === 'profile' ? '#238636' : 'transparent', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'}}>Profile</button>
          <button onClick={() => setPage('chapters')} style={{background: page === 'chapters' ? '#238636' : 'transparent', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'}}>Chapters</button>
          <button onClick={() => setPage('classroom')} style={{background: page === 'classroom' ? '#238636' : 'transparent', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'}}>Classroom</button>
          <button onClick={() => setPage('schedule')} style={{background: page === 'schedule' ? '#238636' : 'transparent', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'}}>Schedule</button>
          <button onClick={() => setPage('editor')} style={{background: page === 'editor' ? '#238636' : 'transparent', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'}}>Code Editor</button>
          <button onClick={() => setPage('quiz')} style={{background: page === 'quiz' ? '#238636' : 'transparent', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'}}>AI Quiz</button>
          <div style={{marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center'}}>
            <span style={{color: '#8b949e'}}>{username}</span>
            <button onClick={handleLogout} style={{background: '#da3633', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'}}>Logout</button>
          </div>
        </div>
      </nav>
      <div style={{padding: '20px', maxWidth: '1200px', margin: '0 auto'}}>
      
        {page === 'dashboard' && (
          <div style={{background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '20px'}}>
            <h2>Dashboard</h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px'}}>
              <div style={{background: '#21262d', padding: '20px', borderRadius: '6px', textAlign: 'center'}}>
                <div style={{fontSize: '32px', fontWeight: 'bold', color: '#58a6ff'}}>{dashboardData.study_streak || 0}</div>
                <div style={{color: '#8b949e'}}>Day Streak</div>
              </div>
              <div style={{background: '#21262d', padding: '20px', borderRadius: '6px', textAlign: 'center'}}>
                <div style={{fontSize: '32px', fontWeight: 'bold', color: '#3fb950'}}>{dashboardData.total_time || 0}m</div>
                <div style={{color: '#8b949e'}}>Study Time</div>
              </div>
              <div style={{background: '#21262d', padding: '20px', borderRadius: '6px', textAlign: 'center'}}>
                <div style={{fontSize: '32px', fontWeight: 'bold', color: '#fbbf24'}}>{dashboardData.completed_chapters || 0}/{dashboardData.total_chapters || 0}</div>
                <div style={{color: '#8b949e'}}>Chapters</div>
              </div>
            </div>
            <div style={{marginTop: '30px'}}>
              <h3>Enrolled Classrooms</h3>
              <div style={{display: 'flex', gap: '15px', marginTop: '15px', flexWrap: 'wrap'}}>
                {dashboardData.enrolled_classrooms?.map((c, i) => (
                  <div key={i} style={{background: '#21262d', padding: '15px', borderRadius: '6px'}}>
                    <div style={{fontWeight: 'bold'}}>{c.name}</div>
                    <div style={{color: '#8b949e', fontSize: '14px'}}>Instructor: {c.instructor}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {page === 'chapters' && (
          <div style={{background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '20px'}}>
            <h2>Learning Chapters</h2>
            <select onChange={e => loadChapters(e.target.value)} style={{background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', padding: '10px', borderRadius: '4px', marginTop: '15px'}}>
              <option value="">Select Topic</option>
              <option value="Jac Basics">Jac Basics</option>
              <option value="Walkers">Walkers</option>
              <option value="OSP Graphs">OSP Graphs</option>
            </select>
            <div style={{marginTop: '20px'}}>
              {chapters.map((ch, i) => (
                <div key={i} style={{background: '#21262d', border: '1px solid #30363d', borderRadius: '6px', padding: '20px', marginBottom: '15px'}}>
                  <h3 style={{marginBottom: '10px'}}>Chapter {ch.order}: {ch.title}</h3>
                  <p style={{color: '#8b949e', marginBottom: '15px'}}>{ch.content}</p>
                  <button style={{background: '#238636', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer'}}>Complete Chapter</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === 'classroom' && (
          <div style={{background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '20px'}}>
            <h2>Virtual Classrooms</h2>
            <div style={{display: 'grid', gap: '20px', marginTop: '20px'}}>
              {classrooms.map((c, i) => (
                <div key={i} style={{background: '#21262d', border: '1px solid #30363d', borderRadius: '6px', padding: '20px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                      <h3 style={{marginBottom: '5px'}}>{c.name}</h3>
                      <div style={{color: '#8b949e', fontSize: '14px'}}>Instructor: {c.instructor}</div>
                      <div style={{color: '#8b949e', fontSize: '14px'}}>Students: {c.active_students}/{c.capacity}</div>
                    </div>
                    <button style={{background: c.available_spots > 0 ? '#238636' : '#6a737d', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: c.available_spots > 0 ? 'pointer' : 'not-allowed'}} disabled={c.available_spots === 0}>Join Class</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === 'schedule' && (
          <div style={{background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '20px'}}>
            <h2>Schedule</h2>
            <div style={{marginTop: '20px'}}>
              {schedule.map((e, i) => (
                <div key={i} style={{background: '#21262d', border: '1px solid #30363d', borderRadius: '6px', padding: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <div style={{fontWeight: 'bold'}}>{e.title}</div>
                    <div style={{color: '#8b949e', fontSize: '14px'}}>{e.date} at {e.time}</div>
                  </div>
                  <div style={{background: e.type === 'class' ? '#238636' : e.type === 'quiz' ? '#fbbf24' : '#da3633', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px'}}>{e.type}</div>
                </div>
              ))}
            </div>
          </div>
        )}

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
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', gap: '10px'}}>
              <h2>Code Editor</h2>
              <button onClick={() => setShowColorPicker(!showColorPicker)} style={{background: '#21262d', color: 'white', border: '1px solid #30363d', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer'}}>Color Schemes</button>
            </div>
            {showColorPicker && (
              <div style={{background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', padding: '15px', marginBottom: '15px'}}>
                <h3 style={{fontSize: '14px', marginBottom: '10px', color: '#8b949e'}}>Color Schemes</h3>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px'}}>
                  {Object.entries(colorSchemes).map(([key, scheme]) => (
                    <div key={key} onClick={() => setColorScheme(key)} style={{background: scheme.bg, border: colorScheme === key ? '3px solid #58a6ff' : '1px solid #30363d', borderRadius: '6px', padding: '15px', cursor: 'pointer', textAlign: 'center'}}>
                      <div style={{fontSize: '12px', fontWeight: 'bold', color: scheme.theme === 'light' ? '#000' : '#fff'}}>{scheme.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {codeError && <div style={{background: '#da3633', color: 'white', padding: '8px 12px', borderRadius: '4px', marginBottom: '10px', fontSize: '14px'}}>{codeError}</div>}
            <div style={{border: '1px solid #30363d', borderRadius: '4px', overflow: 'hidden'}}>
              <Editor key={editorKey} height="400px" defaultLanguage="javascript" theme={colorSchemes[colorScheme].theme} value={code} onChange={setCode} onMount={handleEditorDidMount} options={{minimap: {enabled: false}, automaticLayout: true}} />
            </div>
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
