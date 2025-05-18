declare module './CustomerLookup' {
  import React from 'react';
  const CustomerLookup: React.FC;
  export default CustomerLookup;
}

declare module './CustomerPopup' {
  import React from 'react';
  import { Customer } from '../models/Customer';
  
  interface CustomerPopupProps {
    customer: Customer;
    onClose: () => void;
  }
  
  const CustomerPopup: React.FC<CustomerPopupProps>;
  export default CustomerPopup;
}

declare module './MainWindow' {
  import React from 'react';
  const MainWindow: React.FC<{}>;
  export default MainWindow;
}
