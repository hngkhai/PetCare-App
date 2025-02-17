# Software Engineering Course Group Project
# at Nanyang Technological University 

# Chatbot Module for PetCare App
## developed by Hng Cherng Khai

This repository contains the chatbot module developed for the PetCare App—a group project where my primary responsibility was implementing the chatbot functionalities. The module is designed to assist users with app navigation and answer pet care-related queries through dynamic API integrations.

---
## Demo

A full demo video of the application is available on YouTube.

Here's the youtube link: (https://www.youtube.com/watch?v=-q9BEjN1NRE)

**Note:** My features demo starts at the **8:10** timestamp in the video.

---

## Overview

The chatbot module comprises two core components:

- **GuideBot:**  
  Assists users with app navigation by extracting feature details from a PDF file and invoking the Gemini API.  
- **PetBuddy:**  
  Provides responses to pet care-related queries by integrating data from online sources using the Tavily API along with the Gemini API.

---

## Key Features

- **Dual-Mode Operation:**  
  - *GuideBot* for app guidance  
  - *PetBuddy* for pet care advice

- **API Integrations:**  
  - **Gemini API:** Generates responses from a PDF-based knowledge base and other dynamic content.  
  - **Tavily API:** Retrieves online information for pet care queries.

- **Input Validation:**  
  Verifies that user prompts are relevant (e.g., distinguishing between pet care questions and map location searches) and routes requests accordingly.

- **Robust Error Handling:**  
  Provides fallback messages (e.g., "Error occurred. Please try again later.") when external APIs or backend services are unavailable.

---
## Project Tech Stack
![image](https://github.com/user-attachments/assets/2aa44cc4-2161-4361-bc2e-8150c515a556)

## Architecture & Implementation
![image](https://github.com/user-attachments/assets/a64b9679-46ad-42c7-a1af-22986bd58f94)


### Data Flow Overview
1. **User Input:**  
   The user submits a query via the chatbot interface.
2. **Validation & Routing:**  
   The system checks if the query is for app guidance or pet care.
3. **API Invocation:**  
   - For GuideBot, the Gemini API is called to extract information from the PDF.
   - For PetBuddy, both the Tavily and Gemini APIs are invoked to generate a comprehensive answer.
4. **Response Delivery:**  
   The generated response is displayed in the chatbot interface.
5. **Error Scenarios:**  
   If any API is unreachable, a standard error message is returned.

---


