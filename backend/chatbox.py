import os
from openai import OpenAI
from dotenv import load_dotenv

def run_chat():
    # 1. 加载环境变量 (读取 .env 文件)
    load_dotenv()
    api_key = os.getenv("DEEPSEEK_API_KEY")

    if not api_key:
        print("⚠️ 错误: 找不到 DEEPSEEK_API_KEY，请检查 .env 文件！")
        return

    # 2. 初始化 DeepSeek 客户端 (使用 OpenAI 兼容格式)
    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")
    model_name = "deepseek-chat"

    # 3. 论文上下文数据
    paper_title = "Cross-lingual Offensive Language Detection: A Systematic Review"
    paper_abstract = "The growing prevalence and rapid evolution of offensive language in social media amplify the complexities of detection, particularly highlighting the challenges in identifying such content across diverse languages. This survey presents a systematic and comprehensive exploration of Cross-Lingual Transfer Learning (CLTL) techniques..."

    # 4. 构建系统人设指令 (System Prompt)
    system_instruction = f"""
    You are a professional academic assistant. 
    Answer questions based ONLY on the paper context provided below.
    If the answer is not in the context, politely inform the user.
    
    --- PAPER CONTEXT ---
    [Title]: {paper_title}
    [Abstract]: {paper_abstract}
    ---------------------
    
    Answer concisely and clearly in English.
    """

    # 5. 初始化对话历史 (这是实现 Memory 的核心)
    # 所有的对话记录都会存入这个列表，每次请求都会发给 DeepSeek
    messages = [
        {"role": "system", "content": system_instruction}
    ]

    print("="*60)
    print(f"📄 Paper Loaded: {paper_title}")
    print(f"🚀 Engine: DeepSeek ({model_name})")
    print("="*60)
    print("🤖 AI is ready! (Type 'q' to quit)\n")

    # 6. 交互循环
    while True:
        user_input = input("🧑‍🎓 You: ")
        
        if user_input.lower() in ['q', 'quit', 'exit']:
            print("👋 Goodbye!")
            break
            
        if not user_input.strip():
            continue
            
        # 将用户的提问加入历史记录
        messages.append({"role": "user", "content": user_input})
        
        print("💭 AI is thinking (DeepSeek)...")
        try:
            # 发送请求
            response = client.chat.completions.create(
                model=model_name,
                messages=messages,
                stream=False
            )
            
            ai_reply = response.choices[0].message.content
            print(f"✨ AI: {ai_reply}\n")
            
            # 将 AI 的回复也加入历史记录，这样下一轮对话它就记得刚才聊了什么
            messages.append({"role": "assistant", "content": ai_reply})
            
        except Exception as e:
            print(f"❌ API Error: {e}\n")

if __name__ == "__main__":
    run_chat()