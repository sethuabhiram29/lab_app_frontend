import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';

class PDFErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PDF Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Error loading PDF preview. Please try again.</div>;
    }

    return this.props.children;
  }
}

const PDFPreview = ({ document }) => {
  return (
    <PDFErrorBoundary>
      <div style={{ width: '100%', height: '600px' }}>
        <PDFViewer width="100%" height="100%">
          {document}
        </PDFViewer>
      </div>
    </PDFErrorBoundary>
  );
};

export default PDFPreview; 