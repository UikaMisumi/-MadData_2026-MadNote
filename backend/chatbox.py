import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

def run_chat():
    # 1. Load the .env file
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key or api_key == "your_api_key_here":
        print("⚠️ FATAL ERROR: Valid GEMINI_API_KEY not found!")
        print("👉 Please ensure a .env file is created in the current directory.")
        return

    # 2. Initialize the Client in the MAIN scope so it stays ALIVE!
    client = genai.Client(api_key=api_key)

    # 3. Prepare Context
    paper_title = "Cross-lingual Offensive Language Detection: A Systematic Review"
    paper_abstract = "The growing prevalence and rapid evolution of offensive language in social media amplify the complexities of detection, particularly highlighting the challenges in identifying such content across diverse languages. This survey presents a systematic and comprehensive exploration of Cross-Lingual Transfer Learning (CLTL) techniques..."

    # 4. Build System Instruction
    system_instruction = f"""
    You are a highly intelligent and helpful academic AI assistant. 
    Your primary task is to answer the user's questions based ONLY on the paper context provided below.
    If the answer cannot be found in the context, clearly and politely inform the user.
    
    --- PAPER CONTEXT ---
    [Title]: {paper_title}
    [Abstract]: {paper_abstract}
    ---------------------
    
    Please answer concisely, accurately, and in the language the user speaks.
    """

    print("="*60)
    print(f"📄 Currently loaded paper: {paper_title}")
    print("="*60)
    print("🤖 AI Assistant is ready! You can start the multi-turn conversation (Type 'q' or 'quit' to exit)\n")

    # 5. Create a chat session 
    chat_session = client.chats.create(
        model="gemini-flash-lite-latest",
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.7, 
        )
    )

    # 6. Terminal interaction loop
    while True:
        user_input = input("🧑‍🎓 You: ")
        
        if user_input.lower() in ['q', 'quit', 'exit']:
            print("👋 Conversation ended. Goodbye!")
            break
            
        if not user_input.strip():
            continue
            
        print("💭 AI is thinking...")
        try:
            # Send message and get response
            response = chat_session.send_message(user_input)
            print(f"✨ AI: {response.text}\n")
        except Exception as e:
            print(f"❌ Request error occurred: {e}\n")

if __name__ == "__main__":
    run_chat()