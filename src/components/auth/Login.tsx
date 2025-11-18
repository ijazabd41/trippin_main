import React from 'react';
import { Navigate } from 'react-router-dom';

const Login = () => {
  // Redirect to Supabase auth
  return <Navigate to="/supabase-auth/login" replace />;
};

export default Login;
