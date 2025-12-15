'use client';

import React, { useState } from 'react';
import AIAssistant from './AIAssistant';

const AskAIButton = () => {
  const [isAIOpen, setIsAIOpen] = useState(false);

  const handleOpenAI = () => {
    setIsAIOpen(true);
  };

  const handleCloseAI = () => {
    setIsAIOpen(false);
  };

  return (
    <>
      <button
  className="bg-[#AEDAEF] text-black px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-[#A7B4C2] transition"
  onClick={handleOpenAI}
>
  <i className="fas fa-brain text-lg"></i>
  Pulse AI
</button>


      <AIAssistant isOpen={isAIOpen} onClose={handleCloseAI} />
    </>
  );
};

export default AskAIButton;
