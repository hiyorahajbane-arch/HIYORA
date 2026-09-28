import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { AuthProvider, I18nProvider } from './lib/i18n.jsx'
import Home from './pages/Home.jsx'
import Auth from './pages/Auth.jsx'
import Courses, { CoursePage } from './pages/Courses.jsx'
import Lesson from './pages/Lesson.jsx'
import Quiz from './pages/Quiz.jsx'
import Glossary from './pages/Glossary.jsx'
import Progress from './pages/Progress.jsx'
import Settings from './pages/Settings.jsx'
import { Empty } from './components/States.jsx'

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Auth mode="login" />} />
              <Route path="/register" element={<Auth mode="register" />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:courseId" element={<CoursePage />} />
              <Route path="/lessons/:lessonId" element={<Lesson />} />
              <Route path="/lessons/:lessonId/quiz" element={<Quiz />} />
              <Route path="/glossary" element={<Glossary />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Empty>404</Empty>} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  )
}
