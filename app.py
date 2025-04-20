import pickle
import pymc as pm
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Generate Sample Dataset
np.random.seed(42)
n_samples = 100
TV = np.random.uniform(100, 1000, n_samples)
Radio = np.random.uniform(50, 300, n_samples)
Social_Media = np.random.uniform(20, 200, n_samples)
Sales = 50 + 0.05 * TV + 0.03 * Radio + 0.02 * Social_Media + np.random.normal(0, 5, n_samples)

# Load the trace
with open("marketing_trace.pkl", "rb") as trace_file:
    trace = pickle.load(trace_file)

# Function to predict sales with updated factor and save results to CSV
def predict_sales(factor, percentage):
    factor_dict = {"TV": TV, "Radio": Radio, "Social_Media": Social_Media}
    if factor not in factor_dict:
        raise ValueError("Invalid factor name")

    new_values = factor_dict[factor] * (1 + percentage / 100)

    with pm.Model() as marketing_model:
        tv_shared = pm.Data("TV", TV)
        radio_shared = pm.Data("Radio", Radio)
        social_shared = pm.Data("Social_Media", Social_Media)

        beta_tv = pm.Normal("beta_tv", mu=0.05, sigma=0.1)
        beta_radio = pm.Normal("beta_radio", mu=0.03, sigma=0.1)
        beta_social = pm.Normal("beta_social", mu=0.02, sigma=0.1)
        alpha = pm.Normal("alpha", mu=50, sigma=10)
        sigma = pm.HalfNormal("sigma", sigma=5)

        mu = alpha + beta_tv * tv_shared + beta_radio * radio_shared + beta_social * social_shared
        sales_obs = pm.Normal("sales_obs", mu=mu, sigma=sigma, observed=Sales)

        pm.set_data({factor: new_values})
        posterior_predictive = pm.sample_posterior_predictive(trace, var_names=["sales_obs"])

    predicted_sales = posterior_predictive.posterior_predictive["sales_obs"].mean(dim=("chain", "draw")).values

    plt.figure(figsize=(10, 6))
    plt.plot(np.sort(factor_dict[factor]), np.sort(Sales), label='Original Sales', color='blue')
    plt.plot(np.sort(new_values), np.sort(predicted_sales), label=f'Predicted Sales ({factor} +{percentage}%)', color='red')
    plt.xlabel(f'{factor} Expense')
    plt.ylabel('Sales')
    plt.legend()
    plt.title(f'Effect of {percentage}% Increase in {factor} Expense on Sales')
    plt.show()

    # Save results to CSV
    result_df = pd.DataFrame({"Original_Expense": factor_dict[factor], "New_Expense": new_values, "Original_Sales": Sales, "Predicted_Sales": predicted_sales})
    result_df.to_csv(f"{factor}_sales_prediction_{percentage}.csv", index=False)
    print(f"Results saved to {factor}_sales_prediction_{percentage}.csv")

# Example Usage
factor, percentage = "Radio", 10
predict_sales(factor, percentage)
