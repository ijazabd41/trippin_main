import React from 'react';
import { Navigate } from 'react-router-dom';

const AuthPage: React.FC = () => {
  // Redirect all /auth/* routes to /supabase-auth/*
  return <Navigate to="/supabase-auth/login" replace />;
};

export default AuthPage;