import React from 'react';
import { useNavigate } from 'react-router-dom';

interface TermsAndConditionsProps {
  netid: string;
}

const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ netid }) => {
  const navigate = useNavigate();

  const handleAccept = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-8">
          <h2 className="text-3xl font-bold mb-6">Hi {netid}!</h2>
          <p className="text-gray-600 mb-8">just two more steps before getting started...</p>

          <h3 className="text-2xl font-semibold text-orange-500 mb-6">2. Terms & Confirmation</h3>

          <div className="space-y-4 mb-8">
            <div>
              <p className="mb-2">1. I agree to follow the community guidelines, including fair pricing, honest descriptions, and respectful communication with other users.</p>
            </div>
            <div>
              <p className="mb-2">2. I understand that this marketplace is <span className="font-semibold">only for Princeton students</span>, and I will not share access with non-Princeton users.</p>
            </div>
            <div>
              <p className="mb-2">3. I acknowledge that TigerPop is a <span className="font-semibold">peer-to-peer platform</span> and that Princeton University is <span className="font-semibold">not responsible</span> for any disputes, lost items, or financial transactions.</p>
            </div>
            <div>
              <p className="mb-2">4. I agree <span className="font-semibold">not to sell</span> prohibited items, including alcohol, drugs, weapons, and unauthorized tickets.</p>
            </div>
            <div>
              <p className="mb-2">5. I will prioritize <span className="font-semibold">safe meetups</span> in public, well-lit areas and will be cautious when arranging exchanges.</p>
            </div>
            <div>
              <p className="mb-2">6. I consent to the use of my <span className="font-semibold">NetID, name, email, and basic profile information</span> for account creation and internal platform functions.</p>
            </div>
            <div>
              <p className="mb-2">7. I understand that purchases are <span className="font-semibold">final</span> unless the seller offers a return policy.</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleAccept}
              className="w-full bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <span>Finish Setup</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions; 