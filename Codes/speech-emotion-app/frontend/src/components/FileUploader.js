import React from "react";

function FileUploader({ onUpload }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("Selected file:", file.name);
      onUpload(file);  // Pass file to App.js
    }
  };

  return <input type="file" accept=".wav" onChange={handleFileChange} />;
}

export default FileUploader;