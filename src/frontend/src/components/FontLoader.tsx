import React, { useEffect } from "react";

// Import the TKO custom fonts
import TkoFontBold from "../assets/TKO Branding/Tkofont_bold-Regular.ttf";

interface FontLoaderProps {
  children: React.ReactNode;
}

const FontLoader: React.FC<FontLoaderProps> = ({ children }) => {
  useEffect(() => {
    // Create a style element
    const style = document.createElement("style");

    // Define the font-face rules
    style.textContent = `
      @font-face {
        font-family: 'TKO Custom Font';
        src: url(${TkoFontBold}) format('truetype');
        font-weight: 700;
        font-style: normal;
        font-display: swap;
      }
      
      /* You would add additional font-face rules for other weights/styles here */
      
      /* Load Norwester and Poppins from Google Fonts */
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    `;

    // Append the style element to the head
    document.head.appendChild(style);

    // Clean up function
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return <>{children}</>;
};

export default FontLoader;
