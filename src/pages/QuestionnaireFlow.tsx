import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LanguageSelection from '../components/questionnaire/LanguageSelection';
import BasicInfo from '../components/questionnaire/BasicInfo';
import TravelStyle from '../components/questionnaire/TravelStyle';
import DetailedPreferences from '../components/questionnaire/DetailedPreferences';
import Confirmation from '../components/questionnaire/Confirmation';
import PersonalityInsights from '../components/questionnaire/PersonalityInsights';
import SeasonalPreferences from '../components/questionnaire/SeasonalPreferences';

const QuestionnaireFlow: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Routes>
        <Route path="/language" element={<LanguageSelection />} />
        <Route path="/basic" element={<BasicInfo />} />
        <Route path="/style" element={<TravelStyle />} />
        <Route path="/details" element={<DetailedPreferences />} />
        <Route path="/personality" element={<PersonalityInsights />} />
        <Route path="/seasonal" element={<SeasonalPreferences />} />
        <Route path="/confirmation" element={<Confirmation />} />
      </Routes>
    </div>
  );
};

export default QuestionnaireFlow;