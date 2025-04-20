CREATE TABLE loan_applications (
    application_id VARCHAR(15) PRIMARY KEY,
    borrower_id VARCHAR(10) NOT NULL,
    application_date DATE NOT NULL,
    approval_date DATE,
    time_to_decision INTEGER,
    application_status VARCHAR(10) NOT NULL CHECK (application_status IN ('Approved', 'Denied', 'Pending', 'Withdrawn')),
    amount_requested DECIMAL(10, 2) NOT NULL,
    approved_amount DECIMAL(10, 2),
    interest_rate DECIMAL(4, 2),
    term INTEGER CHECK (term IN (120, 180, 240, 360)),
    ltv_ratio DECIMAL(5, 2) NOT NULL,
    combined_ltv DECIMAL(5, 2) NOT NULL,
    loan_purpose VARCHAR(20) NOT NULL,
    credit_score INTEGER NOT NULL,
    annual_income DECIMAL(10, 2) NOT NULL,
    property_value DECIMAL(12, 2) NOT NULL
);

-- if using synth gen data not seed
CREATE TABLE loan_applications (
    application_id VARCHAR(13) PRIMARY KEY,
    borrower_id VARCHAR(13) NOT NULL,
    application_date DATE NOT NULL,
    approval_date DATE,
    time_to_decision INTEGER,
    application_status VARCHAR(10) NOT NULL CHECK (application_status IN ('Approved', 'Denied', 'Pending', 'Withdrawn')),
    amount_requested DECIMAL(10, 2) NOT NULL,
    approved_amount DECIMAL(10, 2),
    interest_rate DECIMAL(4, 2),
    term INTEGER CHECK (term IN (120, 180, 240, 360)),
    ltv_ratio DECIMAL(5, 2) NOT NULL,
    combined_ltv DECIMAL(5, 2) NOT NULL,
    loan_purpose VARCHAR(20) NOT NULL,
    credit_score INTEGER NOT NULL,
    annual_income DECIMAL(10, 2) NOT NULL,
    property_value DECIMAL(12, 2) NOT NULL
);

-- Add indexes for common query patterns
CREATE INDEX idx_application_status ON loan_applications(application_status);
CREATE INDEX idx_loan_purpose ON loan_applications(loan_purpose);
CREATE INDEX idx_application_date ON loan_applications(application_date);
CREATE INDEX idx_credit_score ON loan_applications(credit_score);
CREATE INDEX idx_ltv_ratio ON loan_applications(ltv_ratio);

-- Add comments for documentation
COMMENT ON TABLE loan_applications IS 'Home equity loan application data including approval status and risk metrics';
COMMENT ON COLUMN loan_applications.application_id IS 'Unique identifier for loan application';
COMMENT ON COLUMN loan_applications.borrower_id IS 'Unique identifier for the borrower';
COMMENT ON COLUMN loan_applications.application_date IS 'Date when application was submitted';
COMMENT ON COLUMN loan_applications.approval_date IS 'Date when application was approved (NULL if denied/pending/withdrawn)';
COMMENT ON COLUMN loan_applications.time_to_decision IS 'Number of days from application to decision';
COMMENT ON COLUMN loan_applications.application_status IS 'Current status of application: Approved, Denied, Pending, or Withdrawn';
COMMENT ON COLUMN loan_applications.amount_requested IS 'Amount of loan requested by borrower';
COMMENT ON COLUMN loan_applications.approved_amount IS 'Amount of loan approved (NULL or 0 if denied/pending/withdrawn)';
COMMENT ON COLUMN loan_applications.interest_rate IS 'Annual percentage rate for approved loans';
COMMENT ON COLUMN loan_applications.term IS 'Loan term in months (typically 10, 15, 20, or 30 years)';
COMMENT ON COLUMN loan_applications.ltv_ratio IS 'Loan-to-Value ratio - the ratio of loan amount to property value';
COMMENT ON COLUMN loan_applications.combined_ltv IS 'Combined Loan-to-Value ratio including other liens on property';
COMMENT ON COLUMN loan_applications.loan_purpose IS 'Purpose of the loan (e.g., Home Improvement, Debt Consolidation)';
COMMENT ON COLUMN loan_applications.credit_score IS 'Borrower credit score at time of application';
COMMENT ON COLUMN loan_applications.annual_income IS 'Borrower annual income at time of application';
COMMENT ON COLUMN loan_applications.property_value IS 'Appraised value of the property';