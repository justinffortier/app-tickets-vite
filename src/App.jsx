/* eslint-disable no-unreachable */
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
import { FormsList, FormBuilder, FormEmbed } from './components/views/Admin/Forms';
import { EmbedPage } from './components/embed';

function App() {
  return (
    <>
      <Alert />
      <Router>
        <Routes>
          <Route element={<AppWrapper />}>
            <Route path="/" element={<Home />} />

            <Route element={<PublicRoutes />}>
              <Route path="/embed/form/:formId" element={<EmbedPage />} />
              <Route path="/admin" element={<Dashboard />} />
            </Route>

            <Route element={<PrivateRoutes />}>
              <Route path="/admin/events" element={<EventsList />} />
              <Route path="/admin/events/new" element={<EventForm />} />
              <Route path="/admin/events/:id" element={<EventDetail />} />
              <Route path="/admin/events/:id/edit" element={<EventForm />} />
              <Route path="/admin/forms" element={<FormsList />} />
              <Route path="/admin/forms/new" element={<FormBuilder />} />
              <Route path="/admin/forms/:id/edit" element={<FormBuilder />} />
              <Route path="/admin/forms/:id/embed" element={<FormEmbed />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
