import React, { useState } from 'react';

const PaymentInformation = () => {
  const [paymentInfo, setPaymentInfo] = useState({
    bankName: 'First National Bank',
    bankAddress: '456 Financial Blvd\nNew York, NY 10001',
    accountName: 'Selsoft',
    accountNumber: '1234567890',
    routingNumber: '021000021',
    swiftCode: 'FNBAUS33',
    iban: '',
    paypalEmail: 'payments@selsoft.com',
    usePaypal: true
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentInfo({
      ...paymentInfo,
      [name]: value
    });
  };

  const handleToggleChange = (e) => {
    const { name, checked } = e.target;
    setPaymentInfo({
      ...paymentInfo,
      [name]: checked
    });
  };

  const handleSave = () => {
    // Save payment information to backend
    console.log('Saving payment information:', paymentInfo);
    // API call would go here
    alert('Payment information saved successfully!');
  };

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Payment Information</h3>
      
      <div className="form-group">
        <label className="form-label" htmlFor="bankName">Bank Name</label>
        <input
          type="text"
          className="form-control"
          id="bankName"
          name="bankName"
          value={paymentInfo.bankName}
          onChange={handleInputChange}
          placeholder="Enter bank name"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label" htmlFor="bankAddress">Bank Address</label>
        <textarea
          className="form-control"
          id="bankAddress"
          name="bankAddress"
          value={paymentInfo.bankAddress}
          onChange={handleInputChange}
          placeholder="Enter bank address"
          rows="3"
        ></textarea>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="accountName">Account Name</label>
          <input
            type="text"
            className="form-control"
            id="accountName"
            name="accountName"
            value={paymentInfo.accountName}
            onChange={handleInputChange}
            placeholder="Enter account name"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="accountNumber">Account Number</label>
          <input
            type="text"
            className="form-control"
            id="accountNumber"
            name="accountNumber"
            value={paymentInfo.accountNumber}
            onChange={handleInputChange}
            placeholder="Enter account number"
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="routingNumber">Routing Number (ACH)</label>
          <input
            type="text"
            className="form-control"
            id="routingNumber"
            name="routingNumber"
            value={paymentInfo.routingNumber}
            onChange={handleInputChange}
            placeholder="Enter routing number"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="swiftCode">SWIFT Code (International)</label>
          <input
            type="text"
            className="form-control"
            id="swiftCode"
            name="swiftCode"
            value={paymentInfo.swiftCode}
            onChange={handleInputChange}
            placeholder="Enter SWIFT code"
          />
        </div>
      </div>
      
      <div className="form-group">
        <label className="form-label" htmlFor="iban">IBAN (International Bank Account Number)</label>
        <input
          type="text"
          className="form-control"
          id="iban"
          name="iban"
          value={paymentInfo.iban}
          onChange={handleInputChange}
          placeholder="Enter IBAN (optional)"
        />
      </div>
      
      <div className="form-group">
        <div className="form-switch">
          <label className="switch">
            <input
              type="checkbox"
              name="usePaypal"
              checked={paymentInfo.usePaypal}
              onChange={handleToggleChange}
            />
            <span className="slider"></span>
          </label>
          <span className="switch-label">Accept PayPal payments</span>
        </div>
      </div>
      
      {paymentInfo.usePaypal && (
        <div className="form-group">
          <label className="form-label" htmlFor="paypalEmail">PayPal Email</label>
          <input
            type="email"
            className="form-control"
            id="paypalEmail"
            name="paypalEmail"
            value={paymentInfo.paypalEmail}
            onChange={handleInputChange}
            placeholder="Enter PayPal email"
          />
        </div>
      )}
      
      <div className="button-group">
        <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
        <button className="btn btn-outline-light">Cancel</button>
      </div>
    </div>
  );
};

export default PaymentInformation;
