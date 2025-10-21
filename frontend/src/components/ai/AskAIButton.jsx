import React, { useState } from "react";
import AIAssistant from "./AIAssistant";

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
        className="ask-ai-btn"
        onClick={handleOpenAI}
        title="Ask Pulse AI about TimePulse modules"
      >
        <i className="fas fa-brain"></i>
        Pulse AI
      </button>

      <AIAssistant isOpen={isAIOpen} onClose={handleCloseAI} />
    </>
  );
};

export default AskAIButton;
