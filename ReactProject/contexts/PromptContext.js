import { createContext } from "react";

const PromptContext = createContext();
export default PromptContext;

export const PromptProvider = ({ children }) => {
    const [prompt, setPrompt] = useState(''); // State variable for the prompt
    const [isPromptAnswered, setIsPromptAnswered] = useState(false); // New state variable for tracking if prompt is answered
  
    return (
      <PromptContext.Provider value={{ prompt, isPromptAnswered, setPrompt, setIsPromptAnswered }}>
        {children}
      </PromptContext.Provider>
    );
  };
  