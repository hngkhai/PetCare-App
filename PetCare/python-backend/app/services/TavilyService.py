import logging
from langchain_community.utilities.tavily_search import TavilySearchAPIWrapper
from langchain_community.tools.tavily_search import TavilySearchResults
from dotenv import load_dotenv
import os
load_dotenv(dotenv_path='.env')
# API keys setup
TAVILY_API_KEY = os.getenv('TAVILY_API_KEY')
print(TAVILY_API_KEY)
TAVILY_API_KEY="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"
class TavilyService:
    def __init__(self):
        self.search_api = TavilySearchAPIWrapper(tavily_api_key=TAVILY_API_KEY)
        self.description =  ("A search engine optimized for comprehensive, accurate, "
                       "and trusted results. Useful for answering questions about "
                       "current events or recent information.")
        self.tavily_tool = TavilySearchResults(api_wrapper=self.search_api, description=self.description, search_depth="advanced")


    def search_tavily(self, query: str) -> str:
        try:
            result = self.tavily_tool.invoke({"query": query})
            if not result:
                return "No results returned from Tavily Search."
            return result 
        except Exception as e:
            logging.error(f"Error searching Tavily: {e}")
            # Check for API unavailability based on the exception message
            if "unavailable" in str(e).lower() or "failed to connect" in str(e).lower():
                return "I'm sorry, but the Tavily service is currently unavailable. Please try again later."
            return "Error occurred. Please try again later."
