

# Prompt breaks tool call
"plot the loan approval rate per month by loan purpose"

error:
 POST /api/chat 500 in 102ms
 ⨯ AI_MessageConversionError: ToolInvocation must have a result: {"state":"call","toolCallId":"call_6sGwCtn2KZpECGmTomhF3v4l","toolName":"executeSQLQuery","args":{"sqlQuery":"SELECT TO_CHAR(approval_date, 'YYYY-MM') AS month, COUNT(application_id) AS number_of_approved_loans \nFROM loan_applications \nWHERE application_status = 'Approved' \nGROUP BY month \nORDER BY month;","userQuestion":"number of approved loans per month"}}
    at /Users/mike/GitHub/vercel-ai-chatbot/.next/server/chunks/b4070_ai_dist_index_mjs_00974c._.js:1534:39
    at Array.map (<anonymous>)
    at convertToCoreMessages (/Users/mike/GitHub/vercel-ai-chatbot/.next/server/chunks/b4070_ai_dist_index_mjs_00974c._.js:1532:50)
    at POST (/Users/mike/GitHub/vercel-ai-chatbot/.next/server/chunks/[root of the server]__35b43b._.js:1511:326)