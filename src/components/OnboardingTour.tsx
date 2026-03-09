import React from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';

interface OnboardingTourProps {
  run: boolean;
  onFinish: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ run, onFinish }) => {
  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="text-left">
          <h3 className="text-lg font-bold mb-2">Welcome to DealRadar!</h3>
          <p className="text-sm text-slate-600">Let's take a quick tour of your new autonomous sales squad.</p>
        </div>
      ),
      placement: 'center',
    },
    {
      target: '#tour-business',
      content: (
        <div className="text-left">
          <h3 className="text-base font-bold mb-1">1. Strategy First</h3>
          <p className="text-xs text-slate-600">Start here to define your business profile. Agent 1 needs this to understand your value proposition.</p>
        </div>
      ),
    },
    {
      target: '#tour-triggers',
      content: (
        <div className="text-left">
          <h3 className="text-base font-bold mb-1">2. Intent Intelligence</h3>
          <p className="text-xs text-slate-600">Once your profile is set, Agent 1 generates high-intent triggers—signals that indicate a prospect is ready to buy.</p>
        </div>
      ),
    },
    {
      target: '#tour-launch-hunter',
      content: (
        <div className="text-left">
          <h3 className="text-base font-bold mb-1">3. Deploy Agent 2</h3>
          <p className="text-xs text-slate-600">Click "Launch Hunter" to send Agent 2 into the wild to find specific leads matching your intent triggers.</p>
        </div>
      ),
    },
    {
      target: '#tour-dashboard',
      content: (
        <div className="text-left">
          <h3 className="text-base font-bold mb-1">4. Your Pipeline</h3>
          <p className="text-xs text-slate-600">All discovered leads flow back here. Monitor, filter, and manage your high-value opportunities.</p>
        </div>
      ),
    },
    {
      target: '#tour-lead-card',
      content: (
        <div className="text-left">
          <h3 className="text-base font-bold mb-1">5. Lead Intelligence</h3>
          <p className="text-xs text-slate-600">Each card is packed with AI-generated research, personalized hooks, and deep-dive capabilities.</p>
        </div>
      ),
    },
    {
      target: '#tour-settings',
      content: (
        <div className="text-left">
          <h3 className="text-base font-bold mb-1">6. Engine Settings</h3>
          <p className="text-xs text-slate-600">Configure your API keys and delivery infrastructure (Smartlead, Instantly) to automate the entire outreach flow.</p>
        </div>
      ),
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      onFinish();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#F27D26', // DealRadar Accent
          textColor: '#141414',
          zIndex: 1000,
        },
        tooltipContainer: {
          textAlign: 'left',
          borderRadius: '24px',
          padding: '12px',
        },
        buttonNext: {
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold',
          padding: '10px 20px',
        },
        buttonBack: {
          fontSize: '12px',
          fontWeight: 'bold',
          marginRight: '10px',
        },
        buttonSkip: {
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#94a3b8',
        },
      }}
    />
  );
};
