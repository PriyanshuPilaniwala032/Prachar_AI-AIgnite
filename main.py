import pandas as pd
from sqlalchemy import create_engine
import google.generativeai as genai
import re
from app2 import predict_sales
from dotenv import load_dotenv
import os

load_dotenv()

connection_string = 'postgresql+psycopg2://Test1_owner:npg_KmGu7QdgREs8@ep-late-union-a8ifhjcr-pooler.eastus2.azure.neon.tech:5432/Test1?sslmode=require'

engine = create_engine(connection_string)
 
table_name = "Data_test"
df = pd.read_sql(f'SELECT * FROM "{table_name}"', con=engine)

API_KEY = os.getenv("API_KEY")

genai.configure(api_key=API_KEY)

model = genai.GenerativeModel("gemini-1.5-flash-002")

table_summary = df.to_string()
user_prompt = input("Enter the Prompt:")

prompt = f'''
You are an expert data analyst with deep knowledge of SQL and marketing data analysis. 
Given a dataset, your task is to:
1. Validate whether the user question is related to data analysis, marketing, sales, or predictions.
2. If valid, determine if the question can be answered using SQL queries or if further processing (like sales prediction) is required.

Dataset:
{table_summary}

User Question:
"{user_prompt}"

Rules:
- If the question is about SQL and can be solved solely using SQL queries on the dataset provided, return "YES" else return "NO".
- If the question is about predicting sales or marketing data analysis, return "PREDICT SALES" and process the sales prediction with the relevant data (TV, Radio, or Social_Media).
- If the question is unrelated to the above topics, return "INVALID PROMPT."

Respond with one of the following:
- "YES" if the answer can be derived using SQL queries on the dataset.
- "NO" if SQL alone cannot determine the answer from the dataset or if the question requires processing for sales prediction..
- "INVALID PROMPT" if the question is not related to data analysis or predictions.
'''

response = model.generate_content(prompt)

print("Gemini's response:")
print(response.text)

if "NO" in response.text:
    print("SQL queries cannot alone determine the result above!")

    factor_percentage = re.findall(r"(increase|decrease)\s*(TV|Radio|Social Media)\s*by\s*(\+?-?\d+(\.\d+)?)\s*%", user_prompt)

    if factor_percentage:
        print("The factors and their percentages are: ", factor_percentage)
        updates = {}
        
        for factor_data in factor_percentage:
            action, factor, percentage = factor_data[:3]
            if action == "increase":
                percentage = abs(float(percentage))  
            elif action == "decrease":
                percentage = -abs(float(percentage)) 

            print(f'Processing {action} for {factor} with {percentage}%')
            
            if factor == "Social Media":
                factor = "Social_Media"
            # predict_sales(factor, float(percentage))

            updates[factor] = percentage
        
        print("Combined updated: ", updates)
        predict_sales(updates)
    else:
        print("Could not extract factor and percentage from the prompt. Please ensure the format is correct.")
elif "YES" in response.text:
    print("The model has determined that the answer can be derived using SQL.")
    # Proceed with SQL query processing here (if needed)
elif "INVALID PROMPT" in response.text:
    print("The prompt is invalid and does not relate to data analysis or marketing.")
else:
    print("Unexpected response from Gemini.")