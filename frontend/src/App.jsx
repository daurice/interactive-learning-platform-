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
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [notes, setNotes] = useState('')
  const [eventNotes, setEventNotes] = useState({})
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({title: '', date: '', time: '', type: 'class', description: ''})
  const [savedNotes, setSavedNotes] = useState([])
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
    console.log('Loading chapters for:', topicName)
    try {
      const res = await fetch(`${API}/chapters/${topicName}`)
      console.log('Response status:', res.status)
      const data = await res.json()
      console.log('Chapter data:', data)
      setChapters(data.chapters || [])
    } catch (e) {
      console.error('Chapter loading error:', e)
    }
  }

  const completeChapter = async (chapterTitle) => {
    try {
      const res = await fetch(`${API}/complete-chapter`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, chapter_title: chapterTitle})
      })
      const data = await res.json()
      if (data.success) {
        loadProgress()
        alert('Chapter completed! +30 minutes study time, +1 streak!')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const joinClassroom = async (classroomName) => {
    try {
      const res = await fetch(`${API}/join-classroom`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, classroom_name: classroomName})
      })
      const data = await res.json()
      if (data.success) {
        alert(`Successfully joined ${classroomName}!`)
        loadClassrooms()
        loadProgress()
      } else {
        alert(data.message || 'Failed to join classroom')
      }
    } catch (e) {
      alert('Error joining classroom')
    }
  }

  const addEvent = async () => {
    const event = {...newEvent, id: Date.now()}
    setSchedule([...schedule, event])
    setNewEvent({title: '', date: '', time: '', type: 'class', description: ''})
    setShowAddEvent(false)
  }

  const selectCalendarDate = (day) => {
    if (!day) return
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setNewEvent({...newEvent, date: dateStr})
    setShowAddEvent(true)
  }

  const saveEventNote = (eventId, note) => {
    setEventNotes({...eventNotes, [eventId]: note})
  }

  const saveNotes = () => {
    if (notes.trim()) {
      const newNote = {
        id: Date.now(),
        content: notes,
        timestamp: new Date().toLocaleString()
      }
      setSavedNotes([newNote, ...savedNotes])
      setNotes('')
      alert('Notes saved successfully!')
    }
  }

  const deleteNote = (noteId) => {
    setSavedNotes(savedNotes.filter(note => note.id !== noteId))
  }

  const deleteEvent = (eventId) => {
    setSchedule(schedule.filter(event => event.id !== eventId))
    if (selectedEvent && selectedEvent.id === eventId) {
      setSelectedEvent(null)
    }
  }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    return days
  }

  const getEventsForDate = (day) => {
    if (!day) return []
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return schedule.filter(event => event.date === dateStr)
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
    setNotes('')
    setEventNotes({})
    setSelectedEvent(null)
    setSavedNotes([])
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
                  <div style={{color: '#c9d1d9', marginBottom: '15px', lineHeight: '1.6', whiteSpace: 'pre-wrap'}}>{ch.content}</div>
                  {ch.title.includes('Nodes') && (
                    <div style={{background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', padding: '10px', marginBottom: '10px'}}>
                      <pre style={{color: '#58a6ff', fontSize: '12px', margin: 0}}>{
`node person {
    has name: str;
    has age: int;
}
edge friendship {
    has since: str;
}`}</pre>
                    </div>
                  )}
                  {ch.title.includes('Walker') && (
                    <div style={{background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', padding: '10px', marginBottom: '10px'}}>
                      <pre style={{color: '#58a6ff', fontSize: '12px', margin: 0}}>{
`walker greet {
    can say_hello with person entry {
        print(f"Hello {here.name}!");
        report "Greeted";
    }
}`}</pre>
                    </div>
                  )}
                  <button onClick={() => completeChapter(ch.title)} style={{background: '#238636', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer'}}>Complete Chapter</button>
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
                    <button onClick={() => joinClassroom(c.name)} style={{background: c.available_spots > 0 ? '#238636' : '#6a737d', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: c.available_spots > 0 ? 'pointer' : 'not-allowed'}} disabled={c.available_spots === 0}>Join Class</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === 'schedule' && (
          <div style={{background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '20px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2>Learning Schedule</h2>
              <button onClick={() => setShowAddEvent(true)} style={{background: '#238636', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'}}>Add Event</button>
            </div>
            
            <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px'}}>
              <div style={{background: '#21262d', border: '1px solid #30363d', borderRadius: '6px', padding: '15px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} style={{background: '#21262d', color: '#58a6ff', border: '1px solid #30363d', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'}}>Previous</button>
                  <h3>{currentDate.toLocaleDateString('en-US', {month: 'long', year: 'numeric'})}</h3>
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} style={{background: '#21262d', color: '#58a6ff', border: '1px solid #30363d', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'}}>Next</button>
                </div>
                
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '10px'}}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} style={{padding: '8px', textAlign: 'center', fontSize: '12px', color: '#8b949e', fontWeight: 'bold'}}>{day}</div>
                  ))}
                </div>
                
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px'}}>
                  {getDaysInMonth(currentDate).map((day, i) => {
                    const dayEvents = getEventsForDate(day)
                    return (
                      <div key={i} style={{minHeight: '60px', padding: '4px', background: day ? '#161b22' : 'transparent', border: day ? '1px solid #30363d' : 'none', borderRadius: '4px', cursor: day ? 'pointer' : 'default'}} onClick={() => day && selectCalendarDate(day)}>
                        {day && (
                          <>
                            <div style={{fontSize: '12px', marginBottom: '2px'}}>{day}</div>
                            {dayEvents.map(event => (
                              <div key={event.id || event.title} onClick={(e) => {e.stopPropagation(); setSelectedEvent(event)}} style={{background: event.type === 'class' ? '#238636' : event.type === 'quiz' ? '#fbbf24' : event.type === 'assignment' ? '#da3633' : '#6a737d', color: 'white', padding: '1px 3px', borderRadius: '2px', fontSize: '8px', marginBottom: '1px', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{event.title}</div>
                            ))}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              
              <div>
                <div style={{background: '#21262d', border: '1px solid #30363d', borderRadius: '6px', padding: '15px', marginBottom: '15px'}}>
                  <h4 style={{marginBottom: '10px'}}>Quick Notes</h4>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Write your study notes here..." style={{width: '100%', height: '80px', background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '4px', padding: '8px', resize: 'vertical'}} />
                  <button onClick={saveNotes} style={{background: '#238636', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginTop: '8px', fontSize: '12px'}}>Save Notes</button>
                  
                  {savedNotes.length > 0 && (
                    <div style={{marginTop: '15px'}}>
                      <h5 style={{marginBottom: '8px', fontSize: '12px', color: '#8b949e'}}>Saved Notes</h5>
                      <div style={{maxHeight: '150px', overflowY: 'auto'}}>
                        {savedNotes.map(note => (
                          <div key={note.id} style={{background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', padding: '8px', marginBottom: '6px'}}>
                            <div style={{fontSize: '11px', color: '#8b949e', marginBottom: '4px'}}>{note.timestamp}</div>
                            <div style={{fontSize: '12px', color: '#c9d1d9', marginBottom: '4px'}}>{note.content}</div>
                            <button onClick={() => deleteNote(note.id)} style={{background: '#da3633', color: 'white', border: 'none', padding: '2px 6px', borderRadius: '2px', cursor: 'pointer', fontSize: '10px'}}>Delete</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedEvent && (
                  <div style={{background: '#21262d', border: '1px solid #30363d', borderRadius: '6px', padding: '15px'}}>
                    <h4 style={{marginBottom: '10px'}}>Event Details</h4>
                    <div style={{marginBottom: '8px'}}><strong>{selectedEvent.title}</strong></div>
                    <div style={{color: '#8b949e', fontSize: '14px', marginBottom: '8px'}}>{selectedEvent.date} at {selectedEvent.time}</div>
                    <div style={{background: selectedEvent.type === 'class' ? '#238636' : selectedEvent.type === 'quiz' ? '#fbbf24' : '#da3633', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', display: 'inline-block', marginBottom: '10px'}}>{selectedEvent.type}</div>
                    {selectedEvent.description && <div style={{color: '#c9d1d9', fontSize: '14px', marginBottom: '10px'}}>{selectedEvent.description}</div>}
                    <textarea value={eventNotes[selectedEvent.id] || ''} onChange={e => saveEventNote(selectedEvent.id, e.target.value)} placeholder="Event notes..." style={{width: '100%', height: '80px', background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '4px', padding: '8px', resize: 'vertical'}} />
                  </div>
                )}
              </div>
            </div>
            
            <div style={{background: '#21262d', border: '1px solid #30363d', borderRadius: '6px', padding: '15px', marginTop: '20px'}}>
              <h3 style={{marginBottom: '15px'}}>All Events</h3>
              <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                {schedule.length === 0 ? (
                  <div style={{color: '#8b949e', textAlign: 'center', padding: '20px'}}>No events scheduled</div>
                ) : (
                  schedule.map((event, i) => (
                    <div key={event.id || i} style={{background: '#161b22', border: '1px solid #30363d', borderRadius: '4px', padding: '12px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div onClick={() => setSelectedEvent(event)} style={{flex: 1, cursor: 'pointer'}}>
                        <div style={{fontWeight: 'bold', marginBottom: '4px'}}>{event.title}</div>
                        <div style={{color: '#8b949e', fontSize: '12px'}}>{event.date} at {event.time}</div>
                        {event.description && <div style={{color: '#c9d1d9', fontSize: '12px', marginTop: '4px'}}>{event.description}</div>}
                      </div>
                      <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                        <div style={{background: event.type === 'class' ? '#238636' : event.type === 'quiz' ? '#fbbf24' : event.type === 'assignment' ? '#da3633' : '#6a737d', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px'}}>{event.type}</div>
                        {event.id && <button onClick={() => deleteEvent(event.id)} style={{background: '#da3633', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px'}}>Delete</button>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {showAddEvent && (
              <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
                <div style={{background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '20px', width: '400px'}}>
                  <h3 style={{marginBottom: '15px'}}>Add New Event</h3>
                  <div style={{display: 'grid', gap: '10px'}}>
                    <input value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="Event title" style={{background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', padding: '8px', borderRadius: '4px'}} />
                    <div>
                      <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} style={{background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', padding: '8px', borderRadius: '4px', width: '100%'}} />
                      <div style={{fontSize: '11px', color: '#8b949e', marginTop: '4px'}}>Or click a date on the calendar above</div>
                    </div>
                    <input type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} style={{background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', padding: '8px', borderRadius: '4px'}} />
                    <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})} style={{background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', padding: '8px', borderRadius: '4px'}}>
                      <option value="class">Class</option>
                      <option value="quiz">Quiz</option>
                      <option value="assignment">Assignment</option>
                      <option value="study">Study Session</option>
                    </select>
                    <textarea value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} placeholder="Description (optional)" style={{background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', padding: '8px', borderRadius: '4px', height: '60px', resize: 'vertical'}} />
                  </div>
                  <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                    <button onClick={addEvent} style={{flex: 1, background: '#238636', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer'}}>Add Event</button>
                    <button onClick={() => setShowAddEvent(false)} style={{flex: 1, background: '#6a737d', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer'}}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
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
