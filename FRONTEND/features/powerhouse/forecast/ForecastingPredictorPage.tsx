import React, { useState } from 'react';
import { Tabs } from '../../../components/ui/Tabs';
import { ForecastingPage } from './ForecastingPage';
import { PredictorPage } from '../predictor/PredictorPage';

export const ForecastingPredictorPage: React.FC = () => {
  const [activeView, setActiveView] = useState('forecast');

  return (
    <div className="flex flex-col gap-5">
      <Tabs
        tabs={[
          { id: 'forecast', label: 'Forecasting' },
          { id: 'predictor', label: 'ML Predictor' },
        ]}
        activeTab={activeView}
        onChange={setActiveView}
      />
      {activeView === 'forecast' ? <ForecastingPage /> : <PredictorPage />}
    </div>
  );
};