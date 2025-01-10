import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.adapters.openai import convert_openai_messages
from dotenv import load_dotenv
import os


###pdfloader
import langchain_community
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain.adapters.openai import convert_openai_messages
from langchain_core.vectorstores import InMemoryVectorStore
###



load_dotenv(dotenv_path='.env')
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
print(GOOGLE_API_KEY)
GOOGLE_API_KEY="AIzaSyC9l5vuDKQJkCX3_UK8zkOOVvniwL1y9U0"
class GeminiService:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(temperature=0, model="gemini-pro", convert_system_message_to_human=True,google_api_key=GOOGLE_API_KEY)

    def classify_input_with_gemini(self, prompt: str) -> str:
        try:
            location_check_prompt = [
            {"role": "system", "content": "You are an intelligent assistant specialized in identifying location-based queries."},
            {"role": "user", "content": (
                f'Based on the following input, determine if it involves a map location search or a directions query: "{prompt}".\n'
                f'Respond strictly with one of the following:\n'
                f'1. "location" — if the input mentions places, directions, or phrases like "where is," "nearest," "location of," or "how to get to."\n'
                f'2. "none" — if the input does not relate to any location-based search or directions query.'
            )}
            ]


            lc_messages = convert_openai_messages(location_check_prompt)
            location_response = self.llm.invoke(lc_messages).content.strip().lower()
            print(location_response)

            # If the response indicates that it is a location search, return immediately
            if "location" in location_response or "map location search" in location_response:
                return "location"

            # Step 2: If not a location search, check if the input involves pet care or other topics
            classification_prompt = [
                {"role": "system", "content": "You are an intelligent assistant specialized in classifying user queries."},
                {"role": "user", "content": (
                    f'Classify the following input into one of these categories: "Pet Care", or "Other".\n\n'
                    f'1. "Pet Care": If the query is related to questions about pet care, pet health, grooming, training, diet, or any topic concerning the well-being of pets.\n'
                    f'2. "Other": If the query does not fit into "Pet Care" and is unrelated to these topics.\n\n'
                    f'User Input: "{prompt}"'
                    
                    
                )}
            ]

            lc_messages = convert_openai_messages(classification_prompt)
            classification_response = self.llm.invoke(lc_messages).content.strip().lower()

            # Return the classification result
            if "pet care" in classification_response:
                return "pet care"
            else:
                return "other"

        except Exception as e:
            logging.error(f"Error in classify_input_with_gemini: {e}")
            return "other"

    def get_gemini_response(self,msg: str, content:str) -> str:
        try:
            # Initialize Google Generative AI model
            llm = ChatGoogleGenerativeAI(temperature=0, model="gemini-pro", convert_system_message_to_human=True,google_api_key=GOOGLE_API_KEY)


            # Generate a response based on the content
            prompt = [
        {"role": "system", "content": (
            "You are a friendly teacher whose goal is to summarize topics clearly and write a report. "
            "You must follow the user's instructions strictly."
        )},
        {"role": "user", "content": (
            f'Strictly follow these instructions to generate a detailed response:\n\n'
            f'Information provided: """{content}"""\n\n'
            f'Using the above information, answer the query: "{msg}" in detail.\n\n'
            f'Do not use asterisks, bullet points, or any kind of list symbols in your response.\n\n'
            f'1. Write your answer in well-structured paragraphs without using asterisks or bullet points.\n'
            f'2. Ensure there is a blank line between each paragraph to enhance readability.\n\n'
            f'3. References:\n'
            f'   - Write all reference links at the bottom of your response, after the main content.\n'
            f'   - Use the following format for each reference:\n'
            f'     a) Write the title of the reference on one line.\n'
            f'     b) On the next line, display the full URL without embedding it.\n\n'
            f'Now, apply this format to create a clear and detailed response with references positioned at the bottom.'
        )}
    ]


            lc_messages = convert_openai_messages(prompt)
            # Get the final response from the LLM
            response = llm.invoke(lc_messages).content
            print(response)
            if response =="":
                return "I'm sorry, I can only assist with pet care-related questions. Please ask me something about pets, their care, or related topics that are not related to map location search."
            return response
        except Exception as e:
            logging.error(f"Error in get_gemini_response: {e}")
            return f"Error: {str(e)}"
        



    async def get_gemini_response2(self,msg: str) -> str:
            file_path = "C:/Users/hngbo/GitHub/2006-SDAD-10/PetCare/python-backend/app/services/petcarebackenddocumentation.pdf"

            loader = PyPDFLoader(file_path)
            pages = []
            async for page in loader.alazy_load():
                pages.append(page)
            GOOGLE_API_KEY="AIzaSyC9l5vuDKQJkCX3_UK8zkOOVvniwL1y9U0"

            embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001",google_api_key=GOOGLE_API_KEY)
            vector_store = InMemoryVectorStore.from_documents(pages, embeddings)
            docs = vector_store.similarity_search(msg, k=5)

            for doc in docs:
                print(f'Page {doc.metadata["page"]}: {doc.page_content[:300]}\n')
            content = msg
            prompt = [{
                
                "role": "system",
                "content":  f'You are a helpful chatbot assistant, guiding users on how to use our app effectively. '\
                            f'Your goal is to assist users by providing concise summaries and helpful tips on how to navigate and make the most of our application features.' \
                            f'Offer simple explanations, suggest relevant functions, and give examples where appropriate to ensure users feel confident in using the app.'\
                            f'Do not use asterisks in your response.'
                            f'When faced with a query, first attempt to provide a helpful response using the information available to you.'
                            f'At the end of your response, please include the following note in a new paragraph: '
                            f'\'Note that if my response does not answer your query,  please try rephrasing your query with specific details, and make sure it\'s related to app navigation."\''
                            f'When faced with a query, first attempt to provide a helpful response using the information available to you. If the query is unclear, unrelated to app navigation, or lacks sufficient details, then respond with: '
                            f'\'I\'m sorry, but I don\'t have the information you\'re looking for at the moment.\n\n\''
            }, {
                "role": "user",
                "content": f'Information: """{docs}"""\n\n' \
                        f'Based on the information above, please answer the following query: "{content}" '\
                        f'Provide a clear, friendly, and concise response, and include any steps or tips needed to assist the user in using our app.'
                        
            }]


            from langchain_google_genai import ChatGoogleGenerativeAI
            
            llm = ChatGoogleGenerativeAI(temperature=0, model="gemini-pro", convert_system_message_to_human=True,google_api_key=GOOGLE_API_KEY)
            lc_messages = convert_openai_messages(prompt)
            report = llm.invoke(lc_messages).content

            print(report)
            return report
        
 

    

