import React from 'react';
import { Navigate } from 'react-router-dom';

const Register: React.FC = () => {
  // Redirect to Supabase auth
  return <Navigate to="/supabase-auth/register" replace />;
};

export default Register;