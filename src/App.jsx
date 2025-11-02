import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import '@src/scss/style.scss';
import NotFound from '@src/components/views/NotFound';
import Home from '@src/components/views/Home';
import PublicRoutes from '@src/components/global/PublicRoutes';
import PrivateRoutes from '@src/components/global/PrivateRoutes';
import AppWrapper from './components/global/AppWrapper';
import Alert from './components/global/Alert';
import { Dashboard } from './components/views/Admin';
import { EventsList, EventForm, EventDetail } from './components/views/Admin/Events';
import { EmbedPage } from './components/embed';
import { Login, Signup, ForgotPassword } from './components/views/Auth';

function App() {
  return (
    <>
      <Alert />
      <Router>
        <Routes>
          <Route element={<AppWrapper />}>
            <Route path="/" element={<Home />} />

            <Route element={<PublicRoutes />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/embed/form/:formId" element={<EmbedPage />} />
            </Route>

            <Route element={<PrivateRoutes />}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/events" element={<EventsList />} />
              <Route path="/admin/events/new" element={<EventForm />} />
              <Route path="/admin/events/:id" element={<EventDetail />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
