# MadData26 - MadNote: The Personalized Academic Discovery Platform
![MadNote](madnote.png)
##  Inspiration
Navigating the endless sea of academic papers can be overwhelming for researchers and students. We realized there was a lack of modern, engaging tools to discover and digest academic literature. We wanted to build a platform that feels as intuitive and addictive as a social media feed (like TikTok or Xiaohongshu), but is strictly tailored for academic research—helping users discover, explore, and interact with complex knowledge seamlessly.

##  What it does
MadNote is an intelligent, personalized academic recommendation platform designed to transform how you find and read papers.

* **"Discover-For-You" Social Feed**: A custom recommendation engine ranks a highly curated dataset of 550 papers (across 5 core AI/Tech domains) based on primary/secondary topic matching, keyword overlap, publication freshness, and community popularity.
* **LLM-Reframed Summaries**: Dry academic abstracts are transformed into viral, digestible, emoji-rich social media posts to lower the reading barrier.
* **Multi-Turn Paper Chat**: Users can chat directly with the paper using our DeepSeek-powered AI assistant. The bot features contextual memory, allowing users to ask follow-up questions to clarify complex methodologies instantly.
* **Global Knowledge Graph**: We visualize the connections between different research papers using a TF-IDF and cosine similarity graph, allowing users to visually explore related works.
* **Community Interactions**: Users can like, save, and leave nested comments on papers, building an active academic discussion community.

##  How we built it
We architected MadNote with a robust, modern tech stack and a heavy focus on data engineering:

###  Architecture Design: Offline vs. Online Separation
To ensure maximum scalability and a lightning-fast user experience, we intentionally separated our heavy data pipeline from our live backend server:
* **Heavy Offline Processing**: We ran **PyTorch**, **Transformers**, and **KeyBERT** exclusively in an offline Jupyter/A100 GPU environment. This isolated pipeline handled the heavy lifting—running Mistral-7B to rewrite 550+ abstracts and extract N-gram keywords—and exported the clean, finalized data as lightweight JSON artifacts.
* **Lightweight Online Serving**: Our live backend environment completely excludes bulky deep-learning frameworks. The `FastAPI` server boots instantly, dynamically serving the pre-processed JSON data, running lightweight `scikit-learn` recommendation algorithms, and routing user chat queries to the highly-optimized DeepSeek API. 

###  Tech Stack
* **Automated Data Pipeline (The Secret Sauce)**: We orchestrated a fully automated offline data pipeline using **Jupyter Notebooks**. 
  1. We sourced and dynamically sampled papers from HuggingFace (`arxiv-metadata-snapshot`) across 5 core tech domains. 
  2. To create the "social media" vibe, we deployed **`Mistral-7B-Instruct-v0.3`** (4-bit quantized on an A100 GPU) to rewrite dry abstracts into engaging, emoji-rich JSON formats. 
  3. We utilized **`KeyBERT`** for precise n-gram keyword extraction to power our graph and search engine. 
  4. Finally, we engineered a robust **3-tier fallback URL fetcher** (Semantic Scholar API → ArXiv API → Google Scholar Direct Link) equipped with `difflib` similarity validation (≥85% threshold) to reliably guarantee accurate Open Access PDF links for every paper.
* **Frontend (React + Vite & Data Visualization)**: 
  * **Architecture & Performance**: Built as a blazing-fast Single Page Application (SPA) using **React** and **Vite**. We implemented custom React Hooks (e.g., `useInfiniteScroll`) to lazily load our massive paper feed without compromising frame rates, and utilized the **Context API** for seamless global state management (Authentication, Theme, and Post caching).
  * **Interactive Knowledge Graph**: To make academic exploration visual, we integrated **Cytoscape.js** and **ECharts**. These libraries render our pre-calculated similarity matrices into a highly interactive node-graph, allowing users to drag, zoom, and visually discover connected papers based on TF-IDF proximity.

* **Backend & AI Integration (FastAPI + DeepSeek)**: 
  * **High-Concurrency API**: The core RESTful backend is powered by **Python and FastAPI** (running on Uvicorn). It handles complex routing for user profiles, paginated feeds, and nested community comments.
  * **Enterprise-Grade Security**: We built a stateless authentication flow using JSON Web Tokens (**JWT**) via `python-jose`, coupled with `passlib` and `bcrypt` for secure, salted password hashing.
  * **Context-Aware LLM Chatbot**: For the "Chat with Paper" feature, we integrated the highly logical **DeepSeek API** (`deepseek-chat`). We engineered a custom conversation handler that strictly injects the specific paper's abstract into the system prompt and manually orchestrates a sliding window of the `messages` list to achieve seamless **Multi-Turn Memory**.

* **Recommendation Engine & NLP (scikit-learn)**: 
  * **Vectorization & Similarity**: We utilized **`scikit-learn`** to build the core of our discovery algorithm. By passing the rewritten abstracts and KeyBERT tags through a `TfidfVectorizer`, we converted unstructured text into high-dimensional sparse matrices. 
  * **Nearest Neighbors Matching**: We then applied the `NearestNeighbors` algorithm (using Cosine Similarity) to mathematically map the distance between all 550+ papers in the database.
  * **Dynamic Ranking**: Instead of a simple chronological feed, our algorithm computes a composite ranking score. It dynamically weights content-based TF-IDF similarity against user-engagement metrics (such as simulated citations, user likes, and saves) to continuously serve the most relevant "For-You" content.
    
##  Challenges we ran into
* **Taming LLM Outputs at Scale**: Forcing the local Mistral-7B model to output strictly formatted JSON for 550 papers without hallucination required extensive Prompt Engineering and regex parsing.
* **Graph Optimization**: Calculating and rendering a dense similarity network for hundreds of papers was computationally heavy. We optimized this by implementing `TruncatedSVD` for dimensionality reduction and caching the graph output locally.
* **Transitioning to a Data-Driven Architecture**: Moving the frontend from local storage mocking to a fully dynamic FastAPI backend with infinite scrolling required careful state management.

##  Accomplishments that we're proud of
* Engineering a complete, end-to-end AI data pipeline: from raw ArXiv dumps to parsed keywords, Mistral-rewritten social content, and validated PDF links.
* Designing a production-ready "Offline Pipeline + Online API" architecture that guarantees server stability and low response latency.
* Successfully deploying a hybrid recommendation algorithm that balances content similarity with user engagement metrics (likes, saves, citations).

##  What we learned
* Deepened our understanding of integrating Large Language Models seamlessly into traditional web applications (both for offline pre-processing and real-time inference).
* Gained practical experience in designing and tuning content-based recommendation systems and handling natural language data with TF-IDF and vector similarity.

##  What's next for MadNote
* **Live Paper Ingestion**: Expanding the database beyond the initial dataset by scraping or integrating with open APIs like ArXiv for daily real-time updates.
* **Collaborative Filtering**: Enhancing the recommendation engine by analyzing what similar users are liking and saving.
* **Enhanced RAG Pipelines**: Upgrading the paper chatbot by implementing an advanced Retrieval-Augmented Generation (RAG) pipeline to allow querying across *multiple* papers simultaneously.

---

##  Dataset & Data Science Methodology
* **Primary Dataset**: We utilized the **`librarian-bots/arxiv-metadata-snapshot`** dataset from HuggingFace to source our initial 550+ high-quality academic papers across 5 core tech domains.
* **Appropriate Data Science Methods**: 
  * We engineered a robust data processing pipeline using **Pandas** and **NumPy** for data cleaning and quota-based sampling.
  * To power our recommendation and visualization engine, we applied advanced NLP and machine learning techniques, specifically using **`scikit-learn`** to build a **TF-IDF Vectorizer** and compute **Cosine Similarity** matrices.
  * We utilized **TruncatedSVD** for dimensionality reduction to efficiently render the global knowledge graph in the frontend.

## AI Usage & Citations
In strict compliance with the hackathon rules, we explicitly cite the use of the following Artificial Intelligence models and tools within our project:
* **Mistral-7B-Instruct-v0.3**: Deployed locally via HuggingFace for offline data pre-processing (reframing academic abstracts into JSON social media posts).
* **DeepSeek API (deepseek-chat)**: Integrated into our backend to power the real-time "Chat with Paper" multi-turn conversational assistant.
* **KeyBERT**: Used in our Python data pipeline for precise n-gram keyword extraction from raw text.
* **Claude (Anthropic)**: Used strictly as a pair-programming and ideation assistant to help format boilerplate code, debug frontend CSS, and refine project documentation during the hackathon.

## Originality & Hackathon Compliance
* **Built from Scratch**: The entire architecture, frontend SPA, backend API, and data pipeline were conceptualized and coded originally by our team strictly during the **MadData26 Hackathon** timeframe. 
* **Team Track**: This project is submitted under the **[General Track / Qualcomm Track]** by our dedicated team of **[Team Size, e.g., 4]** members.

## 📄 License
This project is licensed under the **MIT License**.

MIT License

Copyright (c) 2026 [SiPeng Chen：Githubid: UikaMisumi, Yuxin Feng: Githubid: dariafung, Lingfang Yuan: Githubid: lyuan57-web, Hao Wu: haowu0916edisonwu]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
