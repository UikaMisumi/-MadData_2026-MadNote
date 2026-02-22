# MadData26 - MadNote: The Personalized Academic Discovery Platform

##  Inspiration
Navigating the endless sea of academic papers can be overwhelming for researchers and students. We realized there was a lack of modern, engaging tools to discover and digest academic literature. We wanted to build a platform that feels as intuitive as a social media feed, but is strictly tailored for academic research—helping users discover, explore, and interact with complex knowledge seamlessly.

##  What it does
MadNote is an intelligent, personalized academic recommendation platform designed to transform how you find and read papers.

* **Discover-For-You Feed**: A custom recommendation engine ranks a curated dataset of 550+ papers based on primary/secondary topic matching, keyword overlap, publication freshness, and community popularity.
* **AI Summaries & Paper Chat**: Every paper features an AI-generated concise summary. Furthermore, users can chat directly with the paper to ask specific questions, clarifying complex methodologies instantly.
* **Global Knowledge Graph**: We visualize the connections between different research papers using a TF-IDF and cosine similarity graph, allowing users to visually explore related works.
* **Community Interactions**: Users can like, save, and leave nested comments or replies on papers, building an active academic discussion community.

## How we built it
We architected MadNote with a robust, modern tech stack:

* **Frontend**: Built as a responsive Single Page Application using **React** and **Vite**. We utilized **Cytoscape** and **ECharts** to render the complex paper similarity graphs smoothly in the browser.
* **Backend & AI**: The core API is powered by **Python and FastAPI**. We implemented secure JWT authentication and dynamic pagination. For the LLM capabilities (summarization and chat), we integrated the DeepSeek API to handle complex academic reasoning efficiently.
* **Data & Algorithm**: We utilized `scikit-learn` (TfidfVectorizer & NearestNeighbors) on the backend to dynamically compute paper similarities based on their abstracts. Our ranking algorithm assigns dynamic weights to user preferences (like "survey" or "practical" methodology preferences) to serve the most relevant content.

## Challenges we ran into
* **Transitioning to a Data-Driven Architecture**: Moving the frontend from local storage mocking to a fully dynamic REST API with infinite scrolling required careful state management.
* **Graph Optimization**: Calculating and rendering a dense similarity network for hundreds of papers was computationally heavy. We optimized this by implementing TruncatedSVD for dimensionality reduction and caching the graph output locally.

## Accomplishments that we're proud of
* Successfully deploying a hybrid recommendation algorithm that balances content similarity with user engagement metrics (likes, saves, citations).
* Building a completely interactive "Chat with Paper" feature that lowers the barrier to understanding complex scientific concepts.

## What we learned
* Deepened our understanding of integrating Large Language Models seamlessly into traditional web applications.
* Gained practical experience in designing and tuning content-based recommendation systems and handling natural language data with TF-IDF and vector similarity.

## What's next for MadNote
* **Live Paper Ingestion**: Expanding the database beyond the initial dataset by scraping or integrating with open APIs like ArXiv.
* **Collaborative Filtering**: Enhancing the recommendation engine by analyzing what similar users are liking and saving.
* **Enhanced RAG pipelines**: Improving the accuracy of the paper chatbot by implementing an advanced Retrieval-Augmented Generation pipeline.
