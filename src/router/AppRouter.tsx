import { Routes, Route } from 'react-router-dom';
import { JsonToolPage } from '../features/json-tool/JsonToolPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="*" element={<JsonToolPage />} />
    </Routes>
  );
}
